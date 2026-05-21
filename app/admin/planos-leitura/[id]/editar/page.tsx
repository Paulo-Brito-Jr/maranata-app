import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Field, Input, Textarea, Button, Select } from "@/components/ui/field";
import { atualizarPlanoAction, excluirPlanoAction } from "../../actions";

export const metadata = { title: "Editar plano de leitura" };
export const dynamic = "force-dynamic";

export default async function EditarPlanoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [plano, igrejas] = await Promise.all([
    prisma.planoLeitura.findUnique({ where: { id } }),
    prisma.igreja.findMany({
      where: { ativa: true, tipo: "CONGREGACAO" as const },
      select: { id: true, nome: true, apelido: true },
      orderBy: { nome: "asc" },
    }),
  ]);
  if (!plano) notFound();

  const atualizarComId = atualizarPlanoAction.bind(null, id);
  const excluirComId = excluirPlanoAction.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <Link href="/admin/planos-leitura" className="text-sm text-muted-foreground hover:text-primary">
            ← Planos de leitura
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Editar plano</h1>
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

      <form action={atualizarComId} className="grid gap-4 rounded-2xl border border-border bg-card p-6 md:grid-cols-2">
        <Field label="Título" required className="md:col-span-2">
          <Input name="titulo" required defaultValue={plano.titulo} />
        </Field>
        <Field label="Descrição" className="md:col-span-2">
          <Textarea name="descricao" rows={3} defaultValue={plano.descricao ?? ""} />
        </Field>
        <Field label="Capa (URL)">
          <Input name="capaUrl" defaultValue={plano.capaUrl ?? ""} />
        </Field>
        <Field label="Escopo">
          <Select name="igrejaId" defaultValue={plano.igrejaId ?? "GERAL"}>
            <option value="GERAL">🌐 Geral (todas as 14 unidades)</option>
            {igrejas.map((ig) => (
              <option key={ig.id} value={ig.id}>
                📍 Local — {ig.apelido ?? ig.nome}
              </option>
            ))}
          </Select>
        </Field>
        <div className="md:col-span-2">
          <Button type="submit">Salvar alterações</Button>
        </div>
      </form>
    </div>
  );
}
