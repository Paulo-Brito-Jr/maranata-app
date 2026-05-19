import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const schema = z.object({ qrCode: z.string().min(4) });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(
      "SUPER_ADMIN",
      "PASTOR_DIRETORIA",
      "ADMIN_IGREJA",
      "SECRETARIA",
    );
  } catch {
    return NextResponse.json({ ok: false, erro: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success)
    return NextResponse.json({ ok: false, erro: "Payload inválido" }, { status: 400 });

  const inscricao = await prisma.inscricaoEvento.findUnique({
    where: { qrCode: parsed.data.qrCode },
    include: { membro: { select: { nome: true } } },
  });

  if (!inscricao) {
    return NextResponse.json(
      { ok: false, erro: "QR não encontrado" },
      { status: 404 },
    );
  }
  if (inscricao.eventoId !== id) {
    return NextResponse.json(
      { ok: false, erro: "QR é de outro evento" },
      { status: 400 },
    );
  }

  const nome = inscricao.membro?.nome ?? inscricao.nomeAvulso ?? "Inscrito";

  if (inscricao.checkInEm) {
    return NextResponse.json({
      ok: true,
      nome,
      jaCheckin: true,
      checkInEm: inscricao.checkInEm,
    });
  }

  await prisma.inscricaoEvento.update({
    where: { id: inscricao.id },
    data: { checkInEm: new Date(), status: "CONFIRMADA" },
  });

  return NextResponse.json({ ok: true, nome });
}
