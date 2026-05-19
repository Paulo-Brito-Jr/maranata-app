"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function marcarPresencaEbd(
  aulaId: string,
  inscricaoId: string,
  presente: boolean,
): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA", "SECRETARIA");
  await prisma.ebdPresenca.upsert({
    where: { aulaId_inscricaoId: { aulaId, inscricaoId } },
    create: { aulaId, inscricaoId, presente },
    update: { presente },
  });
  await atualizarContadorAula(aulaId);
}

export async function salvarChamadaEbd(aulaId: string, formData: FormData): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA", "SECRETARIA");

  const aula = await prisma.ebdAula.findUnique({
    where: { id: aulaId },
    select: { classeId: true, classe: { select: { ciclo: true } } },
  });
  if (!aula) return;

  const inscricoes = await prisma.ebdInscricao.findMany({
    where: { classeId: aula.classeId, ciclo: aula.classe.ciclo, status: "ATIVA" },
    select: { id: true },
  });

  await prisma.$transaction(
    inscricoes.map((i) => {
      const raw = formData.get(`p_${i.id}`);
      const presente = raw === "1";
      return prisma.ebdPresenca.upsert({
        where: { aulaId_inscricaoId: { aulaId, inscricaoId: i.id } },
        create: { aulaId, inscricaoId: i.id, presente },
        update: { presente },
      });
    }),
  );

  await atualizarContadorAula(aulaId);
  revalidatePath(`/admin/escola/ebd/${aula.classeId}`);
  revalidatePath(`/admin/escola/ebd/${aula.classeId}/chamada/${aulaId}`);
}

async function atualizarContadorAula(aulaId: string): Promise<void> {
  const total = await prisma.ebdPresenca.count({
    where: { aulaId, presente: true },
  });
  await prisma.ebdAula.update({
    where: { id: aulaId },
    data: { totalPresentes: total },
  });
}
