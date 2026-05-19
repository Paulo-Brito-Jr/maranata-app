import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { IMPERSONA_COOKIE, getRealUser, isPapelValido } from "@/lib/auth";

const corpoSchema = z.object({
  papel: z.enum([
    "PASTOR_DIRETORIA",
    "ADMIN_IGREJA",
    "LIDER_CELULA",
    "SECRETARIA",
    "FINANCEIRO",
    "KIDS_RESPONSAVEL",
    "MEMBRO",
  ]),
});

export async function POST(req: NextRequest) {
  const user = await getRealUser();
  if (!user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  if (user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ erro: "Apenas SUPER_ADMIN pode impersonar" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = corpoSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ erro: "Papel inválido" }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true, papel: parsed.data.papel });
  res.cookies.set(IMPERSONA_COOKIE, parsed.data.papel, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 4,
  });
  return res;
}

export async function DELETE() {
  const user = await getRealUser();
  if (!user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(IMPERSONA_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}

export async function GET() {
  const user = await getRealUser();
  if (!user) return NextResponse.json({ logado: false });
  return NextResponse.json({
    logado: true,
    papelReal: user.role,
    podeImpersonar: user.role === "SUPER_ADMIN",
    papeisDisponiveis: corpoSchema.shape.papel.options,
    valido: isPapelValido(user.role),
  });
}
