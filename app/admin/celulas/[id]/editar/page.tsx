import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CelulaForm } from "@/components/forms/celula-form";
import { atualizarCelula, deletarCelula } from "../../actions";

export const metadata = { title: "Editar célula" };

export default async function EditarCelulaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [celula, igrejas, redes] = await Promise.all([
    prisma.celula.findUnique({ where: { id } }),
    prisma.igreja.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    prisma.rede.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
  ]);

  if (!celula) notFound();

  const update = atualizarCelula.bind(null, id);
  const remove = deletarCelula.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <Link href={`/admin/celulas/${id}`} className="text-sm text-muted-foreground hover:text-primary">
          ← Voltar
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Editar célula</h1>
      </header>
      <div className="rounded-2xl border border-border bg-card p-6">
        <CelulaForm
          action={update}
          igrejas={igrejas}
          redes={redes}
          celula={{ ...celula, status: celula.status }}
          submitLabel="Salvar"
        />
      </div>
      <form action={remove} className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
        <h3 className="font-medium text-destructive">Zona de risco</h3>
        <p className="mt-1 text-sm text-muted-foreground">Excluir esta célula permanentemente.</p>
        <button className="mt-3 rounded-full bg-destructive px-5 py-2 text-sm font-medium text-white hover:opacity-90">
          Excluir célula
        </button>
      </form>
    </div>
  );
}
