/**
 * Seed: catálogo inicial da Loja Maranata.
 * 5 categorias + 12 produtos exemplo (vestuário, livros, devocional, infantil).
 * Idempotente: upsert por slug.
 * Roda: pnpm tsx --env-file=.env.local scripts/seed-loja-catalogo.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! }),
});

const CATEGORIAS = [
  { nome: "Vestuário", slug: "vestuario", ordem: 1 },
  { nome: "Livros", slug: "livros", ordem: 2 },
  { nome: "Devocionais", slug: "devocionais", ordem: 3 },
  { nome: "Infantil", slug: "infantil", ordem: 4 },
  { nome: "Acessórios", slug: "acessorios", ordem: 5 },
];

type ProdSeed = {
  slug: string;
  nome: string;
  categoriaSlug: string;
  descricao: string;
  preco: number;
  precoPromocional?: number;
  estoque: number;
};

const PRODUTOS: ProdSeed[] = [
  // Vestuário
  {
    slug: "camiseta-maranata-laranja",
    nome: "Camiseta Maranata Laranja",
    categoriaSlug: "vestuario",
    descricao: "Camiseta 100% algodão com a logo Maranata bordada. Tamanhos P ao GG.",
    preco: 79.9,
    estoque: 50,
  },
  {
    slug: "camiseta-maranata-preta",
    nome: "Camiseta Maranata Preta",
    categoriaSlug: "vestuario",
    descricao: "Versão preta com logo branca. Algodão pima.",
    preco: 79.9,
    estoque: 50,
  },
  {
    slug: "moletom-jovem-maranata",
    nome: "Moletom Jovem Maranata",
    categoriaSlug: "vestuario",
    descricao: "Moletom com capuz, gola alta, manga longa. Frio do RJ aprovado.",
    preco: 159.9,
    precoPromocional: 139.9,
    estoque: 30,
  },
  // Livros
  {
    slug: "manual-do-discipulado",
    nome: "Manual do Discipulado Maranata",
    categoriaSlug: "livros",
    descricao: "Material oficial dos 21 dias de discipulado pra novos convertidos.",
    preco: 39.9,
    estoque: 100,
  },
  {
    slug: "biblia-de-estudo-maranata",
    nome: "Bíblia de Estudo Maranata",
    categoriaSlug: "livros",
    descricao: "Versão Almeida Revista e Atualizada com notas pastorais da Maranata.",
    preco: 129.9,
    precoPromocional: 99.9,
    estoque: 25,
  },
  // Devocionais
  {
    slug: "devocional-diario-365",
    nome: "Devocional Diário 365 dias",
    categoriaSlug: "devocionais",
    descricao: "Uma reflexão e versículo pra cada dia do ano.",
    preco: 49.9,
    estoque: 80,
  },
  {
    slug: "devocional-casais",
    nome: "Devocional para Casais",
    categoriaSlug: "devocionais",
    descricao: "60 dias de leitura conjunta com perguntas pra fortalecer o relacionamento.",
    preco: 39.9,
    estoque: 40,
  },
  // Infantil
  {
    slug: "biblia-kids-ilustrada",
    nome: "Bíblia Kids Ilustrada",
    categoriaSlug: "infantil",
    descricao: "30 histórias bíblicas ilustradas pra 4-10 anos.",
    preco: 59.9,
    estoque: 60,
  },
  {
    slug: "camiseta-kids-maranata",
    nome: "Camiseta Kids Maranata",
    categoriaSlug: "infantil",
    descricao: "Tamanhos 4 ao 14. Algodão antialérgico.",
    preco: 49.9,
    estoque: 70,
  },
  {
    slug: "kit-kids-batismo",
    nome: "Kit Kids Batismo",
    categoriaSlug: "infantil",
    descricao: "Bíblia + caderno de oração + medalha de lembrança.",
    preco: 99.9,
    estoque: 20,
  },
  // Acessórios
  {
    slug: "caneca-maranata",
    nome: "Caneca Maranata",
    categoriaSlug: "acessorios",
    descricao: "Caneca de cerâmica 300ml. Sublimada, lavável em máquina.",
    preco: 34.9,
    estoque: 100,
  },
  {
    slug: "garrafa-termica-maranata",
    nome: "Garrafa Térmica Maranata",
    categoriaSlug: "acessorios",
    descricao: "Inox 500ml, mantém quente/frio por 12h.",
    preco: 69.9,
    estoque: 40,
  },
];

async function main() {
  console.log(`Seedando ${CATEGORIAS.length} categorias...`);
  const catIds = new Map<string, string>();
  for (const c of CATEGORIAS) {
    const out = await prisma.lojaCategoria.upsert({
      where: { slug: c.slug },
      create: { ...c, ativa: true },
      update: { nome: c.nome, ordem: c.ordem },
    });
    catIds.set(c.slug, out.id);
    console.log(`  ✓ ${c.nome}`);
  }

  console.log(`\nSeedando ${PRODUTOS.length} produtos...`);
  for (const p of PRODUTOS) {
    const categoriaId = catIds.get(p.categoriaSlug)!;
    const { categoriaSlug, ...rest } = p;
    void categoriaSlug;
    await prisma.lojaProduto.upsert({
      where: { slug: p.slug },
      create: {
        ...rest,
        categoriaId,
        status: "ATIVO",
        imagensJson: [],
      },
      update: {
        nome: p.nome,
        descricao: p.descricao,
        preco: p.preco,
        precoPromocional: p.precoPromocional ?? null,
        estoque: p.estoque,
        categoriaId,
      },
    });
    console.log(`  ✓ ${p.nome} (R$ ${p.preco.toFixed(2)})`);
  }
  console.log("Concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
