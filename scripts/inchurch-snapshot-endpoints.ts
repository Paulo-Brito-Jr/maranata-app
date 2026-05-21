/**
 * Captura snapshot dos endpoints InChurch ainda não cobertos por ETL.
 * Salva em InChurchSnapshot pra inventário/análise posterior.
 * Roda: pnpm tsx --env-file=.env.local scripts/inchurch-snapshot-endpoints.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const TOKEN = process.env.INCHURCH_API_TOKEN!;
const BASE = process.env.INCHURCH_BASE_API ?? "https://inradar.com.br/api";
const newDbUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL!;

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: newDbUrl }) });

const ENDPOINTS = [
  { key: "entry_source", path: "/v1/entry_source/", desc: "Fontes de receita (1055)" },
  { key: "entry_subcategory", path: "/v1/entry_subcategory/", desc: "Sub-categorias financeiras (7)" },
  { key: "standard_message", path: "/v1/standard_message/", desc: "Mensagens padrão (3)" },
  { key: "inchurch_channel", path: "/v1/inchurch_channel/", desc: "Canais TV (1)" },
  { key: "supervisor_type", path: "/v1/supervisor_type/", desc: "Tipos supervisor (1)" },
  { key: "download_category", path: "/v2/download_category/", desc: "Categorias download (1)" },
  { key: "event_category", path: "/v2/event_category/", desc: "Categorias evento v2 (11)" },
  { key: "preach_category", path: "/v2/preach_category/", desc: "Categorias pregação v2 (9)" },
  { key: "trail_v2", path: "/v2/trail/", desc: "Trilhas v2 (3)" },
  { key: "feeling", path: "/v1/feeling/", desc: "Tipos sentimento (9)" },
];

async function fetchAll(path: string): Promise<unknown[]> {
  const all: unknown[] = [];
  const limit = 200;
  let offset = 0;
  while (true) {
    const url = `${BASE}${path}?limit=${limit}&offset=${offset}`;
    const res = await fetch(url, {
      headers: { Authorization: TOKEN, channel: "control_panel", "User-Agent": "curl/8.7.1", Accept: "*/*" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} em ${path}`);
    const json = (await res.json()) as { meta?: { total_count: number }; objects?: unknown[] };
    all.push(...(json.objects ?? []));
    if (!json.meta || all.length >= json.meta.total_count) break;
    offset += limit;
  }
  return all;
}

async function main() {
  for (const ep of ENDPOINTS) {
    process.stdout.write(`  ${ep.key.padEnd(22)} `);
    try {
      const objects = await fetchAll(ep.path);
      await prisma.inChurchSnapshot.upsert({
        where: {
          // Sem unique constraint composta — usar findFirst+create/update
          id: `snap_${ep.key}`,
        },
        create: {
          id: `snap_${ep.key}`,
          tipo: "endpoint_snapshot",
          chave: ep.key,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          valorJson: { path: ep.path, desc: ep.desc, count: objects.length, objects } as any,
          capturadoEm: new Date(),
        },
        update: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          valorJson: { path: ep.path, desc: ep.desc, count: objects.length, objects } as any,
          capturadoEm: new Date(),
        },
      });
      console.log(`✓ ${objects.length} objetos capturados`);
    } catch (e) {
      console.log(`✗ ${(e as Error).message}`);
    }
  }

  console.log("\n=== Snapshots salvos em InChurchSnapshot ===");
  const all = await prisma.inChurchSnapshot.findMany({
    where: { tipo: "endpoint_snapshot" },
    orderBy: { capturadoEm: "desc" },
    select: { chave: true, capturadoEm: true },
  });
  console.log(all);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
