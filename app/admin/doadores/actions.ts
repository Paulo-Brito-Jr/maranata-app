"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

function val(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v || null;
}

export async function atualizarDoador(id: string, formData: FormData): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA", "FINANCEIRO");
  const nome = val(formData, "nome");
  const email = val(formData, "email");
  const telefone = val(formData, "telefone");
  const documento = val(formData, "documento");
  const personType = val(formData, "personType");
  const pixKey = val(formData, "pixKey");
  const banco = val(formData, "banco");
  const agencia = val(formData, "agencia");
  const conta = val(formData, "conta");
  const igrejaId = val(formData, "igrejaId");
  const hasWhatsapp = formData.get("hasWhatsapp") === "on";
  if (!nome) return;

  await prisma.doador.update({
    where: { id },
    data: {
      nome,
      email,
      telefone,
      documento,
      personType,
      pixKey,
      banco,
      agencia,
      conta,
      igrejaId,
      hasWhatsapp,
    },
  });
  revalidatePath("/admin/doadores");
  redirect("/admin/doadores");
}

export async function excluirDoador(id: string): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA");
  await prisma.doador.delete({ where: { id } });
  revalidatePath("/admin/doadores");
  redirect("/admin/doadores");
}
