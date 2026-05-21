import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const url = new URL(req.url);
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/entrar?next=/admin/pagamentos-locais", url.origin));
  }

  const podeQualquerIgreja =
    user.role === "SUPER_ADMIN" || user.role === "PASTOR_DIRETORIA";
  if (!podeQualquerIgreja && user.role !== "ADMIN_IGREJA") {
    return NextResponse.redirect(new URL("/admin?err=forbidden", url.origin));
  }

  const { id } = await params;

  const pag = await prisma.pagamentoLocal.findUnique({
    where: { id },
    select: { id: true, status: true, igrejaId: true, origem: true, origemId: true },
  });

  if (!pag) {
    return NextResponse.redirect(
      new URL("/admin/pagamentos-locais?err=nao-encontrado", url.origin),
    );
  }

  // Admin de unidade só confirma os da sua igreja
  if (!podeQualquerIgreja && pag.igrejaId !== user.igrejaId) {
    return NextResponse.redirect(
      new URL("/admin/pagamentos-locais?err=fora-da-sua-unidade", url.origin),
    );
  }

  // No-op se já validado/cancelado
  if (pag.status === "VALIDADO" || pag.status === "CANCELADO") {
    return NextResponse.redirect(
      new URL(`/admin/pagamentos-locais?info=ja-${pag.status.toLowerCase()}`, url.origin),
    );
  }

  // Lookup usuario no banco (cookie tem MKUser sem id local)
  const usuario = await prisma.usuario.findUnique({
    where: { email: user.email },
    select: { id: true },
  });

  // Se membro já informou → VALIDADO direto
  // Se ainda está AGUARDANDO → ADMIN_CONFIRMOU (espera double-check do membro)
  const novoStatus =
    pag.status === "MEMBRO_INFORMOU" ? "VALIDADO" : "ADMIN_CONFIRMOU";

  await prisma.pagamentoLocal.update({
    where: { id },
    data: {
      status: novoStatus,
      adminConfirmouEm: new Date(),
      adminConfirmouPorId: usuario?.id,
    },
  });

  // Se virou VALIDADO e origem é evento, marca inscrição como CONFIRMADA
  if (novoStatus === "VALIDADO" && pag.origem === "evento") {
    await prisma.inscricaoEvento.updateMany({
      where: { pagamentoLocalId: id },
      data: { status: "CONFIRMADA" },
    });
  }

  return NextResponse.redirect(
    new URL(`/admin/pagamentos-locais?ok=${novoStatus.toLowerCase()}`, url.origin),
  );
}
