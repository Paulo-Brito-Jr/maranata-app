/**
 * F11 — corrige igrejaId de LancamentoFinanceiro usando tertiarygroup.id
 * do endpoint /api/v1/financial_entry/ do InChurch.
 * Faz UPDATE em batch via inchurchId match.
 *
 * Roda: pnpm tsx --env-file=.env.local scripts/fix-lancamentos-igreja.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const TOKEN = process.env.INCHURCH_API_TOKEN!;
const BASE = process.env.INCHURCH_BASE_API ?? "https://inradar.com.br/api";
const newDbUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL!;

if (!TOKEN) {
  console.error("INCHURCH_API_TOKEN ausente");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: newDbUrl }) });

type Entry = {
  id: number;
  tertiarygroup: { id: number; name: string } | null;
};

async function fetchEntries(entryType: "credit" | "debit"): Promise<Entry[]> {
  const all: Entry[] = [];
  const limit = 100;
  let offset = 0;
  while (true) {
    const url = `${BASE}/v1/financial_entry/?entry_type=${entryType}&limit=${limit}&offset=${offset}&order_by=id`;
    const res = await fetch(url, {
      headers: {
        Authorization: TOKEN,
        channel: "control_panel",
        "User-Agent": "curl/8.7.1",
        Accept: "*/*",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} em ${entryType} offset=${offset}`);
    const json = (await res.json()) as { meta: { total_count: number }; objects: Entry[] };
    all.push(...json.objects);
    process.stdout.write(`  ${entryType}: ${all.length}/${json.meta.total_count}\r`);
    if (all.length >= json.meta.total_count) break;
    offset += limit;
  }
  console.log(`  ${entryType}: ${all.length} baixados                    `);
  return all;
}

async function main() {
  console.log("Carregando igrejas...");
  const igrejas = await prisma.igreja.findMany({
    where: { inchurchId: { not: null } },
    select: { id: true, inchurchId: true, nome: true },
  });
  const igrejaByInchurch = new Map(igrejas.map((i) => [i.inchurchId!, { id: i.id, nome: i.nome }]));
  console.log(`  ${igrejas.length} igrejas indexadas`);

  console.log("\nBuscando lançamentos do fornecedor...");
  const credits = await fetchEntries("credit");
  const debits = await fetchEntries("debit");
  const entries = [...credits, ...debits];
  console.log(`Total entries: ${entries.length} (credits ${credits.length} + debits ${debits.length})`);

  console.log("\nAplicando UPDATEs...");
  let atualizados = 0;
  let semIgreja = 0;
  let semMatch = 0;
  let pulados = 0;

  const tijuca = igrejas.find((i) => i.inchurchId === 25524) ?? igrejas[0];

  for (const e of entries) {
    if (!e.tertiarygroup) {
      semIgreja++;
      continue;
    }
    const ig = igrejaByInchurch.get(e.tertiarygroup.id);
    if (!ig) {
      semMatch++;
      continue;
    }
    // UPDATE só se mudar — query existing
    const lanc = await prisma.lancamentoFinanceiro.findUnique({
      where: { inchurchId: e.id },
      select: { id: true, igrejaId: true },
    });
    if (!lanc) {
      pulados++;
      continue;
    }
    if (lanc.igrejaId === ig.id) {
      // já bate
      continue;
    }
    // Se igrejaId atual é Tijuca fallback E o real é outra, atualiza
    if (lanc.igrejaId === tijuca.id && ig.id !== tijuca.id) {
      await prisma.lancamentoFinanceiro.update({
        where: { id: lanc.id },
        data: { igrejaId: ig.id },
      });
      atualizados++;
    } else if (lanc.igrejaId !== ig.id) {
      // qualquer mismatch → atualiza pro fornecedor
      await prisma.lancamentoFinanceiro.update({
        where: { id: lanc.id },
        data: { igrejaId: ig.id },
      });
      atualizados++;
    }
  }

  console.log("\n=== RESULTADO F11 ===");
  console.log(`Lançamentos InChurch:    ${entries.length}`);
  console.log(`UPDATEs aplicados:       ${atualizados}`);
  console.log(`Já corretos / pulados:   ${pulados}`);
  console.log(`Sem tertiarygroup:       ${semIgreja}`);
  console.log(`Igreja não bate no DB:   ${semMatch}`);

  // Distribuição final por igreja
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
