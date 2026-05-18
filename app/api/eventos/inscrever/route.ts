import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const form = await req.formData();
  const eventoId = form.get("eventoId")?.toString();
  const nome = form.get("nome")?.toString();
  const email = form.get("email")?.toString();
  const telefone = form.get("telefone")?.toString() || null;
  const ingressoId = form.get("ingressoId")?.toString() || null;

  if (!eventoId || !nome || !email) {
    return NextResponse.redirect(new URL("/eventos?err=campos", url.origin));
  }

  const evento = await prisma.evento.findUnique({
    where: { id: eventoId },
    select: { slug: true, inscricoesAbertas: true },
  });

  if (!evento || !evento.inscricoesAbertas) {
    return NextResponse.redirect(new URL("/eventos?err=fechado", url.origin));
  }

  const inscricao = await prisma.inscricaoEvento.create({
    data: {
      eventoId,
      ingressoId,
      nomeAvulso: nome,
      emailAvulso: email,
      telefoneAvulso: telefone,
      status: "CONFIRMADA",
    },
    select: { id: true, qrCode: true },
  });

  return NextResponse.redirect(
    new URL(`/eventos/${evento.slug}/inscrito?ref=${inscricao.qrCode}`, url.origin),
  );
}
