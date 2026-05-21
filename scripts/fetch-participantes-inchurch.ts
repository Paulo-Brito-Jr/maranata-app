/**
 * Fetcher F08: puxa 1.290 participantes de células direto do fornecedor
 * InChurch via /api/v1/participants/ e popula ParticipanteCelula (quando
 * o membro existe no Maranata App) ou VisitanteCelula (quando não bate).
 *
 * Resolve gap das 798 linhas com celula_id=NULL no espelho — agora cada
 * registro tem cell_id real vindo do fornecedor.
 *
 * Idempotente: usa membershipId do InChurch como chave única.
 * Roda: pnpm tsx --env-file=.env.local scripts/fetch-participantes-inchurch.ts
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

type Participant = {
  id: number;
  cell: string | null;
  cell_id: number | null;
  full_name: string;
  photo: string | null;
  network: string | null;
  leader: string | null;
  profile_type: string | null;
  frequency_percentage: number | null;
  membership_id: number | null;
};

async function fetchPage(offset: number, limit = 100): Promise<{ objects: Participant[]; total: number }> {
  const url = `${BASE}/v1/participants/?limit=${limit}&offset=${offset}&order_by=id&fields=id,full_name,photo,cell,cell_id,network,leader,profile_type,frequency_percentage,membership_id`;
  // Server rejeita user-agent default do Node fetch — usar UA de curl pra contornar
  const res = await fetch(url, {
    headers: {
      Authorization: TOKEN,
      channel: "control_panel",
      "User-Agent": "curl/8.7.1",
      Accept: "*/*",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} em offset=${offset}`);
  const json = (await res.json()) as { meta: { total_count: number }; objects: Participant[] };
  return { objects: json.objects, total: json.meta.total_count };
}

async function fetchAll(): Promise<Participant[]> {
  const first = await fetchPage(0, 100);
  console.log(`Total: ${first.total} participantes`);
  const all: Participant[] = [...first.objects];
  for (let offset = 100; offset < first.total; offset += 100) {
    process.stdout.write(`  ${offset}/${first.total}\r`);
    const page = await fetchPage(offset, 100);
    all.push(...page.objects);
  }
  console.log(`  ✓ ${all.length} baixados                    `);
  return all;
}

async function main() {
  console.log("Carregando lookups do Maranata App...");
  const [celulas, membros] = await Promise.all([
    prisma.celula.findMany({
      where: { inchurchId: { not: null } },
      select: { id: true, inchurchId: true },
    }),
    prisma.membro.findMany({
      where: { inchurchId: { not: null } },
      select: { id: true, inchurchId: true },
    }),
  ]);
  const celulaByInchurch = new Map(celulas.map((c) => [c.inchurchId!, c.id]));
  const membroByInchurch = new Map(membros.map((m) => [m.inchurchId!, m.id]));
  console.log(`  ${celulas.length} células indexadas, ${membros.length} membros indexados`);

  console.log("\nBuscando participantes do fornecedor...");
  const participantes = await fetchAll();

  console.log("\nProcessando...");
  let inseridosPart = 0;
  let inseridosVis = 0;
  let pulados = 0;
  let semCelula = 0;
  let erros = 0;

  for (const p of participantes) {
    if (!p.cell_id) {
      semCelula++;
      continue;
    }
    const celulaId = celulaByInchurch.get(p.cell_id);
    if (!celulaId) {
      semCelula++;
      continue;
    }

    const membroId = membroByInchurch.get(p.id);

    try {
      if (membroId) {
        // É um membro conhecido — usa ParticipanteCelula real
        const existing = await prisma.participanteCelula.findUnique({
          where: { celulaId_membroId: { celulaId, membroId } },
        });
        if (existing) {
          pulados++;
          continue;
        }
        await prisma.participanteCelula.create({
          data: { celulaId, membroId, ativo: true },
        });
        inseridosPart++;
      } else {
        // Não bate com Membro — vai como VisitanteCelula (avulso)
        const existing = await prisma.visitanteCelula.findFirst({
          where: { celulaId, nome: p.full_name },
        });
        if (existing) {
          pulados++;
          continue;
        }
        await prisma.visitanteCelula.create({
          data: {
            celulaId,
            nome: p.full_name,
            visitouEm: new Date(),
            observacoes: `${p.profile_type ?? "participante"} — InChurch id ${p.id} (sem match em Membro)`,
          },
        });
        inseridosVis++;
      }
    } catch (e) {
      erros++;
      if (process.env.VERBOSE) console.error(p.full_name, (e as Error).message);
    }
  }

  console.log("\n=== RESULTADO ===");
  console.log(`Total InChurch:        ${participantes.length}`);
  console.log(`ParticipanteCelula:    ${inseridosPart} novos`);
  console.log(`VisitanteCelula:       ${inseridosVis} novos (sem Membro vinculado)`);
  console.log(`Pulados (já existiam): ${pulados}`);
  console.log(`Sem célula no DB:      ${semCelula}`);
  console.log(`Erros:                 ${erros}`);

  // Contagens finais
  const [pCount, vCount] = await Promise.all([
    prisma.participanteCelula.count(),
    prisma.visitanteCelula.count(),
  ]);
  console.log(`\nTotal ParticipanteCelula agora: ${pCount}`);
  console.log(`Total VisitanteCelula agora:    ${vCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
