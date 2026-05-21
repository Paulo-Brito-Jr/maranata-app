/**
 * Seed: LocalEvento iniciais — Acampamento Maranata + as 15 igrejas como locais.
 * Idempotente via upsert por nome.
 * Roda: pnpm tsx --env-file=.env.local scripts/seed-locais-evento.ts
 */
import { PrismaClient, TipoLocalEvento } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  }),
});

async function main() {
  // 1. Acampamento Maranata (sítio)
  const acamp = await prisma.localEvento.upsert({
    where: { nome: "Acampamento Maranata" },
    update: {},
    create: {
      nome: "Acampamento Maranata",
      tipo: TipoLocalEvento.ACAMPAMENTO,
      descricao: "Sítio próprio da IME Maranata para acampamentos e retiros.",
      ativo: true,
    },
  });
  console.log("✓ Acampamento Maranata:", acamp.id);

  // 2. Cada uma das 15 igrejas vira também um LocalEvento (tipo=IGREJA)
  const igrejas = await prisma.igreja.findMany({
    where: { ativa: true },
    orderBy: [{ ehSede: "desc" }, { nome: "asc" }],
    select: { id: true, nome: true, apelido: true, endereco: true, cidade: true, estado: true, cep: true },
  });

  let criados = 0;
  for (const ig of igrejas) {
    const nome = `IME Maranata — ${ig.apelido ?? ig.nome}`;
    const r = await prisma.localEvento.upsert({
      where: { nome },
      update: {
        endereco: ig.endereco,
        cidade: ig.cidade,
        estado: ig.estado,
        cep: ig.cep,
      },
      create: {
        nome,
        tipo: TipoLocalEvento.IGREJA,
        igrejaId: ig.id,
        endereco: ig.endereco,
        cidade: ig.cidade,
        estado: ig.estado,
        cep: ig.cep,
      },
    });
    if (r) criados++;
  }
  console.log(`✓ ${criados} locais-igreja semeados`);

  const total = await prisma.localEvento.count();
  console.log(`📍 Total LocalEvento: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
