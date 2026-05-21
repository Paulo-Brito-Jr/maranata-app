import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const url = new URL(req.url);
  const { id } = await params;

  const atual = await prisma.pagamentoLocal.findUnique({
    where: { id },
    select: { id: true, status: true, origem: true, origemId: true, igreja: { select: { id: true } } },
  });

  if (!atual) {
    return NextResponse.redirect(new URL("/eventos?err=ref-invalida", url.origin));
  }

  // Só permite avançar se ainda está aguardando OU admin já confirmou (validação cruzada)
  if (atual.status === "AGUARDANDO") {
    await prisma.pagamentoLocal.update({
      where: { id },
      data: {
        status: "MEMBRO_INFORMOU",
        membroInformouEm: new Date(),
      },
    });
  } else if (atual.status === "ADMIN_CONFIRMOU") {
    // admin já recebeu, agora o membro confirma -> VALIDADO
    await prisma.pagamentoLocal.update({
      where: { id },
      data: {
        status: "VALIDADO",
        membroInformouEm: new Date(),
      },
    });

    // Se origem é evento, marca inscrição como CONFIRMADA
    if (atual.origem === "evento") {
      await prisma.inscricaoEvento.updateMany({
        where: { pagamentoLocalId: id },
        data: { status: "CONFIRMADA" },
      });
    }
  }
  // Se já está MEMBRO_INFORMOU ou VALIDADO/CANCELADO, no-op

  // Redireciona pra mesma página de status com flag de sucesso
  const inscricao = await prisma.inscricaoEvento.findFirst({
    where: { pagamentoLocalId: id },
    include: { evento: { select: { slug: true } } },
  });

  if (inscricao) {
    return NextResponse.redirect(
      new URL(
        `/eventos/${inscricao.evento.slug}/inscrito?ref=${inscricao.qrCode}&pl=${id}&aviso=1`,
        url.origin,
      ),
    );
  }

  return NextResponse.redirect(new URL("/eventos", url.origin));
}
