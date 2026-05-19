import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createCheckout, createSubscription, Safe2PayError } from "@/lib/safe2pay";
import { getAppUrl } from "@/lib/safe2pay/config";

const schema = z.object({
  nome: z.string().min(2).max(120),
  email: z.string().email().max(160),
  telefone: z
    .string()
    .max(32)
    .optional()
    .transform((v) => v?.trim() || undefined),
  documento: z
    .string()
    .max(32)
    .optional()
    .transform((v) => v?.trim() || undefined),
  valor: z.coerce.number().positive().max(1_000_000),
  frequencia: z.enum(["AVULSA", "MENSAL", "ANUAL"]).default("AVULSA"),
  campanhaId: z
    .string()
    .max(64)
    .optional()
    .transform((v) => v?.trim() || undefined),
});

export async function POST(req: Request) {
  const url = new URL(req.url);
  const form = await req.formData();

  const valorAvulso = form.get("valorAvulso")?.toString();
  const valorRadio = form.get("valor")?.toString();
  const valorRaw = valorAvulso || valorRadio;

  const parsed = schema.safeParse({
    nome: form.get("nome")?.toString() ?? "",
    email: form.get("email")?.toString() ?? "",
    telefone: form.get("telefone")?.toString() || undefined,
    documento: form.get("documento")?.toString() || undefined,
    valor: valorRaw,
    frequencia: form.get("frequencia")?.toString() || "AVULSA",
    campanhaId: form.get("campanhaId")?.toString() || undefined,
  });

  if (!parsed.success) {
    const code = String(parsed.error.issues[0]?.path[0] ?? "valor");
    return NextResponse.redirect(new URL(`/doar?err=${code}`, url.origin));
  }

  const data = parsed.data;
  const sede = await prisma.igreja.findFirst({ where: { ehSede: true } });
  if (!sede) {
    return NextResponse.redirect(new URL("/doar?err=sede", url.origin));
  }

  const webhookUrl = `${getAppUrl()}/api/webhooks/safe2pay`;
  const callbackUrl = `${getAppUrl()}/doar/obrigado`;

  try {
    if (data.frequencia === "MENSAL" || data.frequencia === "ANUAL") {
      const assinatura = await prisma.safe2PayAssinatura.create({
        data: {
          email: data.email,
          valor: data.valor,
          frequencia: data.frequencia,
          ativa: true,
        },
        select: { id: true },
      });

      const sub = await createSubscription({
        reference: assinatura.id,
        amount: data.valor,
        frequency: data.frequencia === "MENSAL" ? "MONTHLY" : "ANNUAL",
        webhookUrl,
        customer: {
          name: data.nome,
          email: data.email,
          phone: data.telefone,
          document: data.documento,
        },
      });

      const doacao = await prisma.doacao.create({
        data: {
          igrejaId: sede.id,
          campanhaId: data.campanhaId,
          assinaturaId: assinatura.id,
          nomeDoador: data.nome,
          emailDoador: data.email,
          telefoneDoador: data.telefone,
          documento: data.documento,
          valor: data.valor,
          frequencia: data.frequencia,
          status: "PENDENTE",
          formaPagamento: "PIX",
        },
        select: { id: true },
      });

      await prisma.safe2PayAssinatura.update({
        where: { id: assinatura.id },
        data: { safe2payId: sub.subscriptionId },
      });

      const redirectUrl = sub.checkoutUrl ?? `${getAppUrl()}/doar/obrigado?ref=${doacao.id}`;
      return NextResponse.redirect(redirectUrl);
    }

    const doacao = await prisma.doacao.create({
      data: {
        igrejaId: sede.id,
        campanhaId: data.campanhaId,
        nomeDoador: data.nome,
        emailDoador: data.email,
        telefoneDoador: data.telefone,
        documento: data.documento,
        valor: data.valor,
        frequencia: "AVULSA",
        status: "PENDENTE",
        formaPagamento: "PIX",
      },
      select: { id: true },
    });

    const checkout = await createCheckout({
      reference: doacao.id,
      amount: data.valor,
      description: `Doação ${data.nome} — IME Maranata`,
      callbackUrl: `${callbackUrl}?ref=${doacao.id}`,
      webhookUrl,
      customer: {
        name: data.nome,
        email: data.email,
        phone: data.telefone,
        document: data.documento,
      },
      paymentMethods: ["PIX", "CREDIT_CARD"],
    });

    await prisma.doacao.update({
      where: { id: doacao.id },
      data: { safe2payId: checkout.transactionId },
    });

    return NextResponse.redirect(checkout.checkoutUrl);
  } catch (err) {
    const code = err instanceof Safe2PayError ? `safe2pay_${err.status || "fail"}` : "checkout";
    return NextResponse.redirect(new URL(`/doar?err=${code}`, url.origin));
  }
}
