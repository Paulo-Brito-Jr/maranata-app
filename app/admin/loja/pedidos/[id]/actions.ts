"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { StatusPedido } from "@prisma/client";

export async function mudarStatusPedido(formData: FormData): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA", "FINANCEIRO");
  const id = String(formData.get("pedidoId") || "");
  const status = String(formData.get("status") || "") as StatusPedido;
  if (!id || !status) return;

  const data: Parameters<typeof prisma.lojaPedido.update>[0]["data"] = { status };
  if (status === "PAGO") data.pagoEm = new Date();
  if (status === "ENVIADO") data.enviadoEm = new Date();

  await prisma.lojaPedido.update({ where: { id }, data });
  revalidatePath(`/admin/loja/pedidos/${id}`);
  revalidatePath("/admin/loja");
}
