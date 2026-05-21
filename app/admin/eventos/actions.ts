"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const EventoInput = z.object({
  igrejaId: z.string().min(1),
  categoriaId: z.string().optional().or(z.literal("")),
  localEventoId: z.string().optional().or(z.literal("")),
  titulo: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hífen"),
  descricao: z.string().optional().or(z.literal("")),
  inicio: z.string().min(1),
  fim: z.string().optional().or(z.literal("")),
  local: z.string().optional().or(z.literal("")),
  endereco: z.string().optional().or(z.literal("")),
  publicado: z.string().optional().or(z.literal("")),
  inscricoesAbertas: z.string().optional().or(z.literal("")),
  ehGeral: z.string().optional().or(z.literal("")),
});

export async function criarEvento(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const data = EventoInput.parse(raw);
  const e = await prisma.evento.create({
    data: {
      igrejaId: data.igrejaId,
      categoriaId: data.categoriaId || null,
      localEventoId: data.localEventoId || null,
      titulo: data.titulo,
      slug: data.slug,
      descricao: data.descricao || null,
      inicio: new Date(data.inicio),
      fim: data.fim ? new Date(data.fim) : null,
      local: data.local || null,
      endereco: data.endereco || null,
      publicado: data.publicado === "on",
      inscricoesAbertas: data.inscricoesAbertas === "on",
      ehGeral: data.ehGeral === "on",
    },
  });
  revalidatePath("/admin/eventos");
  redirect(`/admin/eventos/${e.id}`);
}

export async function atualizarEvento(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData);
  const data = EventoInput.parse(raw);
  await prisma.evento.update({
    where: { id },
    data: {
      igrejaId: data.igrejaId,
      categoriaId: data.categoriaId || null,
      localEventoId: data.localEventoId || null,
      titulo: data.titulo,
      slug: data.slug,
      descricao: data.descricao || null,
      inicio: new Date(data.inicio),
      fim: data.fim ? new Date(data.fim) : null,
      local: data.local || null,
      endereco: data.endereco || null,
      publicado: data.publicado === "on",
      inscricoesAbertas: data.inscricoesAbertas === "on",
      ehGeral: data.ehGeral === "on",
    },
  });
  revalidatePath("/admin/eventos");
  revalidatePath(`/admin/eventos/${id}`);
  redirect(`/admin/eventos/${id}`);
}

export async function deletarEvento(id: string) {
  // Apaga inscrições + lotes + ingressos primeiro (FKs cascateiam via Prisma se schema)
  // Inscrições referenciam Evento, então delete em cascata via prisma.
  await prisma.inscricaoEvento.deleteMany({ where: { eventoId: id } });
  await prisma.loteEvento.deleteMany({ where: { eventoId: id } });
  await prisma.ingressoEvento.deleteMany({ where: { eventoId: id } });
  await prisma.perguntaEvento.deleteMany({ where: { eventoId: id } });
  await prisma.evento.delete({ where: { id } });
  revalidatePath("/admin/eventos");
  redirect("/admin/eventos");
}
