/**
 * Marca o `tipo` correto pra cada Igreja existente + cria a Igreja
 * "Acampamento Maranata" (entidade organizadora) idempotente.
 *
 * - Sede atual (ehSede=true) → tipo=SEDE
 * - Demais (14 congregações) → tipo=CONGREGACAO
 * - Nova Igreja "Acampamento Maranata" → tipo=ACAMPAMENTO
 */
import { PrismaClient, TipoIgreja } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  }),
});

async function main() {
  // 1. Marca Sede.
  const sedeUpdate = await prisma.igreja.updateMany({
    where: { ehSede: true },
    data: { tipo: TipoIgreja.SEDE },
  });
  console.log(`✓ ${sedeUpdate.count} Sede(s) marcada(s) tipo=SEDE`);

  // 2. Marca 14 congregações (todas que não são Sede e não são Acampamento).
  const congUpdate = await prisma.igreja.updateMany({
    where: { ehSede: false, NOT: { nome: "Acampamento Maranata" } },
    data: { tipo: TipoIgreja.CONGREGACAO },
  });
  console.log(`✓ ${congUpdate.count} congregações marcadas tipo=CONGREGACAO`);

  // 3. Cria Igreja "Acampamento Maranata" (entidade organizadora).
  const acampExistente = await prisma.igreja.findFirst({
    where: { nome: "Acampamento Maranata" },
  });
  const acamp = acampExistente
    ? await prisma.igreja.update({
        where: { id: acampExistente.id },
        data: {
          tipo: TipoIgreja.ACAMPAMENTO,
          apelido: "Sítio",
          ehSede: false,
          ativa: true,
        },
      })
    : await prisma.igreja.create({
        data: {
          nome: "Acampamento Maranata",
          apelido: "Sítio",
          tipo: TipoIgreja.ACAMPAMENTO,
          ehSede: false,
          ativa: true,
          cidade: null,
          estado: "RJ",
        },
      });
  console.log(`✓ Acampamento Maranata (Igreja): id=${acamp.id}, tipo=${acamp.tipo}`);

  // 4. Garante que LocalEvento "Acampamento Maranata" aponta pra essa Igreja.
  const localAcamp = await prisma.localEvento.findFirst({
    where: { nome: "Acampamento Maranata" },
  });
  if (localAcamp) {
    await prisma.localEvento.update({
      where: { id: localAcamp.id },
      data: { igrejaId: acamp.id, tipo: "ACAMPAMENTO" },
    });
    console.log(`✓ LocalEvento Acampamento vinculado à Igreja Acampamento`);
  }

  // 5. Resumo final.
  const porTipo = await prisma.igreja.groupBy({
    by: ["tipo"],
    where: { ativa: true },
    _count: { _all: true },
  });
  console.log("\n📊 Igrejas ativas por tipo:");
  for (const t of porTipo) {
    console.log(`   ${t.tipo}: ${t._count._all}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
