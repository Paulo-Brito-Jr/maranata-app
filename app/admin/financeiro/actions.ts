"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  TipoLancamento,
  StatusLancamento,
  FormaPagamento,
} from "@prisma/client";

const LancamentoInput = z.object({
  igrejaId: z.string().min(1),
  categoriaId: z.string().optional().or(z.literal("")),
  contaId: z.string().optional().or(z.literal("")),
  tipo: z.nativeEnum(TipoLancamento),
  status: z.nativeEnum(StatusLancamento).default(StatusLancamento.PENDENTE),
  formaPagamento: z.nativeEnum(FormaPagamento).optional().or(z.literal("")),
  valor: z.string().min(1),
  data: z.string().min(1),
  descricao: z.string().optional().or(z.literal("")),
});

export async function criarLancamento(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const data = LancamentoInput.parse(raw);
  await prisma.lancamentoFinanceiro.create({
    data: {
      igrejaId: data.igrejaId,
      categoriaId: data.categoriaId || null,
      contaId: data.contaId || null,
      tipo: data.tipo,
      status: data.status,
      formaPagamento: (data.formaPagamento as FormaPagamento) || null,
      valor: data.valor,
      data: new Date(data.data),
      descricao: data.descricao || null,
    },
  });
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin/financeiro/lancamentos");
  redirect("/admin/financeiro/lancamentos");
}

export async function deletarLancamento(id: string) {
  await prisma.lancamentoFinanceiro.delete({ where: { id } });
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin/financeiro/lancamentos");
  redirect("/admin/financeiro/lancamentos");
}

const CampanhaInput = z.object({
  igrejaId: z.string().optional().or(z.literal("")),
  titulo: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hífen"),
  descricao: z.string().optional().or(z.literal("")),
  meta: z.string().optional().or(z.literal("")),
  inicio: z.string().optional().or(z.literal("")),
  fim: z.string().optional().or(z.literal("")),
});

export async function criarCampanha(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const data = CampanhaInput.parse(raw);
  const c = await prisma.campanha.create({
    data: {
      igrejaId: data.igrejaId || null,
      titulo: data.titulo,
      slug: data.slug,
      descricao: data.descricao || null,
      meta: data.meta || null,
      inicio: data.inicio ? new Date(data.inicio) : null,
      fim: data.fim ? new Date(data.fim) : null,
    },
  });
  revalidatePath("/admin/financeiro/campanhas");
  redirect(`/admin/financeiro/campanhas/${c.id}`);
}
