"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const TIPOS = ["text", "number", "date", "boolean", "select"] as const;
const ENTIDADES = ["Membro", "Visitante", "Evento"] as const;

const CampoInput = z.object({
  chave: z.string().min(1, "Chave obrigatória"),
  rotulo: z.string().min(1, "Rótulo obrigatório"),
  tipo: z.enum(TIPOS),
  entidade: z.enum(ENTIDADES),
  opcoes: z.string().optional().or(z.literal("")),
  obrigatorio: z.string().optional().or(z.literal("")),
  ativo: z.string().optional().or(z.literal("")),
  ordem: z.string().optional().or(z.literal("")),
});

function normalizarChave(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseOpcoes(raw: string | undefined | null): string[] | null {
  if (!raw) return null;
  const arr = raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return arr.length > 0 ? arr : null;
}

export async function criarCampoAction(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const data = CampoInput.parse(raw);
  const chave = normalizarChave(data.chave);
  if (!chave) return;

  const opcoes = data.tipo === "select" ? parseOpcoes(data.opcoes) : null;
  const ordem = Number(data.ordem || 0);

  await prisma.campoCustomizado.upsert({
    where: { chave },
    create: {
      chave,
      rotulo: data.rotulo,
      tipo: data.tipo,
      entidade: data.entidade,
      opcoesJson: opcoes ?? undefined,
      obrigatorio: data.obrigatorio === "on",
      ativo: data.ativo !== "off",
      ordem: Number.isFinite(ordem) ? ordem : 0,
    },
    update: {
      rotulo: data.rotulo,
      tipo: data.tipo,
      entidade: data.entidade,
      opcoesJson: opcoes ?? undefined,
      obrigatorio: data.obrigatorio === "on",
      ativo: data.ativo !== "off",
      ordem: Number.isFinite(ordem) ? ordem : 0,
    },
  });

  revalidatePath("/admin/campos-customizados");
}

export async function toggleCampoAtivoAction(id: string, ativo: boolean) {
  await prisma.campoCustomizado.update({
    where: { id },
    data: { ativo },
  });
  revalidatePath("/admin/campos-customizados");
}

export async function excluirCampoAction(id: string) {
  await prisma.campoCustomizado.delete({ where: { id } });
  revalidatePath("/admin/campos-customizados");
}
