import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Field, Input, Textarea, Button, Select } from "@/components/ui/field";
import { atualizarTrilhaAction, excluirTrilhaAction } from "../../actions";

export const metadata = { title: "Editar trilha" };
export const dynamic = "force-dynamic";

export default async function EditarTrilhaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [trilha, igrejas] = await Promise.all([
    prisma.trilha.findUnique({ where: { id } }),
    prisma.igreja.findMany({
      where: { ativa: true, tipo: "CONGREGACAO" as const },
      select: { id: true, nome: true, apelido: true },
      orderBy: { nome: "asc" },
    }),
  ]);
  if (!trilha) notFound();

  const atualizarComId = atualizarTrilhaAction.bind(null, id);
  const excluirComId = excluirTrilhaAction.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <Link href="/admin/jornadas" className="text-sm text-muted-foreground hover:text-primary">
            ← Jornadas
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Editar trilha</h1>
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
        <Field label="Título" required>
          <Input name="titulo" required defaultValue={trilha.titulo} />
        </Field>
        <Field label="Descrição">
          <Textarea name="descricao" rows={3} defaultValue={trilha.descricao ?? ""} />
        </Field>
        <Field label="Escopo">
          <Select name="igrejaId" defaultValue={trilha.igrejaId ?? "GERAL"}>
            <option value="GERAL">🌐 Geral (todas as 14 unidades)</option>
            {igrejas.map((ig) => (
              <option key={ig.id} value={ig.id}>
                📍 Local — {ig.apelido ?? ig.nome}
              </option>
            ))}
          </Select>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="obrigatoria" defaultChecked={trilha.obrigatoria} />
          Obrigatória pra novos convertidos
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="ativa" defaultChecked={trilha.ativa} />
          Ativa
        </label>
        <div>
          <Button type="submit">Salvar alterações</Button>
        </div>
      </form>
    </div>
  );
}
