"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function criarCurso(formData: FormData): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA");
  const nome = String(formData.get("nome") || "").trim();
  const cargaHoraria = Number(formData.get("cargaHoraria") || 2400);
  const duracaoSemestres = Number(formData.get("duracaoSemestres") || 8);
  const descricao = String(formData.get("descricao") || "").trim() || null;
  if (!nome) return;
  const c = await prisma.ibmCurso.create({
    data: { nome, cargaHoraria, duracaoSemestres, descricao },
  });
  revalidatePath("/admin/escola/ibm/cursos");
  redirect(`/admin/escola/ibm/cursos/${c.id}`);
}

export async function criarDisciplina(formData: FormData): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA");
  const cursoId = String(formData.get("cursoId") || "");
  const codigo = String(formData.get("codigo") || "").trim().toUpperCase();
  const nome = String(formData.get("nome") || "").trim();
  const creditos = Number(formData.get("creditos") || 2);
  const cargaHoraria = Number(formData.get("cargaHoraria") || 40);
  const semestreSugerido = Number(formData.get("semestreSugerido") || 1);
  const ementa = String(formData.get("ementa") || "").trim() || null;
  if (!cursoId || !codigo || !nome) return;

  await prisma.ibmDisciplina.create({
    data: { cursoId, codigo, nome, creditos, cargaHoraria, semestreSugerido, ementa },
  });
  revalidatePath(`/admin/escola/ibm/cursos/${cursoId}`);
}
