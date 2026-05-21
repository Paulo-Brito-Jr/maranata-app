/**
 * F09: enriquece Pregacao com descricao, pregador real, capa, execucoes
 * via endpoint /api/v2/inchurch_preach/ do fornecedor (descoberto via
 * dev-browser HAR).
 *
 * Match por Pregacao.inchurchId = preach.id.
 * Roda: pnpm tsx --env-file=.env.local scripts/fetch-pregacoes-inchurch.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const TOKEN = process.env.INCHURCH_API_TOKEN!;
const BASE = process.env.INCHURCH_BASE_API ?? "https://inradar.com.br/api";
const newDbUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL!;

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: newDbUrl }) });

type Preach = {
  id: number;
  title: string;
  description: string | null;
  author: string | null;
  image: string | null;
  thumbnail: string | null;
  total_plays: number | null;
  url_video: string | null;
  url_audio: string | null;
  published_at: string | null;
  is_published: boolean;
  tertiarygroup: { id: number } | null;
  categories: { id: number; title: string }[];
  series: { id: number; title: string } | null;
};

async function fetchAll(): Promise<Preach[]> {
  const all: Preach[] = [];
  const limit = 100;
  let offset = 0;
  while (true) {
    const url = `${BASE}/v2/inchurch_preach/?limit=${limit}&offset=${offset}`;
    const res = await fetch(url, {
      headers: { Authorization: TOKEN, channel: "control_panel", "User-Agent": "curl/8.7.1", Accept: "*/*" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} em offset=${offset}`);
    const json = (await res.json()) as { meta: { total_count: number }; objects: Preach[] };
    all.push(...json.objects);
    process.stdout.write(`  ${all.length}/${json.meta.total_count}\r`);
    if (all.length >= json.meta.total_count) break;
    offset += limit;
  }
  console.log(`  ${all.length} baixados                  `);
  return all;
}

function extractYoutubeId(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
  return m?.[1] ?? null;
}

async function main() {
  console.log("Baixando pregações do fornecedor...");
  const preaches = await fetchAll();

  console.log("Carregando lookups locais...");
  const [pregacoes, igrejas, categorias, series] = await Promise.all([
    prisma.pregacao.findMany({
      where: { inchurchId: { not: null } },
      select: { id: true, inchurchId: true, descricao: true, pregador: true },
    }),
    prisma.igreja.findMany({
      where: { inchurchId: { not: null } },
      select: { id: true, inchurchId: true },
    }),
    prisma.categoriaPregacao.findMany({
      select: { id: true, inchurchId: true, nome: true },
    }),
    prisma.seriePregacao.findMany({
      select: { id: true, inchurchId: true, titulo: true },
    }),
  ]);
  const pregByInchurch = new Map(pregacoes.map((p) => [p.inchurchId!, p]));
  const igrejaByInchurch = new Map(igrejas.map((i) => [i.inchurchId!, i.id]));
  const catByInchurch = new Map(categorias.filter((c) => c.inchurchId).map((c) => [c.inchurchId!, c.id]));
  const serieByInchurch = new Map(series.filter((s) => s.inchurchId).map((s) => [s.inchurchId!, s.id]));
  const serieByTitulo = new Map(series.map((s) => [s.titulo.toLowerCase(), s.id]));
  console.log(`  ${pregacoes.length} pregações indexadas`);

  let atualizadas = 0;
  let criadas = 0;
  let sinIgreja = 0;
  let erros = 0;

  for (const p of preaches) {
    try {
      const existing = pregByInchurch.get(p.id);
      const igrejaId = p.tertiarygroup ? igrejaByInchurch.get(p.tertiarygroup.id) ?? null : null;
      if (!igrejaId) sinIgreja++;

      const cat = p.categories?.[0];
      const categoriaId = cat ? catByInchurch.get(cat.id) ?? null : null;
      const serieId = p.series
        ? serieByInchurch.get(p.series.id) ?? serieByTitulo.get(p.series.title.toLowerCase()) ?? null
        : null;
      const youtubeId = extractYoutubeId(p.url_video);
      const pubAt = p.published_at ? new Date(p.published_at) : null;

      if (existing) {
        await prisma.pregacao.update({
          where: { id: existing.id },
          data: {
            descricao: p.description ?? existing.descricao ?? null,
            pregador: p.author ?? existing.pregador ?? null,
            capaUrl: p.thumbnail ?? p.image ?? null,
            execucoes: p.total_plays ?? 0,
            youtubeId: youtubeId ?? undefined,
            publicada: p.is_published,
            ...(categoriaId ? { categoriaId } : {}),
            ...(serieId ? { serieId } : {}),
            ...(igrejaId ? { igrejaId } : {}),
            ...(pubAt ? { data: pubAt } : {}),
          },
        });
        atualizadas++;
      } else {
        // Pregação nova no fornecedor — criar se conseguirmos igreja
        if (!igrejaId) {
          erros++;
          continue;
        }
        await prisma.pregacao.create({
          data: {
            inchurchId: p.id,
            igrejaId,
            categoriaId,
            serieId,
            titulo: p.title,
            descricao: p.description,
            pregador: p.author,
            youtubeId,
            capaUrl: p.thumbnail ?? p.image,
            execucoes: p.total_plays ?? 0,
            data: pubAt,
            publicada: p.is_published,
          },
        });
        criadas++;
      }
    } catch (e) {
      erros++;
      if (process.env.VERBOSE) console.error(p.title.slice(0, 40), (e as Error).message);
    }
  }

  console.log("\n=== RESULTADO F09 ===");
  console.log(`Pregações fornecedor: ${preaches.length}`);
  console.log(`Atualizadas:          ${atualizadas}`);
  console.log(`Criadas (novas):      ${criadas}`);
  console.log(`Sem igreja no DB:     ${sinIgreja}`);
  console.log(`Erros:                ${erros}`);

  const total = await prisma.pregacao.count();
  const comPregador = await prisma.pregacao.count({ where: { pregador: { not: null } } });
  const comDesc = await prisma.pregacao.count({ where: { descricao: { not: null } } });
  console.log(`\nTotal pregações no DB: ${total} (${comPregador} com pregador, ${comDesc} com descrição)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
