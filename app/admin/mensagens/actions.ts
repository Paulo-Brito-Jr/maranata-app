"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const MensagemInput = z.object({
  chave: z.string().min(1, "Chave obrigatória"),
  titulo: z.string().min(1, "Título obrigatório"),
  conteudo: z.string().min(1, "Conteúdo obrigatório"),
  variaveis: z.string().optional().or(z.literal("")),
  ativa: z.string().optional().or(z.literal("")),
});

const MensagemEditInput = MensagemInput.extend({
  id: z.string().min(1),
});

function normalizarChave(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseVariaveis(raw: string | undefined | null): string[] | null {
  if (!raw) return null;
  const arr = raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return arr.length > 0 ? arr : null;
}

export async function criarMensagemAction(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const data = MensagemInput.parse(raw);
  const chave = normalizarChave(data.chave);
  if (!chave) return;

  const variaveis = parseVariaveis(data.variaveis);

  await prisma.mensagemSistema.upsert({
    where: { chave },
    create: {
      chave,
      titulo: data.titulo,
      conteudo: data.conteudo,
      ativa: data.ativa !== "off",
      variaveisJson: variaveis ?? undefined,
    },
    update: {
      titulo: data.titulo,
      conteudo: data.conteudo,
      ativa: data.ativa !== "off",
      variaveisJson: variaveis ?? undefined,
    },
  });

  revalidatePath("/admin/mensagens");
}

export async function atualizarMensagemAction(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const data = MensagemEditInput.parse(raw);
  const variaveis = parseVariaveis(data.variaveis);

  await prisma.mensagemSistema.update({
    where: { id: data.id },
    data: {
      titulo: data.titulo,
      conteudo: data.conteudo,
      ativa: data.ativa !== "off",
      variaveisJson: variaveis ?? undefined,
    },
  });

  revalidatePath("/admin/mensagens");
}

export async function toggleMensagemAtivaAction(id: string, ativa: boolean) {
  await prisma.mensagemSistema.update({
    where: { id },
    data: { ativa },
  });
  revalidatePath("/admin/mensagens");
}

export async function excluirMensagemAction(id: string) {
  await prisma.mensagemSistema.delete({ where: { id } });
  revalidatePath("/admin/mensagens");
}
