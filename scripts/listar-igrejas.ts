import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  }),
});

async function main() {
  const igrejas = await prisma.igreja.findMany({
    orderBy: [{ ehSede: "desc" }, { nome: "asc" }],
    include: {
      _count: {
        select: {
          membros: true,
          eventos: true,
          celulas: true,
          usuariosApp: true,
          lancamentos: true,
        },
      },
    },
  });
  console.log(`Total: ${igrejas.length}\n`);
  for (const ig of igrejas) {
    console.log(
      `${ig.ehSede ? "🏛️ SEDE" : "⛪ CONGR"} | ${ig.nome.padEnd(25)} | inchurchId=${
        ig.inchurchId ?? "—"
      } | ativa=${ig.ativa} | ${ig.endereco?.slice(0, 40) ?? "(sem end.)"} | M:${
        ig._count.membros
      } E:${ig._count.eventos} C:${ig._count.celulas} L:${ig._count.lancamentos}`,
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
