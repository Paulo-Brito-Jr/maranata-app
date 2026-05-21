import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL!;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const IGREJAS = [
  { inchurchId: 25256, nome: "Sede", apelido: "Sede Administrativa", ehSede: true, endereco: "Rua Guapeni, 27", cidade: "Rio de Janeiro", estado: "RJ" },
  { inchurchId: 25524, nome: "Tijuca", apelido: null, ehSede: false, endereco: "Rua Conde de Bonfim, 229", cidade: "Rio de Janeiro", estado: "RJ" },
  { inchurchId: 25525, nome: "Méier", endereco: "Rua Adriano, 115", cidade: "Rio de Janeiro", estado: "RJ" },
  { inchurchId: 25526, nome: "Duque de Caxias", endereco: "Rua Humberto de Campos, 107", cidade: "Duque de Caxias", estado: "RJ" },
  { inchurchId: 25527, nome: "Copacabana", endereco: "Rua Francisco Sá, 88", cidade: "Rio de Janeiro", estado: "RJ" },
  { inchurchId: 25528, nome: "Jacarepaguá", endereco: "Rua Barão, 873, Praça Seca", cidade: "Rio de Janeiro", estado: "RJ" },
  { inchurchId: 25529, nome: "Irajá", endereco: "Rua João Machado, 234", cidade: "Rio de Janeiro", estado: "RJ" },
  { inchurchId: 25530, nome: "Campo Grande", endereco: "Est. do Cabuçu, 1125", cidade: "Rio de Janeiro", estado: "RJ" },
  { inchurchId: 25531, nome: "São João de Meriti", endereco: "Av. Automóvel Clube, 78", cidade: "São João de Meriti", estado: "RJ" },
  { inchurchId: 25532, nome: "Recreio", endereco: "Av. das Américas, 14799", cidade: "Rio de Janeiro", estado: "RJ" },
  { inchurchId: 25533, nome: "Nova Iguaçu", endereco: "Av. José Mariano dos Passos, 120", cidade: "Nova Iguaçu", estado: "RJ" },
  { inchurchId: 25534, nome: "Jardim Primavera", endereco: "R. Jornalista Moacir Padilha, 427", cidade: "Duque de Caxias", estado: "RJ" },
  { inchurchId: 25535, nome: "Vila São Luiz", endereco: "R. 14 de Julho, 497", cidade: "Duque de Caxias", estado: "RJ" },
  { inchurchId: 25536, nome: "Lote XV", endereco: "R. Ver. Francisco Ferreira Lima, 110", cidade: "Belford Roxo", estado: "RJ" },
  { inchurchId: 25543, nome: "Rio das Ostras", endereco: "R. Araguaia, 451 — Balneário Remanso", cidade: "Rio das Ostras", estado: "RJ" },
];

const CATEGORIAS_EVENTO = [
  { nome: "Celebrações", cor: "#F0641E" },
  { nome: "Culto Jovem", cor: "#7C3AED" },
  { nome: "Kids", cor: "#FB923C" },
  { nome: "Homens", cor: "#1E3A5F" },
  { nome: "Mulheres", cor: "#EC4899" },
  { nome: "EBD", cor: "#10B981" },
  { nome: "Evangelismo", cor: "#F59E0B" },
  { nome: "Conferências", cor: "#8B5CF6" },
];

const CATEGORIAS_PREGACAO = [
  "Adoração", "Discipulado", "Família", "Fé", "Missões", "Oração", "Profecia", "Vida Cristã",
];

const CATEGORIAS_FINANCEIRAS = [
  { nome: "Dízimos", tipo: "ENTRADA" as const, cor: "#10B981" },
  { nome: "Ofertas", tipo: "ENTRADA" as const, cor: "#34D399" },
  { nome: "Eventos", tipo: "ENTRADA" as const, cor: "#F59E0B" },
  { nome: "Loja", tipo: "ENTRADA" as const, cor: "#8B5CF6" },
  { nome: "Aluguel", tipo: "SAIDA" as const, cor: "#EF4444" },
  { nome: "Salários", tipo: "SAIDA" as const, cor: "#DC2626" },
  { nome: "Manutenção", tipo: "SAIDA" as const, cor: "#F97316" },
  { nome: "Missões (saída)", tipo: "SAIDA" as const, cor: "#7C2D12" },
  { nome: "Administrativo", tipo: "SAIDA" as const, cor: "#A78BFA" },
];

