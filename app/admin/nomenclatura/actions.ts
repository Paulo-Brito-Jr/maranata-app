"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const SubnomenclaturaInput = z.object({
  chave: z.string().min(1, "Chave obrigatória"),
  padrao: z.string().min(1, "Padrão obrigatório"),
  customizado: z.string().min(1, "Valor customizado obrigatório"),
  contexto: z.string().optional().or(z.literal("")),
});

const SubnomenclaturaEditInput = SubnomenclaturaInput.extend({
  id: z.string().min(1),
});

function normalizarChave(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function criarSubnomenclaturaAction(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const data = SubnomenclaturaInput.parse(raw);
  const chave = normalizarChave(data.chave);
  if (!chave) return;

  await prisma.subnomenclatura.upsert({
    where: { chave },
    create: {
      chave,
      padrao: data.padrao,
      customizado: data.customizado,
      contexto: data.contexto || null,
    },
    update: {
      padrao: data.padrao,
      customizado: data.customizado,
      contexto: data.contexto || null,
    },
  });

  revalidatePath("/admin/nomenclatura");
}

export async function atualizarSubnomenclaturaAction(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const data = SubnomenclaturaEditInput.parse(raw);

  await prisma.subnomenclatura.update({
    where: { id: data.id },
    data: {
      padrao: data.padrao,
      customizado: data.customizado,
      contexto: data.contexto || null,
    },
  });

  revalidatePath("/admin/nomenclatura");
}

export async function excluirSubnomenclaturaAction(id: string) {
  await prisma.subnomenclatura.delete({ where: { id } });
  revalidatePath("/admin/nomenclatura");
}
