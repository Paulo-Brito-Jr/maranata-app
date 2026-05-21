"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { FaixaEtariaKids } from "@prisma/client";

export async function criarTurma(formData: FormData): Promise<void> {
  await requireRole(
    "SUPER_ADMIN",
    "PASTOR_DIRETORIA",
    "ADMIN_IGREJA",
    "SECRETARIA",
    "KIDS_RESPONSAVEL",
  );

  const nome = String(formData.get("nome") || "").trim();
  const igrejaId = String(formData.get("igrejaId") || "");
  const faixaEtaria = String(formData.get("faixaEtaria") || "") as FaixaEtariaKids;
  const sala = String(formData.get("sala") || "").trim() || null;
  const capacidadeStr = String(formData.get("capacidade") || "").trim();
  const capacidade = capacidadeStr ? Number(capacidadeStr) : null;

  if (!nome || !igrejaId || !faixaEtaria) return;

  await prisma.kidsTurma.create({
    data: { nome, igrejaId, faixaEtaria, sala, capacidade },
  });

  revalidatePath("/admin/kids/turmas");
  revalidatePath("/admin/kids");
}

export async function alternarTurma(id: string): Promise<void> {
  await requireRole(
    "SUPER_ADMIN",
    "PASTOR_DIRETORIA",
    "ADMIN_IGREJA",
    "SECRETARIA",
    "KIDS_RESPONSAVEL",
  );
  const turma = await prisma.kidsTurma.findUnique({ where: { id }, select: { ativa: true } });
  if (!turma) return;
  await prisma.kidsTurma.update({ where: { id }, data: { ativa: !turma.ativa } });
  revalidatePath("/admin/kids/turmas");
}

export async function atualizarTurma(id: string, formData: FormData): Promise<void> {
  await requireRole(
    "SUPER_ADMIN",
    "PASTOR_DIRETORIA",
    "ADMIN_IGREJA",
    "SECRETARIA",
    "KIDS_RESPONSAVEL",
  );

  const nome = String(formData.get("nome") || "").trim();
  const igrejaId = String(formData.get("igrejaId") || "");
  const faixaEtaria = String(formData.get("faixaEtaria") || "") as FaixaEtariaKids;
  const sala = String(formData.get("sala") || "").trim() || null;
  const capacidadeStr = String(formData.get("capacidade") || "").trim();
  const capacidade = capacidadeStr ? Number(capacidadeStr) : null;

  if (!nome || !igrejaId || !faixaEtaria) return;

  await prisma.kidsTurma.update({
    where: { id },
    data: { nome, igrejaId, faixaEtaria, sala, capacidade },
  });

  revalidatePath("/admin/kids/turmas");
  revalidatePath("/admin/kids");
}

export async function excluirTurma(id: string): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA");
  // Garante que não tem check-in ativo
  const ativos = await prisma.kidsCheckin.count({
    where: { turmaId: id, saidaEm: null },
  });
  if (ativos > 0) {
    throw new Error("Há crianças ativas em sala — finalize check-out primeiro");
  }
  // Histórico de checkins fica órfão? Não, fk em KidsCheckin.turmaId.
  // Vou nullar ou deletar dependendo da política. Deletar é mais limpo.
  await prisma.kidsCheckin.deleteMany({ where: { turmaId: id } });
  await prisma.kidsTurma.delete({ where: { id } });
  revalidatePath("/admin/kids/turmas");
  revalidatePath("/admin/kids");
}
