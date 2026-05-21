/**
 * Seed: 8 campos customizados exemplo pra Membro + Visitante.
 * Idempotente: upsert por chave.
 * Roda: pnpm tsx --env-file=.env.local scripts/seed-campos-customizados.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! }),
});

const CAMPOS = [
  {
    chave: "membro_profissao_detalhada",
    rotulo: "Profissão detalhada",
    tipo: "text",
    entidade: "Membro",
    ordem: 1,
    obrigatorio: false,
  },
  {
    chave: "membro_dom_espiritual",
    rotulo: "Dom espiritual",
    tipo: "select",
    entidade: "Membro",
    opcoesJson: ["Ensino", "Profecia", "Serviço", "Liderança", "Misericórdia", "Cura", "Línguas", "Discernimento", "Sabedoria", "Outro"],
    ordem: 2,
    obrigatorio: false,
  },
  {
    chave: "membro_curso_biblico",
    rotulo: "Curso bíblico concluído",
    tipo: "text",
    entidade: "Membro",
    ordem: 3,
    obrigatorio: false,
  },
  {
    chave: "membro_restricao_alimentar",
    rotulo: "Restrição alimentar",
    tipo: "text",
    entidade: "Membro",
    ordem: 4,
    obrigatorio: false,
  },
  {
    chave: "membro_idioma_secundario",
    rotulo: "Idioma secundário",
    tipo: "text",
    entidade: "Membro",
    ordem: 5,
    obrigatorio: false,
  },
  {
    chave: "membro_disponivel_voluntario",
    rotulo: "Disponível pra voluntariado",
    tipo: "boolean",
    entidade: "Membro",
    ordem: 6,
    obrigatorio: false,
  },
  {
    chave: "visitante_como_conheceu_outro",
    rotulo: "Como conheceu (outros)",
    tipo: "text",
    entidade: "Visitante",
    ordem: 1,
    obrigatorio: false,
  },
  {
    chave: "visitante_origem_indicacao",
    rotulo: "Quem indicou",
    tipo: "text",
    entidade: "Visitante",
    ordem: 2,
    obrigatorio: false,
  },
];

async function main() {
  console.log(`Seedando ${CAMPOS.length} campos customizados...`);
  for (const c of CAMPOS) {
    const { opcoesJson, ...rest } = c;
    await prisma.campoCustomizado.upsert({
      where: { chave: c.chave },
      create: {
        ...rest,
        opcoesJson: opcoesJson ?? undefined,
        ativo: true,
      },
      update: {
        rotulo: c.rotulo,
        tipo: c.tipo,
        entidade: c.entidade,
        ordem: c.ordem,
        opcoesJson: opcoesJson ?? null,
      },
    });
    console.log(`  ✓ ${c.chave} (${c.entidade}/${c.tipo})`);
  }
  console.log("Concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
