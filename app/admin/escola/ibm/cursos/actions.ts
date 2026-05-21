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
  const igrejaIdRaw = String(formData.get("igrejaId") || "").trim();
  const igrejaId = igrejaIdRaw && igrejaIdRaw !== "GERAL" ? igrejaIdRaw : null;
  if (!nome) return;
  const c = await prisma.ibmCurso.create({
    data: { nome, cargaHoraria, duracaoSemestres, descricao, igrejaId },
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

export async function atualizarCurso(id: string, formData: FormData): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA");
  const nome = String(formData.get("nome") || "").trim();
  const cargaHoraria = Number(formData.get("cargaHoraria") || 2400);
  const duracaoSemestres = Number(formData.get("duracaoSemestres") || 8);
  const descricao = String(formData.get("descricao") || "").trim() || null;
  const igrejaIdRaw = String(formData.get("igrejaId") || "").trim();
  const igrejaId = igrejaIdRaw && igrejaIdRaw !== "GERAL" ? igrejaIdRaw : null;
  const ativo = formData.get("ativo") === "on";
  if (!nome) return;

  await prisma.ibmCurso.update({
    where: { id },
    data: { nome, cargaHoraria, duracaoSemestres, descricao, igrejaId, ativo },
  });
  revalidatePath("/admin/escola/ibm/cursos");
  revalidatePath(`/admin/escola/ibm/cursos/${id}`);
  redirect(`/admin/escola/ibm/cursos/${id}`);
}

export async function excluirCurso(id: string): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA");
  // Cascade: disciplinas → turmas → matrículas → aulas → presenças → avaliações → notas → preReqs
  const turmas = await prisma.ibmTurma.findMany({
    where: { disciplina: { cursoId: id } },
    select: { id: true },
  });
  const turmaIds = turmas.map((t) => t.id);
  if (turmaIds.length > 0) {
    await prisma.ibmNota.deleteMany({ where: { avaliacao: { turmaId: { in: turmaIds } } } });
    await prisma.ibmAvaliacao.deleteMany({ where: { turmaId: { in: turmaIds } } });
    await prisma.ibmPresenca.deleteMany({ where: { aula: { turmaId: { in: turmaIds } } } });
    await prisma.ibmAula.deleteMany({ where: { turmaId: { in: turmaIds } } });
    await prisma.ibmMatricula.deleteMany({ where: { turmaId: { in: turmaIds } } });
    await prisma.ibmTurma.deleteMany({ where: { id: { in: turmaIds } } });
  }
  await prisma.ibmPreRequisito.deleteMany({
    where: { OR: [{ disciplina: { cursoId: id } }, { preRequisito: { cursoId: id } }] },
  });
  await prisma.ibmDisciplina.deleteMany({ where: { cursoId: id } });
  await prisma.ibmMatriculaCurso.deleteMany({ where: { cursoId: id } });
  await prisma.ibmCurso.delete({ where: { id } });
  revalidatePath("/admin/escola/ibm/cursos");
  redirect("/admin/escola/ibm/cursos");
}

export async function atualizarDisciplina(id: string, formData: FormData): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA");
  const codigo = String(formData.get("codigo") || "").trim().toUpperCase();
  const nome = String(formData.get("nome") || "").trim();
  const creditos = Number(formData.get("creditos") || 2);
  const cargaHoraria = Number(formData.get("cargaHoraria") || 40);
  const semestreSugerido = Number(formData.get("semestreSugerido") || 1);
  const ementa = String(formData.get("ementa") || "").trim() || null;
  const ativa = formData.get("ativa") === "on";
  if (!codigo || !nome) return;

  const disc = await prisma.ibmDisciplina.update({
    where: { id },
    data: { codigo, nome, creditos, cargaHoraria, semestreSugerido, ementa, ativa },
    select: { cursoId: true },
  });
  revalidatePath(`/admin/escola/ibm/cursos/${disc.cursoId}`);
}

export async function excluirDisciplina(id: string): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA");
  const disc = await prisma.ibmDisciplina.findUnique({
    where: { id },
    select: { cursoId: true },
  });
  if (!disc) return;
  // Cascade turmas/aulas/presenças/avaliações
  const turmas = await prisma.ibmTurma.findMany({
    where: { disciplinaId: id },
    select: { id: true },
  });
  const turmaIds = turmas.map((t) => t.id);
  if (turmaIds.length > 0) {
    await prisma.ibmNota.deleteMany({ where: { avaliacao: { turmaId: { in: turmaIds } } } });
    await prisma.ibmAvaliacao.deleteMany({ where: { turmaId: { in: turmaIds } } });
    await prisma.ibmPresenca.deleteMany({ where: { aula: { turmaId: { in: turmaIds } } } });
    await prisma.ibmAula.deleteMany({ where: { turmaId: { in: turmaIds } } });
    await prisma.ibmMatricula.deleteMany({ where: { turmaId: { in: turmaIds } } });
    await prisma.ibmTurma.deleteMany({ where: { id: { in: turmaIds } } });
  }
  await prisma.ibmPreRequisito.deleteMany({
    where: { OR: [{ disciplinaId: id }, { preRequisitoId: id }] },
  });
  await prisma.ibmDisciplina.delete({ where: { id } });
  revalidatePath(`/admin/escola/ibm/cursos/${disc.cursoId}`);
}
