/**
 * Seed: 8 templates default de push notification.
 * Roda: tsx scripts/seed-push-templates.ts
 * Idempotente: usa upsert por nome.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL!;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const TEMPLATES = [
  {
    nome: "Bom dia Domingo",
    titulo: "🙏 Bom dia, família Maranata!",
    corpo: "Hoje é dia de adoração. Confira os horários da sua igreja.",
    url: "/eventos",
    alvoPadrao: "TODOS" as const,
  },
  {
    nome: "Quinta Viva com Cristo",
    titulo: "✨ Quinta Viva com Cristo — 20h",
    corpo: "Hoje tem palavra pra você. Estamos te esperando.",
    url: "/eventos",
    alvoPadrao: "TODOS" as const,
  },
  {
    nome: "Sexta Célula",
    titulo: "🤝 Sua célula te espera",
    corpo: "Boa sexta! Fim de semana é tempo de comunhão.",
    url: "/celulas",
    alvoPadrao: "MEMBROS" as const,
  },
  {
    nome: "Dia de Dízimo",
    titulo: "🌱 Hoje é dia de honrar com seu dízimo",
    corpo: "Seja parceiro da obra. Doação rápida, segura e recorrente.",
    url: "/doar",
    alvoPadrao: "TODOS" as const,
  },
  {
    nome: "Aniversariantes",
    titulo: "🎉 Parabéns!",
    corpo: "Que Deus continue te abençoando neste novo ano.",
    url: "/membro",
    alvoPadrao: "MEMBROS" as const,
  },
  {
    nome: "Pedido de Oração Respondido",
    titulo: "🙌 Seu pedido foi respondido",
    corpo: "Veja como Deus está agindo na sua história.",
    url: "/membro/oracao",
    alvoPadrao: "MEMBROS" as const,
  },
  {
    nome: "Testemunho Publicado",
    titulo: "✨ Novo testemunho na família",
    corpo: "Vidas transformadas por Cristo. Vem conferir.",
    url: "/testemunhos",
    alvoPadrao: "TODOS" as const,
  },
  {
    nome: "Resumo Mensal",
    titulo: "📊 Resumo do mês na Maranata",
    corpo: "Tudo que aconteceu — eventos, células, palavras e mais.",
    url: "/membro",
    alvoPadrao: "USUARIOS_APP" as const,
  },
];

async function main() {
  console.log(`Seedando ${TEMPLATES.length} templates...`);
  for (const t of TEMPLATES) {
    await prisma.pushTemplate.upsert({
      where: { nome: t.nome },
      create: { ...t, ativo: true },
      update: {
        titulo: t.titulo,
        corpo: t.corpo,
        url: t.url,
        alvoPadrao: t.alvoPadrao,
      },
    });
    console.log(`  ✓ ${t.nome}`);
  }
  console.log("Concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
