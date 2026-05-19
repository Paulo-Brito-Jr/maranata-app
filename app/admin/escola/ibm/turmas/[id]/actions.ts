"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { TipoAvaliacao } from "@prisma/client";

const PROF_ROLES = ["SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA"] as const;

export async function matricularAluno(formData: FormData): Promise<void> {
  await requireRole(...PROF_ROLES);
  const turmaId = String(formData.get("turmaId") || "");
  const alunoId = String(formData.get("alunoId") || "");
  if (!turmaId || !alunoId) return;
  await prisma.ibmMatricula.upsert({
    where: { turmaId_alunoId: { turmaId, alunoId } },
    create: { turmaId, alunoId },
    update: {},
  });
  revalidatePath(`/admin/escola/ibm/turmas/${turmaId}`);
}

export async function criarAulaIbm(formData: FormData): Promise<void> {
  await requireRole(...PROF_ROLES);
  const turmaId = String(formData.get("turmaId") || "");
  const data = String(formData.get("data") || "");
  const conteudo = String(formData.get("conteudo") || "").trim() || null;
  if (!turmaId || !data) return;
  await prisma.ibmAula.create({ data: { turmaId, data: new Date(data), conteudo } });
  revalidatePath(`/admin/escola/ibm/turmas/${turmaId}`);
}

export async function criarAvaliacao(formData: FormData): Promise<void> {
  await requireRole(...PROF_ROLES);
  const turmaId = String(formData.get("turmaId") || "");
  const tipo = String(formData.get("tipo") || "PROVA") as TipoAvaliacao;
  const titulo = String(formData.get("titulo") || "").trim();
  const peso = formData.get("peso") ? String(formData.get("peso")) : "1.0";
  const notaMax = formData.get("notaMax") ? String(formData.get("notaMax")) : "10.0";
  const dataEntregaStr = String(formData.get("dataEntrega") || "").trim();
  if (!turmaId || !titulo) return;
  await prisma.ibmAvaliacao.create({
    data: {
      turmaId,
      tipo,
      titulo,
      peso,
      notaMax,
      dataEntrega: dataEntregaStr ? new Date(dataEntregaStr) : null,
    },
  });
  revalidatePath(`/admin/escola/ibm/turmas/${turmaId}`);
}

export async function lancarNota(formData: FormData): Promise<void> {
  await requireRole(...PROF_ROLES);
  const matriculaId = String(formData.get("matriculaId") || "");
  const avaliacaoId = String(formData.get("avaliacaoId") || "");
  const turmaId = String(formData.get("turmaId") || "");
  const valorStr = String(formData.get("valor") || "").trim();
  if (!matriculaId || !avaliacaoId) return;

  if (!valorStr) {
    await prisma.ibmNota
      .delete({ where: { matriculaId_avaliacaoId: { matriculaId, avaliacaoId } } })
      .catch(() => null);
  } else {
    await prisma.ibmNota.upsert({
      where: { matriculaId_avaliacaoId: { matriculaId, avaliacaoId } },
      create: { matriculaId, avaliacaoId, valor: valorStr },
      update: { valor: valorStr, lancadaEm: new Date() },
    });
  }
  if (turmaId) revalidatePath(`/admin/escola/ibm/turmas/${turmaId}`);
}

export async function togglePresenca(formData: FormData): Promise<void> {
  await requireRole(...PROF_ROLES);
  const aulaId = String(formData.get("aulaId") || "");
  const matriculaId = String(formData.get("matriculaId") || "");
  const turmaId = String(formData.get("turmaId") || "");
  const acao = String(formData.get("acao") || "");
  if (!aulaId || !matriculaId) return;
  const presente = acao === "presente";
  await prisma.ibmPresenca.upsert({
    where: { aulaId_matriculaId: { aulaId, matriculaId } },
    create: { aulaId, matriculaId, presente },
    update: { presente },
  });

  // Atualiza contador de faltas na matrícula
  const totalFaltas = await prisma.ibmPresenca.count({
    where: { matriculaId, presente: false },
  });
  await prisma.ibmMatricula.update({
    where: { id: matriculaId },
    data: { faltas: totalFaltas },
  });

  if (turmaId) revalidatePath(`/admin/escola/ibm/turmas/${turmaId}`);
}

export async function encerrarTurma(formData: FormData): Promise<void> {
  await requireRole(...PROF_ROLES);
  const turmaId = String(formData.get("turmaId") || "");
  if (!turmaId) return;

  const turma = await prisma.ibmTurma.findUnique({
    where: { id: turmaId },
    include: {
      matriculas: {
        include: {
          notas: { include: { avaliacao: true } },
          presencas: true,
        },
      },
      aulas: { select: { id: true } },
    },
  });
  if (!turma) return;

  const totalAulas = turma.aulas.length;

  await prisma.$transaction(
    turma.matriculas.map((m) => {
      let totalPeso = 0;
      let somaPond = 0;
      for (const n of m.notas) {
        const peso = Number(n.avaliacao.peso);
        totalPeso += peso;
        somaPond += (Number(n.valor) / Number(n.avaliacao.notaMax)) * 10 * peso;
      }
      const media = totalPeso > 0 ? somaPond / totalPeso : 0;
      const faltas = m.presencas.filter((p) => !p.presente).length;
      const pctFaltas = totalAulas > 0 ? (faltas / totalAulas) * 100 : 0;
      const reprovaPorFalta = pctFaltas > 25;
      const aprovado = media >= 6 && !reprovaPorFalta;
      return prisma.ibmMatricula.update({
        where: { id: m.id },
        data: {
          mediaFinal: media.toFixed(2),
          faltas,
          status: aprovado ? "APROVADO" : "REPROVADO",
        },
      });
    }),
  );

  await prisma.ibmTurma.update({
    where: { id: turmaId },
    data: { status: "ENCERRADA" },
  });
  revalidatePath(`/admin/escola/ibm/turmas/${turmaId}`);
}
