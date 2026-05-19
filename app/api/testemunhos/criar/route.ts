import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
  texto: z.string().min(20).max(2000),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ erro: "nao autenticado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ erro: "payload invalido" }, { status: 400 });
  }

  const membro = await prisma.membro.findFirst({
    where: {
      OR: [
        { email: { equals: user.email, mode: "insensitive" } },
      ],
    },
    select: { id: true, nome: true },
  });

  const testemunho = await prisma.testemunho.create({
    data: {
      texto: parsed.data.texto,
      publicado: false,
      destaque: false,
      membroId: membro?.id ?? null,
      nomeAvulso: membro ? null : user.name,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: testemunho.id });
}
