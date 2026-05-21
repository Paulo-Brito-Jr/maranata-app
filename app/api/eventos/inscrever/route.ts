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
  const metodoRaw = form.get("metodoPagamento")?.toString();
  const pagamentoLocalIgrejaId = form.get("pagamentoLocalIgrejaId")?.toString() || null;

  if (!eventoId || !nome || !email) {
    return NextResponse.redirect(new URL("/eventos?err=campos", url.origin));
  }

  const evento = await prisma.evento.findUnique({
    where: { id: eventoId },
    select: { slug: true, inscricoesAbertas: true, titulo: true },
  });

  if (!evento || !evento.inscricoesAbertas) {
    return NextResponse.redirect(new URL("/eventos?err=fechado", url.origin));
  }

  const ingresso = ingressoId
    ? await prisma.ingressoEvento.findUnique({
        where: { id: ingressoId },
        select: { id: true, preco: true, nome: true },
      })
    : null;
  const valor = ingresso ? Number(ingresso.preco) : 0;
  const ehPago = valor > 0;

  // Pagamento em dinheiro localmente — cria PagamentoLocal pendente
  if (ehPago && metodoRaw === "DINHEIRO_LOCAL") {
    if (!pagamentoLocalIgrejaId) {
      return NextResponse.redirect(
        new URL(`/eventos/${evento.slug}?err=sem-igreja`, url.origin),
      );
    }
    const igreja = await prisma.igreja.findUnique({
      where: { id: pagamentoLocalIgrejaId, ativa: true },
      select: { id: true },
    });
    if (!igreja) {
      return NextResponse.redirect(
        new URL(`/eventos/${evento.slug}?err=igreja-invalida`, url.origin),
      );
    }

    const pagamentoLocal = await prisma.pagamentoLocal.create({
      data: {
        origem: "evento",
        origemId: eventoId,
        valor: ingresso!.preco,
        descricao: `${evento.titulo} — ${ingresso!.nome}`,
        nomePagador: nome,
        emailPagador: email,
        telefonePagador: telefone,
        igrejaId: pagamentoLocalIgrejaId,
      },
      select: { id: true },
    });

    const inscricao = await prisma.inscricaoEvento.create({
      data: {
        eventoId,
        ingressoId,
        nomeAvulso: nome,
        emailAvulso: email,
        telefoneAvulso: telefone,
        status: "PENDENTE",
        metodoPagamento: "DINHEIRO_LOCAL",
        pagamentoLocalId: pagamentoLocal.id,
        valorPago: ingresso!.preco,
      },
      select: { qrCode: true },
    });

    return NextResponse.redirect(
      new URL(
        `/eventos/${evento.slug}/inscrito?ref=${inscricao.qrCode}&pl=${pagamentoLocal.id}`,
        url.origin,
      ),
    );
  }

  // PIX / CARTAO / Gratuito — mantém fluxo simples atual (Safe2Pay fica pra fase B)
  const inscricao = await prisma.inscricaoEvento.create({
    data: {
      eventoId,
      ingressoId,
      nomeAvulso: nome,
      emailAvulso: email,
      telefoneAvulso: telefone,
      status: ehPago ? "PENDENTE" : "CONFIRMADA",
      metodoPagamento: ehPago ? (metodoRaw === "CARTAO" ? "CARTAO" : "PIX") : null,
      valorPago: ingresso?.preco,
    },
    select: { id: true, qrCode: true },
  });

  return NextResponse.redirect(
    new URL(`/eventos/${evento.slug}/inscrito?ref=${inscricao.qrCode}`, url.origin),
  );
}
