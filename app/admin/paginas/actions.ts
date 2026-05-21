"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const PaginaInput = z.object({
  slug: z.string().min(1, "Slug obrigatório"),
  titulo: z.string().min(1, "Título obrigatório"),
  conteudo: z.string().min(1, "Conteúdo obrigatório"),
  publicada: z.string().optional().or(z.literal("")),
});

const PaginaEditInput = PaginaInput.extend({
  id: z.string().min(1),
});

function normalizarSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function criarPaginaAction(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const data = PaginaInput.parse(raw);
  const slug = normalizarSlug(data.slug);
  if (!slug) return;

  await prisma.paginaMultiuso.upsert({
    where: { slug },
    create: {
      slug,
      titulo: data.titulo,
      conteudo: data.conteudo,
      publicada: data.publicada === "on",
    },
    update: {
      titulo: data.titulo,
      conteudo: data.conteudo,
      publicada: data.publicada === "on",
    },
  });

  revalidatePath("/admin/paginas");
}

export async function atualizarPaginaAction(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const data = PaginaEditInput.parse(raw);

  await prisma.paginaMultiuso.update({
    where: { id: data.id },
    data: {
      titulo: data.titulo,
      conteudo: data.conteudo,
      publicada: data.publicada === "on",
    },
  });

  revalidatePath("/admin/paginas");
}

export async function togglePaginaPublicadaAction(id: string, publicada: boolean) {
  await prisma.paginaMultiuso.update({
    where: { id },
    data: { publicada },
  });
  revalidatePath("/admin/paginas");
}

export async function excluirPaginaAction(id: string) {
  await prisma.paginaMultiuso.delete({ where: { id } });
  revalidatePath("/admin/paginas");
}
