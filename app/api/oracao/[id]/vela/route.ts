import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const pedido = await prisma.pedidoOracao.findUnique({
    where: { id },
    select: { publico: true },
  });
  if (!pedido || !pedido.publico) {
    return NextResponse.json({ erro: "Pedido não encontrado ou privado" }, { status: 404 });
  }

  const membro = await prisma.membro.findFirst({
    where: { email: { equals: user.email, mode: "insensitive" } },
    select: { id: true },
  });

  await prisma.oracaoVela.upsert({
    where: { pedidoId_membroId: { pedidoId: id, membroId: membro?.id ?? "anon" } },
    create: {
      pedidoId: id,
      membroId: membro?.id ?? null,
      nomeAvulso: membro ? null : user.name,
    },
    update: {},
  });

  const total = await prisma.oracaoVela.count({ where: { pedidoId: id } });
  return NextResponse.json({ ok: true, total });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const membro = await prisma.membro.findFirst({
    where: { email: { equals: user.email, mode: "insensitive" } },
    select: { id: true },
  });

  await prisma.oracaoVela
    .delete({
      where: { pedidoId_membroId: { pedidoId: id, membroId: membro?.id ?? "anon" } },
    })
    .catch(() => null);

  const total = await prisma.oracaoVela.count({ where: { pedidoId: id } });
  return NextResponse.json({ ok: true, total });
}
