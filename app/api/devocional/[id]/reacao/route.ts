import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({ tipo: z.enum(["amem", "abencoado", "orei"]) });

async function membroDoUser(email: string) {
  return prisma.membro.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  const membro = await membroDoUser(user.email);
  if (!membro) return NextResponse.json({ erro: "Sem cadastro de membro" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ erro: "Tipo inválido" }, { status: 400 });

  await prisma.devocionalReacao.upsert({
    where: {
      devocionalId_membroId_tipo: {
        devocionalId: id,
        membroId: membro.id,
        tipo: parsed.data.tipo,
      },
    },
    create: { devocionalId: id, membroId: membro.id, tipo: parsed.data.tipo },
    update: {},
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  const membro = await membroDoUser(user.email);
  if (!membro) return NextResponse.json({ erro: "Sem cadastro de membro" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ erro: "Tipo inválido" }, { status: 400 });

  await prisma.devocionalReacao
    .delete({
      where: {
        devocionalId_membroId_tipo: {
          devocionalId: id,
          membroId: membro.id,
          tipo: parsed.data.tipo,
        },
      },
    })
    .catch(() => null);
  return NextResponse.json({ ok: true });
}
