import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MembroForm } from "@/components/forms/membro-form";
import { atualizarMembro, deletarMembro } from "../../actions";

export const metadata = { title: "Editar membro" };

export default async function EditarMembroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [membro, igrejas] = await Promise.all([
    prisma.membro.findUnique({ where: { id } }),
    prisma.igreja.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
  ]);

  if (!membro) notFound();

  const update = atualizarMembro.bind(null, id);
  const remove = deletarMembro.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <Link href={`/admin/membros/${id}`} className="text-sm text-muted-foreground hover:text-primary">
          ← Voltar
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Editar membro</h1>
      </header>

      <div className="rounded-2xl border border-border bg-card p-6">
        <MembroForm
          action={update}
          igrejas={igrejas}
          membro={{
            ...membro,
            estadoCivil: membro.estadoCivil ?? null,
            email: membro.email ?? null,
          }}
          submitLabel="Salvar alterações"
        />
      </div>

      <form action={remove} className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
        <h3 className="font-medium text-destructive">Zona de risco</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Excluir permanentemente o registro deste membro. Esta ação não pode ser desfeita.
        </p>
        <button className="mt-3 rounded-full bg-destructive px-5 py-2 text-sm font-medium text-white hover:opacity-90">
          Excluir membro
        </button>
      </form>
    </div>
  );
}
