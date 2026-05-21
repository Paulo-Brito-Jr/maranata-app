/**
 * Consolida a Sede real (inchurchId=25256 "Sede - Administração") e remove a
 * duplicada que criei no script anterior.
 *
 * Estado descoberto:
 *  - "Sede - Administração" (inchurchId=25256) tinha 477 eventos + 1363
 *    lançamentos — é a entidade administrativa central original do InChurch.
 *  - "Tijuca" (inchurchId=25524) tinha 2733 membros + 88 células — congregação.
 *  - "Sede" sem inchurchId — criada pelo script anterior, redundante.
 *
 * Final: 14 congregações + 1 Sede (a inchurchId=25256, agora ehSede=true).
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  }),
});

async function main() {
  // 1. Apaga a Sede duplicada que criei (sem inchurchId).
  const duplicada = await prisma.igreja.findFirst({
    where: { nome: "Sede", inchurchId: null },
  });
  if (duplicada) {
    const vinculos = await Promise.all([
      prisma.membro.count({ where: { igrejaId: duplicada.id } }),
      prisma.evento.count({ where: { igrejaId: duplicada.id } }),
      prisma.celula.count({ where: { igrejaId: duplicada.id } }),
      prisma.lancamentoFinanceiro.count({ where: { igrejaId: duplicada.id } }),
    ]);
    const totalVinculos = vinculos.reduce((a, b) => a + b, 0);
    if (totalVinculos === 0) {
      await prisma.igreja.delete({ where: { id: duplicada.id } });
      console.log(`✓ "Sede" duplicada (id=${duplicada.id}) excluída`);
    } else {
      console.log(
        `⚠️  "Sede" duplicada tem vínculos (M:${vinculos[0]} E:${vinculos[1]} C:${vinculos[2]} L:${vinculos[3]}) — desativando`,
      );
      await prisma.igreja.update({
        where: { id: duplicada.id },
        data: { ativa: false, ehSede: false },
      });
    }
  } else {
    console.log("✓ Não há Sede duplicada (sem inchurchId)");
  }

  // 2. Promove "Sede - Administração" (inchurchId=25256) pra Sede oficial.
  const sedeReal = await prisma.igreja.findFirst({
    where: { inchurchId: 25256 },
  });
  if (sedeReal) {
    const updated = await prisma.igreja.update({
      where: { id: sedeReal.id },
      data: {
        nome: "Sede",
        apelido: "Sede Administrativa",
        ehSede: true,
        endereco: "Rua Guapeni, 27",
        cidade: "Rio de Janeiro",
        estado: "RJ",
        cep: null, // limpa CEP antigo se houver
      },
    });
    console.log(
      `✓ Sede oficial (inchurchId=25256): nome=${updated.nome}, ehSede=true, endereço=${updated.endereco}`,
    );
  } else {
    console.warn("⚠️  Sede - Administração (inchurchId=25256) não encontrada");
  }

  // 3. Garante que NENHUMA outra igreja tem ehSede=true.
  if (sedeReal) {
    const limpou = await prisma.igreja.updateMany({
      where: { id: { not: sedeReal.id }, ehSede: true },
      data: { ehSede: false },
    });
    if (limpou.count > 0) {
      console.log(`✓ Removido ehSede=true de ${limpou.count} outra(s) igreja(s)`);
    }
  }

  // 4. Apaga LocalEvento "IME Maranata — Sede Administrativa" se eu criei
  // antes (sem evento vinculado).
  const localSede = await prisma.localEvento.findFirst({
    where: { nome: "IME Maranata — Sede Administrativa" },
  });
  if (localSede) {
    const uso = await prisma.evento.count({ where: { localEventoId: localSede.id } });
    if (uso === 0) {
      await prisma.localEvento.delete({ where: { id: localSede.id } });
      console.log(`✓ LocalEvento "IME Maranata — Sede Administrativa" removido`);
    } else {
      await prisma.localEvento.update({
        where: { id: localSede.id },
        data: { ativo: false },
      });
      console.log(`⚠️  LocalEvento Sede tem ${uso} evento(s) — só desativado`);
    }
  }

  // 5. Garante LocalEvento "IME Maranata — Tijuca" existe (renomeado pelo
  // script anterior, mas confere).
  const tijuca = await prisma.igreja.findFirst({ where: { inchurchId: 25524 } });
  if (tijuca) {
    const localTijuca = await prisma.localEvento.findFirst({
      where: { nome: "IME Maranata — Tijuca" },
    });
    if (!localTijuca) {
      await prisma.localEvento.create({
        data: {
          nome: "IME Maranata — Tijuca",
          tipo: "IGREJA",
          igrejaId: tijuca.id,
          endereco: "Rua Conde de Bonfim, 229",
          cidade: "Rio de Janeiro",
          estado: "RJ",
        },
      });
      console.log(`✓ LocalEvento "IME Maranata — Tijuca" criado`);
    }
  }

  // 6. Resumo final.
  const igrejas = await prisma.igreja.findMany({
    where: { ativa: true },
    orderBy: [{ ehSede: "desc" }, { nome: "asc" }],
    select: { nome: true, ehSede: true, endereco: true, inchurchId: true },
  });
  console.log("");
  console.log(`📊 ESTRUTURA FINAL (${igrejas.length} entidades ativas):`);
  for (const ig of igrejas) {
    console.log(`   ${ig.ehSede ? "🏛️" : "⛪"} ${ig.nome.padEnd(25)} | ${ig.endereco}`);
  }

  const locais = await prisma.localEvento.count({ where: { ativo: true } });
  console.log("");
  console.log(`📍 ${locais} LocalEvento ativos`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
