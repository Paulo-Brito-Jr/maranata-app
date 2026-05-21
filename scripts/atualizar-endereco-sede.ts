import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! }),
});

async function main() {
  const antes = await prisma.igreja.findFirst({
    where: { OR: [{ inchurchId: 25524 }, { ehSede: true }] },
    select: { id: true, nome: true, apelido: true, endereco: true, ehSede: true },
  });
  if (!antes) {
    console.error("Sede não encontrada (inchurchId 25524 nem ehSede=true).");
    process.exit(1);
  }
  console.log("Antes:", antes);

  const depois = await prisma.igreja.update({
    where: { id: antes.id },
    data: { endereco: "Rua Guapeni, 27" },
  });
  console.log("Depois:", { id: depois.id, nome: depois.nome, endereco: depois.endereco });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
