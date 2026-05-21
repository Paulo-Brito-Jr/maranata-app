"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { FaixaEbd } from "@prisma/client";

export async function criarClasseEbd(formData: FormData): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA", "SECRETARIA");

  const nome = String(formData.get("nome") || "").trim();
  const igrejaId = String(formData.get("igrejaId") || "");
  const faixa = String(formData.get("faixa") || "GERAL") as FaixaEbd;
  const professorPrincipal = String(formData.get("professorPrincipal") || "").trim() || null;
  const sala = String(formData.get("sala") || "").trim() || null;
  const ciclo = String(formData.get("ciclo") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim() || null;
  const capacidadeStr = String(formData.get("capacidade") || "").trim();
  const capacidade = capacidadeStr ? Number(capacidadeStr) : null;

  if (!nome || !igrejaId || !ciclo) return;

  const c = await prisma.ebdClasse.create({
    data: {
      nome,
      igrejaId,
      faixa,
      professorPrincipal,
      sala,
      ciclo,
      descricao,
      capacidade,
    },
  });

  revalidatePath("/admin/escola/ebd");
  revalidatePath("/admin/escola");
  redirect(`/admin/escola/ebd/${c.id}`);
}

export async function inscreverEmClasse(formData: FormData): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA", "SECRETARIA");

  const classeId = String(formData.get("classeId") || "");
  const membroId = String(formData.get("membroId") || "");
  const ciclo = String(formData.get("ciclo") || "").trim();
  if (!classeId || !membroId || !ciclo) return;

  await prisma.ebdInscricao.upsert({
    where: { classeId_membroId_ciclo: { classeId, membroId, ciclo } },
    create: { classeId, membroId, ciclo },
    update: { status: "ATIVA" },
  });
  revalidatePath(`/admin/escola/ebd/${classeId}`);
}

export async function criarAulaEbd(formData: FormData): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA", "SECRETARIA");

  const classeId = String(formData.get("classeId") || "");
  const data = String(formData.get("data") || "");
  const titulo = String(formData.get("titulo") || "").trim();
  const resumo = String(formData.get("resumo") || "").trim() || null;
  if (!classeId || !data || !titulo) return;

  await prisma.ebdAula.create({
    data: { classeId, data: new Date(data), titulo, resumo },
  });
  revalidatePath(`/admin/escola/ebd/${classeId}`);
}

export async function atualizarClasseEbd(id: string, formData: FormData): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA", "SECRETARIA");

  const nome = String(formData.get("nome") || "").trim();
  const igrejaId = String(formData.get("igrejaId") || "");
  const faixa = String(formData.get("faixa") || "GERAL") as FaixaEbd;
  const professorPrincipal = String(formData.get("professorPrincipal") || "").trim() || null;
  const sala = String(formData.get("sala") || "").trim() || null;
  const ciclo = String(formData.get("ciclo") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim() || null;
  const ativa = formData.get("ativa") === "on";
  const capacidadeStr = String(formData.get("capacidade") || "").trim();
  const capacidade = capacidadeStr ? Number(capacidadeStr) : null;
  if (!nome || !igrejaId || !ciclo) return;

  await prisma.ebdClasse.update({
    where: { id },
    data: {
      nome,
      igrejaId,
      faixa,
      professorPrincipal,
      sala,
      ciclo,
      descricao,
      capacidade,
      ativa,
    },
  });
  revalidatePath("/admin/escola/ebd");
  revalidatePath(`/admin/escola/ebd/${id}`);
  redirect(`/admin/escola/ebd/${id}`);
}

export async function excluirClasseEbd(id: string): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA");
  // cascade manual: inscrições + aulas + presenças
  await prisma.ebdPresenca.deleteMany({ where: { aula: { classeId: id } } });
  await prisma.ebdAula.deleteMany({ where: { classeId: id } });
  await prisma.ebdInscricao.deleteMany({ where: { classeId: id } });
  await prisma.ebdClasse.delete({ where: { id } });
  revalidatePath("/admin/escola/ebd");
  redirect("/admin/escola/ebd");
}
