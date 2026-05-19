import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const schema = z.object({ endpoint: z.string().url() });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ erro: "endpoint invalido" }, { status: 400 });
  }

  await prisma.pushSubscription.updateMany({
    where: { endpoint: parsed.data.endpoint },
    data: { ativa: false },
  });

  return NextResponse.json({ ok: true });
}
