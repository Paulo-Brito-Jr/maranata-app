import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  }),
});

async function main() {
  // Apaga LocalEvento "IME Maranata — Sede - Administração" que aponta pra Sede.
  // Sede não é local físico de evento.
  const local = await prisma.localEvento.findFirst({
    where: { nome: "IME Maranata — Sede - Administração" },
  });
  if (local) {
    const uso = await prisma.evento.count({ where: { localEventoId: local.id } });
    if (uso === 0) {
      await prisma.localEvento.delete({ where: { id: local.id } });
      console.log(`✓ LocalEvento "Sede - Administração" removido`);
    } else {
      await prisma.localEvento.update({
        where: { id: local.id },
        data: { ativo: false, igrejaId: null },
      });
      console.log(`⚠️  Tem ${uso} evento(s) — só desativado`);
    }
  }

  const totais = await prisma.localEvento.groupBy({
    by: ["tipo"],
    where: { ativo: true },
    _count: { _all: true },
  });
  console.log("");
  for (const t of totais) console.log(`📍 ${t.tipo}: ${t._count._all}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
