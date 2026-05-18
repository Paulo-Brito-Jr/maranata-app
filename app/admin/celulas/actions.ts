"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { StatusCelula } from "@prisma/client";

const CelulaInput = z.object({
  igrejaId: z.string().min(1, "Selecione a igreja"),
  redeId: z.string().optional().or(z.literal("")),
  nome: z.string().min(2, "Nome muito curto"),
  descricao: z.string().optional().or(z.literal("")),
  endereco: z.string().optional().or(z.literal("")),
  cidade: z.string().optional().or(z.literal("")),
  diaSemana: z.string().optional().or(z.literal("")),
  horario: z.string().optional().or(z.literal("")),
  status: z.nativeEnum(StatusCelula).default(StatusCelula.ATIVA),
});

export async function criarCelula(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const data = CelulaInput.parse(raw);
  const c = await prisma.celula.create({
    data: {
      igrejaId: data.igrejaId,
      redeId: data.redeId || null,
      nome: data.nome,
      descricao: data.descricao || null,
      endereco: data.endereco || null,
      cidade: data.cidade || null,
      diaSemana: data.diaSemana ? Number(data.diaSemana) : null,
      horario: data.horario || null,
      status: data.status,
    },
  });
  revalidatePath("/admin/celulas");
  redirect(`/admin/celulas/${c.id}`);
}

export async function atualizarCelula(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData);
  const data = CelulaInput.parse(raw);
  await prisma.celula.update({
    where: { id },
    data: {
      igrejaId: data.igrejaId,
      redeId: data.redeId || null,
      nome: data.nome,
      descricao: data.descricao || null,
      endereco: data.endereco || null,
      cidade: data.cidade || null,
      diaSemana: data.diaSemana ? Number(data.diaSemana) : null,
      horario: data.horario || null,
      status: data.status,
    },
  });
  revalidatePath("/admin/celulas");
  revalidatePath(`/admin/celulas/${id}`);
  redirect(`/admin/celulas/${id}`);
}

export async function deletarCelula(id: string) {
  await prisma.celula.delete({ where: { id } });
  revalidatePath("/admin/celulas");
  redirect("/admin/celulas");
}
