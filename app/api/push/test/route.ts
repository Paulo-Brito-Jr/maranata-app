import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { enviarPush, type PushAlvo } from "@/lib/push";

export const runtime = "nodejs";

const schema = z.object({
  titulo: z.string().min(1).max(100).default("Maranata App"),
  corpo: z.string().min(1).max(500).default("Notificação de teste"),
  url: z.string().url().optional(),
  alvo: z
    .enum(["EU", "TODOS"])
    .default("EU"),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ erro: "payload invalido" }, { status: 400 });
  }

  // Restringe TODOS pra admin
  if (
    parsed.data.alvo === "TODOS" &&
    user.role !== "SUPER_ADMIN" &&
    user.role !== "PASTOR_DIRETORIA"
  ) {
    return NextResponse.json({ erro: "sem permissao" }, { status: 403 });
  }

  let alvo: PushAlvo;
  if (parsed.data.alvo === "TODOS") {
    alvo = { tipo: "TODOS" };
  } else {
    // Pra "EU", busca usuario interno pelo sub do MK
    const { prisma } = await import("@/lib/prisma");
    const u = await prisma.usuario.findFirst({
      where: { OR: [{ maranataKeySub: user.sub }, { email: user.email }] },
      select: { id: true },
    });
    if (!u) {
      return NextResponse.json({ erro: "usuario interno nao encontrado" }, { status: 404 });
    }
    alvo = { tipo: "USUARIO", usuarioId: u.id };
  }

  const resultado = await enviarPush(alvo, {
    titulo: parsed.data.titulo,
    corpo: parsed.data.corpo,
    url: parsed.data.url ?? "/",
  });

  return NextResponse.json({ ok: true, ...resultado });
}
