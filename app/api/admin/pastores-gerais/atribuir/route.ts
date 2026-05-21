import { NextResponse } from "next/server";
import { MinisterioGeral } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/admin?err=forbidden", url.origin));
  }

  const form = await req.formData();
  const usuarioId = form.get("usuarioId")?.toString();
  const ministerioRaw = form.get("ministerio")?.toString();

  if (!usuarioId || !ministerioRaw) {
    return NextResponse.redirect(new URL("/admin/pastores-gerais?err=campos", url.origin));
  }

  const ministerio = ministerioRaw as MinisterioGeral;
  if (!Object.values(MinisterioGeral).includes(ministerio)) {
    return NextResponse.redirect(
      new URL("/admin/pastores-gerais?err=ministerio-invalido", url.origin),
    );
  }

  await prisma.pastorGeralMinisterio.upsert({
    where: { usuarioId_ministerio: { usuarioId, ministerio } },
    update: { ativo: true },
    create: { usuarioId, ministerio, ativo: true },
  });

  return NextResponse.redirect(
    new URL(`/admin/pastores-gerais?ok=atribuido`, url.origin),
  );
}
