import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  }),
});

async function main() {
  const locais = await prisma.localEvento.findMany({
    orderBy: [{ tipo: "asc" }, { nome: "asc" }],
    include: { _count: { select: { eventos: true } } },
  });
  console.log(`Total: ${locais.length}\n`);
  for (const l of locais) {
    console.log(
      `${l.ativo ? "✓" : "✗"} ${l.tipo.padEnd(12)} | ${l.nome.padEnd(40)} | ${
        l._count.eventos
      } evento(s)`,
    );
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
