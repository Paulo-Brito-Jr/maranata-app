import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  }),
});

async function main() {
  const redes = await prisma.rede.findMany({
    include: { _count: { select: { celulas: true } } },
    orderBy: { nome: "asc" },
  });
  console.log(`Total: ${redes.length}\n`);
  for (const r of redes) {
    const ehEbd = /ebd|escola/i.test(r.nome);
    console.log(
      `${ehEbd ? "📚 EBD" : "🏠 PG "} | ${r.nome.padEnd(50)} | ${
        r._count.celulas
      } célula(s)`,
    );
  }
  const ebd = redes.filter((r) => /ebd|escola/i.test(r.nome));
  console.log(`\n📚 ${ebd.length} rede(s) parecem ser EBD (nome contém "ebd" ou "escola")`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
