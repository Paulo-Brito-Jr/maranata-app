import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Recebe form public de doação. Integração Safe2Pay real (checkout + webhook)
 * fica para próxima sessão. Por ora cria DOACAO em status PENDENTE e redireciona
 * pra página de sucesso com a referência.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const form = await req.formData();

  const valorAvulso = form.get("valorAvulso")?.toString();
  const valorRadio = form.get("valor")?.toString();
  const valor = Number(valorAvulso || valorRadio || 0);

  if (!valor || valor < 1) {
    return NextResponse.redirect(new URL("/doar?err=valor", url.origin));
  }

  const nome = form.get("nome")?.toString() || "";
  const email = form.get("email")?.toString() || "";
  const telefone = form.get("telefone")?.toString() || null;
  const frequencia = (form.get("frequencia")?.toString() ?? "AVULSA") as "AVULSA" | "MENSAL" | "ANUAL";
  const campanhaId = form.get("campanhaId")?.toString() || null;

  // Pega a sede como default (todas doações entram nela até admin reclassificar)
  const sede = await prisma.igreja.findFirst({ where: { ehSede: true } });
  if (!sede) {
    return NextResponse.redirect(new URL("/doar?err=sede", url.origin));
  }

  const doacao = await prisma.doacao.create({
    data: {
      igrejaId: sede.id,
      campanhaId,
      nomeDoador: nome,
      emailDoador: email,
      telefoneDoador: telefone,
      valor,
      frequencia,
      status: "PENDENTE",
      formaPagamento: "PIX",
    },
    select: { id: true },
  });

  return NextResponse.redirect(new URL(`/doar/obrigado?ref=${doacao.id}`, url.origin));
}
