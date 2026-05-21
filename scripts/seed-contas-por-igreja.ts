/**
 * Seed: 1 ContaBancaria "{nome} — Conta Principal" por Igreja.
 * Roda: pnpm exec tsx --env-file=.env.local scripts/seed-contas-por-igreja.ts
 * Idempotente: skip se já existir conta com o mesmo nome+igrejaId.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL!;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const igrejas = await prisma.igreja.findMany({
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  console.log(`Encontradas ${igrejas.length} igrejas.`);

  let criadas = 0;
  let existentes = 0;

  for (const i of igrejas) {
    const nome = `${i.nome} — Conta Principal`;
    const existing = await prisma.contaBancaria.findFirst({
      where: { igrejaId: i.id, nome },
      select: { id: true },
    });

    if (existing) {
      existentes += 1;
      console.log(`  • ${nome} (já existe)`);
      continue;
    }

    await prisma.contaBancaria.create({
      data: {
        igrejaId: i.id,
        nome,
        ativa: true,
        saldoInicial: 0,
      },
    });
    criadas += 1;
    console.log(`  ✓ ${nome}`);
  }

  console.log(`Concluído. Criadas: ${criadas}. Já existentes: ${existentes}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
