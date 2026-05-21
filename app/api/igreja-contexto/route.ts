import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { IGREJA_CONTEXTO_COOKIE } from "@/lib/igreja-contexto";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { igrejaId?: string | null };
  const store = await cookies();

  if (body.igrejaId) {
    store.set(IGREJA_CONTEXTO_COOKIE, body.igrejaId, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 dias
    });
  } else {
    store.delete(IGREJA_CONTEXTO_COOKIE);
  }

  return NextResponse.json({ ok: true });
}
