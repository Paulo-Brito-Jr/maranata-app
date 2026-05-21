/**
 * Seed: 4 turmas Kids exemplo na sede Tijuca.
 * Cria 1 turma por faixa etária (BERCARIO, MATERNAL, KIDS_1, KIDS_2)
 * com salas e capacidades sugeridas.
 * Idempotente: skip se já existir turma com mesmo nome+igreja.
 * Roda: pnpm tsx --env-file=.env.local scripts/seed-kids-exemplo.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! }),
});

const TURMAS = [
  { nome: "Berçário Maranata", faixaEtaria: "BERCARIO" as const, sala: "Sala 1 — Térreo", capacidade: 15 },
  { nome: "Maternal Maranata", faixaEtaria: "MATERNAL" as const, sala: "Sala 2 — Térreo", capacidade: 25 },
  { nome: "Kids I (6-8)", faixaEtaria: "KIDS_1" as const, sala: "Sala 3 — 1º andar", capacidade: 30 },
  { nome: "Kids II (9-11)", faixaEtaria: "KIDS_2" as const, sala: "Sala 4 — 1º andar", capacidade: 30 },
];

async function main() {
  // Achar igreja Sede (Tijuca, inchurchId 25524)
  const sede = await prisma.igreja.findFirst({
    where: { OR: [{ inchurchId: 25524 }, { ehSede: true }] },
  });
  if (!sede) {
    console.error("Igreja sede não encontrada. Rode o seed de igrejas primeiro.");
    process.exit(1);
  }

  console.log(`Seedando turmas Kids na sede ${sede.nome}...`);
  for (const t of TURMAS) {
    const existing = await prisma.kidsTurma.findFirst({
      where: { igrejaId: sede.id, nome: t.nome },
    });
    if (existing) {
      console.log(`  - ${t.nome} já existe (skip)`);
      continue;
    }
    await prisma.kidsTurma.create({
      data: {
        igrejaId: sede.id,
        nome: t.nome,
        faixaEtaria: t.faixaEtaria,
        sala: t.sala,
        capacidade: t.capacidade,
        ativa: true,
      },
    });
    console.log(`  ✓ ${t.nome} (${t.faixaEtaria}) — ${t.sala}, cap ${t.capacidade}`);
  }

  // Replicar nas 14 outras igrejas com nome simplificado
  const outras = await prisma.igreja.findMany({ where: { ehSede: false, ativa: true } });
  for (const ig of outras) {
    for (const t of TURMAS) {
      const existing = await prisma.kidsTurma.findFirst({
        where: { igrejaId: ig.id, nome: t.nome },
      });
      if (existing) continue;
      await prisma.kidsTurma.create({
        data: {
          igrejaId: ig.id,
          nome: t.nome,
          faixaEtaria: t.faixaEtaria,
          sala: null,
          capacidade: t.capacidade,
          ativa: true,
        },
      });
    }
    console.log(`  ✓ replicado em ${ig.nome}`);
  }

  const total = await prisma.kidsTurma.count();
  console.log(`\nTotal de turmas Kids no banco: ${total}`);
  console.log("Concluído. Cadastro de crianças deve ser feito pelos responsáveis em /admin/kids/criancas.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
