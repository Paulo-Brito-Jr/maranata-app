/**
 * Seed: banners permanentes de doação (impulsiona Safe2Pay recorrência).
 * Idempotente: upsert por titulo.
 * Roda: pnpm tsx --env-file=.env.local scripts/seed-banners-doacao.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL!;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const BANNERS = [
  {
    titulo: "Seja parceiro da Maranata",
    subtitulo: "Honre com seu dízimo. Doação recorrente segura via Safe2Pay.",
    imagemUrl: "https://maranata.app/banners/parceiro.jpg",
    linkUrl: "/doar",
    ordem: 1,
  },
  {
    titulo: "Maranata 2026 — Construindo juntos",
    subtitulo: "Conheça as campanhas de obra e missões.",
    imagemUrl: "https://maranata.app/banners/campanhas.jpg",
    linkUrl: "/doar",
    ordem: 2,
  },
];

async function main() {
  console.log(`Seedando ${BANNERS.length} banners de doação...`);
  for (const b of BANNERS) {
    const existing = await prisma.banner.findFirst({ where: { titulo: b.titulo } });
    if (existing) {
      await prisma.banner.update({
        where: { id: existing.id },
        data: { ...b, ativo: true, inicio: null, fim: null },
      });
      console.log(`  ✓ atualizado: ${b.titulo}`);
    } else {
      await prisma.banner.create({ data: { ...b, ativo: true, inicio: null, fim: null } });
      console.log(`  ✓ criado: ${b.titulo}`);
    }
  }
  console.log("Concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
