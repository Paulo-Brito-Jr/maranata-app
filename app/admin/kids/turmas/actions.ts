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
