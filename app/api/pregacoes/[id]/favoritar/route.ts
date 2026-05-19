import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

async function membroDoUser(email: string) {
  return prisma.membro.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  const membro = await membroDoUser(user.email);
  if (!membro) return NextResponse.json({ erro: "Sem cadastro de membro" }, { status: 403 });

  await prisma.pregacaoFavorita.upsert({
    where: { pregacaoId_membroId: { pregacaoId: id, membroId: membro.id } },
    create: { pregacaoId: id, membroId: membro.id },
    update: {},
  });
  return NextResponse.json({ ok: true, favorito: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  const membro = await membroDoUser(user.email);
  if (!membro) return NextResponse.json({ erro: "Sem cadastro de membro" }, { status: 403 });

  await prisma.pregacaoFavorita
    .delete({
      where: { pregacaoId_membroId: { pregacaoId: id, membroId: membro.id } },
    })
    .catch(() => null);
  return NextResponse.json({ ok: true, favorito: false });
}
