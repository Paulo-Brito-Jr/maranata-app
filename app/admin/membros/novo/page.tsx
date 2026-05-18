import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MembroForm } from "@/components/forms/membro-form";
import { criarMembro } from "../actions";

export const metadata = { title: "Novo membro" };

export default async function NovoMembroPage() {
  const igrejas = await prisma.igreja.findMany({
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <Link href="/admin/membros" className="text-sm text-muted-foreground hover:text-primary">
          ← Voltar
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Novo membro</h1>
        <p className="text-muted-foreground">Cadastre um membro na membresia da igreja.</p>
      </header>

      <div className="rounded-2xl border border-border bg-card p-6">
        <MembroForm action={criarMembro} igrejas={igrejas} submitLabel="Cadastrar" />
      </div>
    </div>
  );
}
