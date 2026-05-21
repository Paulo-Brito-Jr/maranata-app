/**
 * Separa Redes EBD da Rede de Pequenos Grupos (PG):
 *  - Marca tipo=EBD em todas as redes cujo nome contém "EBD" ou "Escola"
 *  - Marca tipo=PG nas demais (default já é PG, mas garante)
 *  - Cria EbdClasse pra cada Rede EBD vinculada à congregação correspondente
 *    pelo nome (Campo Grande → Igreja Campo Grande, etc).
 *  - Cada Célula filha de Rede EBD vira uma EbdClasse local (uma classe por
 *    sala) — relação Celula→EbdClasse implícita pelo nome.
 *
 * Idempotente: usa upsert + skip se EbdClasse já existir.
 */
import { PrismaClient, TipoRede } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  }),
});

// Mapa nome da rede → nome da congregação no banco
const MAPA_NOME: Record<string, string> = {
  "campo grande": "Campo Grande",
  caxias: "Duque de Caxias",
  copacabana: "Copacabana",
  iraja: "Irajá",
  jacarepagua: "Jacarepaguá",
  "jardim primavera": "Jardim Primavera",
  "lote xv": "Lote XV",
  meier: "Méier",
  "nova iguacu": "Nova Iguaçu",
  recreio: "Recreio",
  "rio das ostras": "Rio das Ostras",
  "sao joao de meriti": "São João de Meriti",
  tijuca: "Tijuca",
  "vila sao luiz": "Vila São Luiz",
};

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\brede\b/g, "")
    .replace(/\bebd\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferirIgrejaNome(nomeRede: string): string | null {
  const norm = normalizar(nomeRede);
  for (const [chave, valor] of Object.entries(MAPA_NOME)) {
    if (norm.includes(chave)) return valor;
  }
  return null;
}

async function main() {
  const redes = await prisma.rede.findMany();
  console.log(`Total redes: ${redes.length}`);

  let ebd = 0;
  let pg = 0;
  let classesCriadas = 0;
  let semIgreja = 0;

  for (const r of redes) {
    const ehEbd = /ebd|escola/i.test(r.nome);
    if (ehEbd) {
      await prisma.rede.update({ where: { id: r.id }, data: { tipo: TipoRede.EBD } });
      ebd++;

      // Cria EbdClasse correspondente (idempotente pelo nome único)
      const nomeIgreja = inferirIgrejaNome(r.nome);
      if (!nomeIgreja) {
        console.log(`  ⚠️  ${r.nome}: igreja não inferida pelo nome`);
        semIgreja++;
        continue;
      }
      const igreja = await prisma.igreja.findFirst({
        where: { nome: nomeIgreja, ativa: true },
      });
      if (!igreja) {
        console.log(`  ⚠️  ${r.nome}: igreja "${nomeIgreja}" não encontrada`);
        semIgreja++;
        continue;
      }
      // Cria a EbdClasse "espelho" da Rede EBD
      const existente = await prisma.ebdClasse.findFirst({
        where: { nome: r.nome, igrejaId: igreja.id },
      });
      if (!existente) {
        await prisma.ebdClasse.create({
          data: {
            nome: r.nome,
            igrejaId: igreja.id,
            faixa: "GERAL",
            ciclo: `${new Date().getFullYear()}.T${Math.floor(new Date().getMonth() / 3) + 1}`,
            descricao: `Importado da Rede EBD ${r.nome}`,
            ativa: true,
          },
        });
        classesCriadas++;
      }
    } else {
      await prisma.rede.update({ where: { id: r.id }, data: { tipo: TipoRede.PG } });
      pg++;
    }
  }

  console.log(`\n📚 ${ebd} Redes marcadas tipo=EBD`);
  console.log(`🏠 ${pg} Redes marcadas tipo=PG`);
  console.log(`✓  ${classesCriadas} novas EbdClasses criadas`);
  if (semIgreja > 0) {
    console.log(`⚠️  ${semIgreja} sem igreja inferida (revisar manualmente)`);
  }

  const totalEbdClasses = await prisma.ebdClasse.count();
  console.log(`\n📊 Total EbdClasses no banco: ${totalEbdClasses}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
