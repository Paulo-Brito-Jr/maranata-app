"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FaixaEtariaKids } from "@prisma/client";

export async function atualizarCrianca(id: string, formData: FormData) {
  const igrejaId = String(formData.get("igrejaId") || "");
  const nome = String(formData.get("nome") || "").trim();
  const dataNascimento = String(formData.get("dataNascimento") || "");
  const faixaEtaria = String(formData.get("faixaEtaria") || "KIDS_1") as FaixaEtariaKids;
  const alergias = String(formData.get("alergias") || "").trim() || null;
  const restricoesAlim = String(formData.get("restricoesAlim") || "").trim() || null;
  const autorizaImagem = formData.get("autorizaImagem") === "on";
  const ativa = formData.get("ativa") === "on";
  if (!igrejaId || !nome) return;
  await prisma.kidsCrianca.update({
    where: { id },
    data: {
      igrejaId,
      nome,
      dataNascimento: dataNascimento ? new Date(dataNascimento) : undefined,
      faixaEtaria,
      alergias,
      restricoesAlim,
      autorizaImagem,
      ativa,
    },
  });
  revalidatePath("/admin/kids/criancas");
  revalidatePath("/admin/kids");
}

export async function excluirCrianca(id: string): Promise<void> {
  const ativos = await prisma.kidsCheckin.count({ where: { criancaId: id, saidaEm: null } });
  if (ativos > 0) throw new Error("Criança em check-in ativo — finalize antes de excluir");
  await prisma.kidsCheckin.deleteMany({ where: { criancaId: id } });
  await prisma.kidsResponsavel.deleteMany({ where: { criancaId: id } });
  await prisma.kidsCrianca.delete({ where: { id } });
  revalidatePath("/admin/kids/criancas");
  revalidatePath("/admin/kids");
}

export async function criarCrianca(formData: FormData) {
  const igrejaId = String(formData.get("igrejaId") || "");
  const nome = String(formData.get("nome") || "").trim();
  const dataNascimento = String(formData.get("dataNascimento") || "");
  const faixaEtaria = String(formData.get("faixaEtaria") || "KIDS_1") as FaixaEtariaKids;
  const alergias = String(formData.get("alergias") || "").trim() || null;
  const restricoesAlim = String(formData.get("restricoesAlim") || "").trim() || null;
  const autorizaImagem = formData.get("autorizaImagem") === "on";
  const nomeResp = String(formData.get("nomeResp") || "").trim();
  const telefoneResp = String(formData.get("telefoneResp") || "").trim() || null;

  if (!igrejaId || !nome || !dataNascimento || !nomeResp) return;

  await prisma.kidsCrianca.create({
    data: {
      igrejaId,
      nome,
      dataNascimento: new Date(dataNascimento),
      faixaEtaria,
      alergias,
      restricoesAlim,
      autorizaImagem,
      responsaveis: {
        create: {
          nome: nomeResp,
          telefone: telefoneResp,
          parentesco: "Responsável",
          principal: true,
          podeBuscar: true,
        },
      },
    },
  });

  revalidatePath("/admin/kids");
  redirect("/admin/kids");
}

export async function criarTrilha(formData: FormData) {
  const titulo = String(formData.get("titulo") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim() || null;
  const obrigatoria = formData.get("obrigatoria") === "on";
  if (!titulo) return;
  await prisma.trilha.create({ data: { titulo, descricao, obrigatoria } });
  revalidatePath("/admin/jornadas");
}

export async function criarProduto(formData: FormData) {
  const nome = String(formData.get("nome") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  const preco = String(formData.get("preco") || "0");
  const descricao = String(formData.get("descricao") || "").trim() || null;
  if (!nome || !slug || Number(preco) <= 0) return;
  await prisma.lojaProduto.create({
    data: { nome, slug, preco, descricao, status: "RASCUNHO" },
  });
  revalidatePath("/admin/loja");
}
