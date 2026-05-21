/**
 * Reestrutura: separa Sede de Tijuca.
 *
 * Estado anterior: Tijuca era ehSede=true em Rua Guapeni, 27.
 * Estado novo:
 *   - Sede (nova entidade, ehSede=true)  → Rua Guapeni, 27
 *   - Tijuca (volta a ser congregação)   → Rua Conde de Bonfim, 229
 *   - 13 outras igrejas inalteradas
 *
 * Sede NÃO tem ministérios próprios — ela é o nível "Geral" administrativo.
 * Eventos da Sede com ehGeral=true podem acontecer em qualquer das 14 igrejas
 * ou no Acampamento Maranata.
 *
 * Idempotente: rerodar é seguro.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  }),
});

async function main() {
  // 1. Tijuca volta a ser congregação (não-Sede) com endereço original.
  const tijuca = await prisma.igreja.findFirst({
    where: { OR: [{ inchurchId: 25524 }, { nome: "Tijuca" }] },
  });
  if (tijuca) {
    const updated = await prisma.igreja.update({
      where: { id: tijuca.id },
      data: {
        ehSede: false,
        apelido: null,
        endereco: "Rua Conde de Bonfim, 229",
        cidade: "Rio de Janeiro",
        estado: "RJ",
      },
    });
    console.log(`✓ Tijuca: ehSede=false, endereço=${updated.endereco}`);
  } else {
    console.warn("⚠️  Tijuca não encontrada");
  }

  // 2. Sede como nova entidade (ehSede=true).
  // inchurchId=null porque não vem do InChurch — é entidade administrativa
  // que só existe no Maranata App.
  // Igreja.nome não tem @unique no schema, então usa findFirst + update/create.
  const sedeExistente = await prisma.igreja.findFirst({ where: { nome: "Sede" } });
  const sede = sedeExistente
    ? await prisma.igreja.update({
        where: { id: sedeExistente.id },
        data: {
          ehSede: true,
          apelido: "Sede Administrativa",
          endereco: "Rua Guapeni, 27",
          cidade: "Rio de Janeiro",
          estado: "RJ",
        },
      })
    : await prisma.igreja.create({
        data: {
          nome: "Sede",
          apelido: "Sede Administrativa",
          ehSede: true,
          endereco: "Rua Guapeni, 27",
          cidade: "Rio de Janeiro",
          estado: "RJ",
          ativa: true,
        },
      });
  console.log(`✓ Sede: id=${sede.id}, endereço=${sede.endereco}`);

  // 3. Garante outras 13 igrejas com ehSede=false (já devem estar, idempotente).
  const naoSedes = await prisma.igreja.updateMany({
    where: { id: { not: sede.id }, ehSede: true },
    data: { ehSede: false },
  });
  if (naoSedes.count > 0) {
    console.log(`✓ Limpou ehSede=true de ${naoSedes.count} outra(s) igreja(s)`);
  }

  // 4. LocalEvento: remove "IME Maranata — Sede" se existir (Sede não é local
  // de evento físico — eventos da Sede acontecem nas 14 ou no Acampamento).
  const localSede = await prisma.localEvento.findFirst({
    where: { nome: "IME Maranata — Sede Administrativa" },
  });
  if (localSede) {
    const usado = await prisma.evento.count({
      where: { localEventoId: localSede.id },
    });
    if (usado === 0) {
      await prisma.localEvento.delete({ where: { id: localSede.id } });
      console.log(`✓ LocalEvento "Sede Administrativa" removido`);
    } else {
      await prisma.localEvento.update({
        where: { id: localSede.id },
        data: { ativo: false },
      });
      console.log(
        `⚠️  LocalEvento Sede tem ${usado} evento(s) — desativado em vez de excluir`,
      );
    }
  }

  // 5. Confere também o "IME Maranata — Sede" antigo (criado quando Tijuca era Sede).
  const localAntigoSede = await prisma.localEvento.findFirst({
    where: { nome: "IME Maranata — Sede" },
  });
  if (localAntigoSede) {
    // Renomeia pra "IME Maranata — Tijuca" (já que Tijuca volta a ser congregação)
    const localTijuca = await prisma.localEvento.findFirst({
      where: { nome: "IME Maranata — Tijuca" },
    });
    if (!localTijuca) {
      await prisma.localEvento.update({
        where: { id: localAntigoSede.id },
        data: {
          nome: "IME Maranata — Tijuca",
          endereco: "Rua Conde de Bonfim, 229",
          igrejaId: tijuca?.id,
        },
      });
      console.log(`✓ LocalEvento antigo "Sede" renomeado pra "Tijuca"`);
    } else {
      // Já existe "IME Maranata — Tijuca" — apaga o antigo "Sede" se não usado
      const usado = await prisma.evento.count({
        where: { localEventoId: localAntigoSede.id },
      });
      if (usado === 0) {
        await prisma.localEvento.delete({ where: { id: localAntigoSede.id } });
        console.log(`✓ LocalEvento duplicado "Sede" removido`);
      }
    }
  }

  // 6. Resumo final.
  const [totalIgrejas, totalCongregacoes, totalLocais] = await Promise.all([
    prisma.igreja.count({ where: { ativa: true } }),
    prisma.igreja.count({ where: { ativa: true, ehSede: false } }),
    prisma.localEvento.count({ where: { ativo: true } }),
  ]);
  console.log("");
  console.log(`📊 ESTRUTURA FINAL:`);
  console.log(`   ${totalIgrejas} entidades (${totalCongregacoes} congregações + 1 Sede)`);
  console.log(`   ${totalLocais} locais de evento ativos`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
