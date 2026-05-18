import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CelulaForm } from "@/components/forms/celula-form";
import { criarCelula } from "../actions";

export const metadata = { title: "Nova célula" };

export default async function NovaCelulaPage() {
  const [igrejas, redes] = await Promise.all([
    prisma.igreja.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    prisma.rede.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <Link href="/admin/celulas" className="text-sm text-muted-foreground hover:text-primary">
          ← Voltar
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Nova célula</h1>
      </header>
      <div className="rounded-2xl border border-border bg-card p-6">
        <CelulaForm action={criarCelula} igrejas={igrejas} redes={redes} submitLabel="Cadastrar" />
      </div>
    </div>
  );
}