const SENTIMENTOS = [
  { nome: "Gratidão", emoji: "🙏", cor: "#10B981" },
  { nome: "Alegria", emoji: "😊", cor: "#F59E0B" },
  { nome: "Tristeza", emoji: "😢", cor: "#3B82F6" },
  { nome: "Ansiedade", emoji: "😰", cor: "#EF4444" },
  { nome: "Paz", emoji: "🕊", cor: "#06B6D4" },
  { nome: "Esperança", emoji: "✨", cor: "#8B5CF6" },
  { nome: "Saudade", emoji: "💭", cor: "#A78BFA" },
  { nome: "Medo", emoji: "😨", cor: "#7C3AED" },
  { nome: "Fé", emoji: "🙌", cor: "#F0641E" },
];

const REDES = [
  { nome: "Rede Tijuca", cor: "#F0641E" },
  { nome: "Rede Baixada", cor: "#1E3A5F" },
  { nome: "Rede Zona Sul", cor: "#8B5CF6" },
];

const CAMPANHAS = [
  {
    slug: "obra-maranata-2026",
    titulo: "Obra Maranata 2026",
    descricao:
      "Sustente a expansão das 15 unidades, projetos sociais e missões da IME Maranata em 2026.",
    meta: 250000,
    ativa: true,
  },
  {
    slug: "missoes-2026",
    titulo: "Missões 2026",
    descricao:
      "Apoie o envio e a manutenção de missionários da família Maranata pelo Brasil e exterior.",
    meta: 80000,
    ativa: true,
  },
];

async function main() {
  console.log("🌱 Seeding Maranata App...\n");

  for (const i of IGREJAS) {
    await prisma.igreja.upsert({
      where: { inchurchId: i.inchurchId },
      update: i,
      create: i,
    });
    console.log(`  ✓ Igreja: ${i.nome}`);
  }

  for (const c of CATEGORIAS_EVENTO) {
    await prisma.categoriaEvento.upsert({
      where: { nome: c.nome },
      update: c,
      create: c,
    });
  }
  console.log(`  ✓ ${CATEGORIAS_EVENTO.length} categorias de evento`);

  for (const nome of CATEGORIAS_PREGACAO) {
    await prisma.categoriaPregacao.upsert({
      where: { nome },
      update: {},
      create: { nome },
    });
  }
  console.log(`  ✓ ${CATEGORIAS_PREGACAO.length} categorias de pregação`);

  for (const c of CATEGORIAS_FINANCEIRAS) {
    await prisma.categoriaFinanceira.upsert({
      where: { nome: c.nome },
      update: c,
      create: c,
    });
  }
  console.log(`  ✓ ${CATEGORIAS_FINANCEIRAS.length} categorias financeiras`);

  for (const s of SENTIMENTOS) {
    await prisma.sentimento.upsert({
      where: { nome: s.nome },
      update: s,
      create: s,
    });
  }
  console.log(`  ✓ ${SENTIMENTOS.length} sentimentos`);

  for (const r of REDES) {
    await prisma.rede.upsert({
      where: { nome: r.nome },
      update: r,
      create: r,
    });
  }
  console.log(`  ✓ ${REDES.length} redes`);

  for (const c of CAMPANHAS) {
    await prisma.campanha.upsert({
      where: { slug: c.slug },
      update: {
        titulo: c.titulo,
        descricao: c.descricao,
        meta: c.meta,
        ativa: c.ativa,
      },
      create: c,
    });
  }
  console.log(`  ✓ ${CAMPANHAS.length} campanhas`);

  console.log("\n✅ Seed completo!");
}

main()
  .catch((e) => {
    console.error("❌ Seed falhou:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
