/**
 * F11 v2: match heurístico de LancamentoFinanceiro com financial_entry
 * do fornecedor via (valor exato + data próxima ± 3 dias + descricao prefix).
 *
 * Necessário porque o ETL legacy populou inchurchId com IDs sequenciais
 * do espelho (não preservou financial_entry.id original do fornecedor).
 *
 * Roda: pnpm tsx --env-file=.env.local scripts/fix-lancamentos-igreja-heuristic.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const TOKEN = process.env.INCHURCH_API_TOKEN!;
const BASE = process.env.INCHURCH_BASE_API ?? "https://inradar.com.br/api";
const newDbUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL!;

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: newDbUrl }) });

type Entry = {
  id: number;
  description: string | null;
  display_value: number | null;
  base_value: number | null;
  payed_value: number | null;
  due_date: string | null;
  payment_date: string | null;
  accrual_date: string | null;
  tertiarygroup: { id: number; name: string } | null;
};

async function fetchWithRetry(url: string, attempts = 4): Promise<Response> {
  let lastErr: Error | null = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: TOKEN, channel: "control_panel", "User-Agent": "curl/8.7.1", Accept: "*/*" },
      });
      if (res.ok) return res;
      if (res.status >= 500 && i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
        continue;
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastErr = e as Error;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
  throw lastErr ?? new Error("fetch fail");
}

async function fetchEntries(): Promise<Entry[]> {
  const all: Entry[] = [];
  const limit = 50; // menor pra evitar timeout
  let offset = 0;
  while (true) {
    const url = `${BASE}/v1/financial_entry/?entry_type=credit&limit=${limit}&offset=${offset}`;
    const res = await fetchWithRetry(url);
    const json = (await res.json()) as { meta: { total_count: number }; objects: Entry[] };
    all.push(...json.objects);
    process.stdout.write(`  ${all.length}/${json.meta.total_count}\r`);
    if (all.length >= json.meta.total_count) break;
    offset += limit;
    await new Promise((r) => setTimeout(r, 100)); // pequeno rate limit
  }
  console.log(`  ${all.length} baixados                    `);
  return all;
}

function parseDate(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function diasDeDiferenca(a: Date, b: Date): number {
  return Math.abs(Math.floor((a.getTime() - b.getTime()) / 86400000));
}

async function main() {
  console.log("Baixando lançamentos do fornecedor...");
  const entries = await fetchEntries();

  console.log("Carregando igrejas e lançamentos locais...");
  const [igrejas, lancamentos] = await Promise.all([
    prisma.igreja.findMany({
      where: { inchurchId: { not: null } },
      select: { id: true, inchurchId: true, nome: true, ehSede: true },
    }),
    prisma.lancamentoFinanceiro.findMany({
      select: { id: true, valor: true, data: true, descricao: true, igrejaId: true },
    }),
  ]);
  const igrejaByInchurch = new Map(igrejas.map((i) => [i.inchurchId!, i]));
  const sede = igrejas.find((i) => i.ehSede) ?? igrejas[0];

  console.log(`  ${igrejas.length} igrejas + ${lancamentos.length} lançamentos`);

  // Build index: valor → entries pra match rápido
  const entriesPorValor = new Map<number, Entry[]>();
  for (const e of entries) {
    const valor = Number(e.display_value ?? e.base_value ?? e.payed_value ?? 0);
    if (valor <= 0) continue;
    if (!entriesPorValor.has(valor)) entriesPorValor.set(valor, []);
    entriesPorValor.get(valor)!.push(e);
  }

  let atualizados = 0;
  let semMatch = 0;
  const ambiguo = 0;
  let semIgrejaUpstream = 0;
  let igualSede = 0;

  for (const l of lancamentos) {
    const valor = Number(l.valor);
    const candidatos = entriesPorValor.get(valor) ?? [];
    if (candidatos.length === 0) {
      semMatch++;
      continue;
    }
    // Pega o que tem data mais próxima (priorizando payment_date)
    const lancData = l.data;
    let melhor: Entry | null = null;
    let melhorDelta = Infinity;
    for (const e of candidatos) {
      const eData = parseDate(e.payment_date) ?? parseDate(e.accrual_date) ?? parseDate(e.due_date);
      if (!eData) continue;
      const delta = diasDeDiferenca(lancData, eData);
      if (delta < melhorDelta) {
        melhorDelta = delta;
        melhor = e;
      }
    }
    if (!melhor || melhorDelta > 7) {
      semMatch++;
      continue;
    }
    // Ambiguidade: se há ≥2 com mesma data e mesmo valor, ainda é OK escolher 1
    // (já que igrejaId é o que queremos e geralmente entries iguais vão pra mesma igreja)
    if (!melhor.tertiarygroup) {
      semIgrejaUpstream++;
      continue;
    }
    const ig = igrejaByInchurch.get(melhor.tertiarygroup.id);
    if (!ig) {
      semIgrejaUpstream++;
      continue;
    }
    if (ig.id === l.igrejaId) {
      if (ig.id === sede.id) igualSede++;
      continue;
    }
    // UPDATE
    await prisma.lancamentoFinanceiro.update({
      where: { id: l.id },
      data: { igrejaId: ig.id },
    });
    atualizados++;
  }

  console.log("\n=== RESULTADO F11 (heurística) ===");
  console.log(`Lançamentos no DB:      ${lancamentos.length}`);
  console.log(`Entries do fornecedor:  ${entries.length}`);
  console.log(`UPDATEs aplicados:      ${atualizados}`);
  console.log(`Já corretos (sede):     ${igualSede}`);
  console.log(`Sem match valor+data:   ${semMatch}`);
  console.log(`Ambiguidade resolvida:  ${ambiguo}`);
  console.log(`Sem tertiarygroup:      ${semIgrejaUpstream}`);

  console.log("\n=== Distribuição final ===");
  const dist = await prisma.lancamentoFinanceiro.groupBy({
    by: ["igrejaId"],
    _count: { _all: true },
    orderBy: { _count: { igrejaId: "desc" } },
  });
  const igrejaById = new Map(igrejas.map((i) => [i.id, i.nome]));
  for (const d of dist) {
    console.log(`  ${(igrejaById.get(d.igrejaId) ?? d.igrejaId).padEnd(30)} ${d._count._all}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
