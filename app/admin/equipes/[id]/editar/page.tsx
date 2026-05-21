import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Field, Input, Textarea, Button, Select } from "@/components/ui/field";
import { atualizarEquipeAction, excluirEquipeAction } from "../../actions";

export const metadata = { title: "Editar equipe" };
export const dynamic = "force-dynamic";

export default async function EditarEquipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [equipe, igrejas] = await Promise.all([
    prisma.equipe.findUnique({ where: { id } }),
    prisma.igreja.findMany({
      where: { ativa: true, tipo: "CONGREGACAO" as const },
      select: { id: true, nome: true, apelido: true },
      orderBy: { nome: "asc" },
    }),
  ]);
  if (!equipe) notFound();

  const atualizarComId = atualizarEquipeAction.bind(null, id);
  const excluirComId = excluirEquipeAction.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <Link href="/admin/equipes" className="text-sm text-muted-foreground hover:text-primary">
            ← Equipes
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Editar equipe</h1>
        </div>
        <form action={excluirComId}>
          <button
            type="submit"
            className="rounded-full bg-red-500/10 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-500/20 dark:text-red-400"
          >
            Excluir
          </button>
        </form>
      </header>

      <form action={atualizarComId} className="grid gap-4 rounded-2xl border border-border bg-card p-6">
        <Field label="Nome" required>
          <Input name="nome" required defaultValue={equipe.nome} />
        </Field>
        <Field label="Descrição">
          <Textarea name="descricao" rows={3} defaultValue={equipe.descricao ?? ""} />
        </Field>
        <Field label="Escopo">
          <Select name="igrejaId" defaultValue={equipe.igrejaId ?? "GERAL"}>
            <option value="GERAL">🌐 Geral (corporativo)</option>
            {igrejas.map((ig) => (
              <option key={ig.id} value={ig.id}>
                📍 Local — {ig.apelido ?? ig.nome}
              </option>
            ))}
          </Select>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="ativa" defaultChecked={equipe.ativa} />
          Equipe ativa
        </label>
        <div>
          <Button type="submit">Salvar alterações</Button>
        </div>
      </form>
    </div>
  );
}
