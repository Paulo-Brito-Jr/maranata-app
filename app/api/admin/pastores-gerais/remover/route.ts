import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/admin?err=forbidden", url.origin));
  }

  const form = await req.formData();
  const id = form.get("id")?.toString();
  if (!id) {
    return NextResponse.redirect(new URL("/admin/pastores-gerais?err=campos", url.origin));
  }

  await prisma.pastorGeralMinisterio.update({
    where: { id },
    data: { ativo: false },
  });

  return NextResponse.redirect(new URL("/admin/pastores-gerais?ok=removido", url.origin));
}
