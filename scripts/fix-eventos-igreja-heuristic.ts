/**
 * Corrige Evento.igrejaId usando heurística por endereço.
 * Eventos do InChurch não têm tertiarygroup populado, mas têm
 * address_full (rua + bairro + cidade). Match contra Igreja.endereco.
 *
 * Roda: pnpm tsx --env-file=.env.local scripts/fix-eventos-igreja-heuristic.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const TOKEN = process.env.INCHURCH_API_TOKEN!;
const BASE = process.env.INCHURCH_BASE_API ?? "https://inradar.com.br/api";
const newDbUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL!;

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: newDbUrl }) });

type Event = {
  id: number;
  name: string;
  address_full: string | null;
  tertiarygroup: { id: number } | null;
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

async function fetchEvents(): Promise<Event[]> {
  const all: Event[] = [];
  const limit = 50;
  let offset = 0;
  while (true) {
    const url = `${BASE}/v2/inchurch_event/?limit=${limit}&offset=${offset}`;
    const res = await fetchWithRetry(url);
    const json = (await res.json()) as { meta: { total_count: number }; objects: Event[] };
    all.push(...json.objects);
    process.stdout.write(`  ${all.length}/${json.meta.total_count}\r`);
    if (all.length >= json.meta.total_count) break;
    offset += limit;
    await new Promise((r) => setTimeout(r, 100));
  }
  console.log(`  ${all.length} baixados                  `);
  return all;
}

function normaliza(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Extrai bairro/cidade chave do endereço pra match
function extrairKeywords(addr: string): string[] {
  const n = normaliza(addr);
  return n.split(" ").filter((w) => w.length >= 4);
}

async function main() {
  console.log("Baixando eventos do fornecedor (com address_full)...");
  const events = await fetchEvents();

  console.log("\nCarregando igrejas...");
  const igrejas = await prisma.igreja.findMany({
    where: { ativa: true },
    select: { id: true, nome: true, endereco: true, cidade: true, inchurchId: true, ehSede: true },
  });

  // Mapas de keywords distintas por igreja (bairro / nome / rua)
  type IgrejaIdx = { id: string; nome: string; keywords: string[]; ehSede: boolean };
  const igrejaIdx: IgrejaIdx[] = igrejas.map((i) => {
    const partes = [i.nome, i.endereco ?? "", i.cidade ?? ""].join(" ");
    const kw = extrairKeywords(partes);
    return { id: i.id, nome: i.nome, keywords: kw, ehSede: i.ehSede };
  });
  const sedeIgrejaId = igrejas.find((i) => i.ehSede)?.id ?? igrejas[0].id;

  console.log(`  ${igrejas.length} igrejas indexadas`);

  let atualizados = 0;
  let semAddress = 0;
  let semMatch = 0;
  let mantemTijuca = 0;

  for (const e of events) {
    if (!e.address_full) {
      semAddress++;
      continue;
    }
    const addrNorm = normaliza(e.address_full);
    // Conta matches por igreja (1 ponto por keyword presente)
    let melhor: IgrejaIdx | null = null;
    let melhorScore = 0;
    for (const ig of igrejaIdx) {
      if (ig.keywords.length === 0) continue;
      let score = 0;
      for (const kw of ig.keywords) {
        if (addrNorm.includes(kw)) score++;
      }
      if (score > melhorScore) {
        melhorScore = score;
        melhor = ig;
      }
    }
    if (!melhor || melhorScore < 2) {
      semMatch++;
      continue;
    }

    // Atualiza só se ID novo é diferente do atual
    const current = await prisma.evento.findUnique({
      where: { inchurchId: e.id },
      select: { id: true, igrejaId: true },
    });
    if (!current || current.igrejaId === melhor.id) {
      if (current?.igrejaId === sedeIgrejaId) mantemTijuca++;
      continue;
    }
    await prisma.evento.update({
      where: { id: current.id },
      data: { igrejaId: melhor.id },
    });
    atualizados++;
  }

  console.log("\n=== RESULTADO Eventos heurístico ===");
  console.log(`Eventos fornecedor:   ${events.length}`);
  console.log(`UPDATEs aplicados:    ${atualizados}`);
  console.log(`Mantidos no fallback: ${mantemTijuca}`);
  console.log(`Sem address_full:     ${semAddress}`);
  console.log(`Sem match (score<2):  ${semMatch}`);

  console.log("\n=== Distribuição final por igreja ===");
  const dist = await prisma.evento.groupBy({
    by: ["igrejaId"],
    _count: { _all: true },
    orderBy: { _count: { igrejaId: "desc" } },
  });
  const igrejaById = new Map(igrejas.map((i) => [i.id, i.nome]));
  for (const d of dist) {
    console.log(`  ${(igrejaById.get(d.igrejaId) ?? d.igrejaId).padEnd(28)} ${d._count._all}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
