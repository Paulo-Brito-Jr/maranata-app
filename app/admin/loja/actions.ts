"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { StatusProduto } from "@prisma/client";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export async function criarProdutoAction(formData: FormData) {
  const nome = String(formData.get("nome") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim() || null;
  const precoStr = String(formData.get("preco") || "0").replace(",", ".");
  const preco = parseFloat(precoStr);
  const estoqueStr = String(formData.get("estoque") || "").trim();
  const estoque = estoqueStr ? parseInt(estoqueStr, 10) : null;
  const categoriaId = String(formData.get("categoriaId") || "") || null;
  const status =
    (String(formData.get("status") || "RASCUNHO") as StatusProduto) ||
    "RASCUNHO";
  const slugInput = String(formData.get("slug") || "").trim();
  if (!nome || !(preco > 0)) return;

  const base = slugInput || slugify(nome);
  let slug = base;
  let n = 1;
  while (await prisma.lojaProduto.findUnique({ where: { slug } })) {
    n++;
    slug = `${base}-${n}`;
  }

  await prisma.lojaProduto.create({
    data: {
      nome,
      slug,
      descricao,
      preco,
      estoque,
      categoriaId,
      status,
    },
  });
  revalidatePath("/admin/loja");
}

export async function alterarStatusProdutoAction(
  id: string,
  status: StatusProduto,
) {
  await prisma.lojaProduto.update({ where: { id }, data: { status } });
  revalidatePath("/admin/loja");
}

export async function excluirProdutoAction(id: string) {
  await prisma.lojaProduto.delete({ where: { id } });
  revalidatePath("/admin/loja");
}

export async function criarCategoriaAction(formData: FormData) {
  const nome = String(formData.get("nome") || "").trim();
  if (!nome) return;
  const slug = slugify(nome);
  const max = await prisma.lojaCategoria.aggregate({ _max: { ordem: true } });
  await prisma.lojaCategoria.upsert({
    where: { slug },
    create: { nome, slug, ordem: (max._max.ordem ?? 0) + 1 },
    update: { nome },
  });
  revalidatePath("/admin/loja");
}

export async function toggleCategoriaAtivaAction(
  id: string,
  ativa: boolean,
) {
  await prisma.lojaCategoria.update({ where: { id }, data: { ativa } });
  revalidatePath("/admin/loja");
}

export async function excluirCategoriaAction(id: string) {
  await prisma.lojaCategoria.delete({ where: { id } });
  revalidatePath("/admin/loja");
}
