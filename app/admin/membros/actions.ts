"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { StatusMembro, EstadoCivil } from "@prisma/client";

const MembroInput = z.object({
  igrejaId: z.string().min(1, "Selecione a igreja"),
  nome: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  telefone: z.string().optional().or(z.literal("")),
  dataNascimento: z.string().optional().or(z.literal("")),
  cpf: z.string().optional().or(z.literal("")),
  profissao: z.string().optional().or(z.literal("")),
  estadoCivil: z.nativeEnum(EstadoCivil).optional().or(z.literal("")),
  dataBatismo: z.string().optional().or(z.literal("")),
  dataConversao: z.string().optional().or(z.literal("")),
  status: z.nativeEnum(StatusMembro).default(StatusMembro.ATIVO),
  endereco: z.string().optional().or(z.literal("")),
  cidade: z.string().optional().or(z.literal("")),
  observacoes: z.string().optional().or(z.literal("")),
});

function clean<T extends Record<string, unknown>>(input: T) {
  const out = { ...input } as Record<string, unknown>;
  for (const k of Object.keys(out)) {
    if (out[k] === "" || out[k] === undefined) out[k] = null;
  }
  return out;
}

export async function criarMembro(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const data = MembroInput.parse(raw);
  const c = clean(data);

  const membro = await prisma.membro.create({
    data: {
      igrejaId: c.igrejaId as string,
      nome: c.nome as string,
      email: (c.email as string) ?? null,
      telefone: (c.telefone as string) ?? null,
      cpf: (c.cpf as string) ?? null,
      profissao: (c.profissao as string) ?? null,
      estadoCivil: (c.estadoCivil as EstadoCivil) ?? null,
      dataNascimento: c.dataNascimento ? new Date(c.dataNascimento as string) : null,
      dataBatismo: c.dataBatismo ? new Date(c.dataBatismo as string) : null,
      dataConversao: c.dataConversao ? new Date(c.dataConversao as string) : null,
      status: (c.status as StatusMembro) ?? StatusMembro.ATIVO,
      endereco: (c.endereco as string) ?? null,
      cidade: (c.cidade as string) ?? null,
      observacoes: (c.observacoes as string) ?? null,
    },
  });

  revalidatePath("/admin/membros");
  redirect(`/admin/membros/${membro.id}`);
}

export async function atualizarMembro(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData);
  const data = MembroInput.parse(raw);
  const c = clean(data);

  await prisma.membro.update({
    where: { id },
    data: {
      igrejaId: c.igrejaId as string,
      nome: c.nome as string,
      email: (c.email as string) ?? null,
      telefone: (c.telefone as string) ?? null,
      cpf: (c.cpf as string) ?? null,
      profissao: (c.profissao as string) ?? null,
      estadoCivil: (c.estadoCivil as EstadoCivil) ?? null,
      dataNascimento: c.dataNascimento ? new Date(c.dataNascimento as string) : null,
      dataBatismo: c.dataBatismo ? new Date(c.dataBatismo as string) : null,
      dataConversao: c.dataConversao ? new Date(c.dataConversao as string) : null,
      status: (c.status as StatusMembro) ?? StatusMembro.ATIVO,
      endereco: (c.endereco as string) ?? null,
      cidade: (c.cidade as string) ?? null,
      observacoes: (c.observacoes as string) ?? null,
    },
  });

  revalidatePath("/admin/membros");
  revalidatePath(`/admin/membros/${id}`);
  redirect(`/admin/membros/${id}`);
}

export async function deletarMembro(id: string) {
  await prisma.membro.delete({ where: { id } });
  revalidatePath("/admin/membros");
  redirect("/admin/membros");
}
