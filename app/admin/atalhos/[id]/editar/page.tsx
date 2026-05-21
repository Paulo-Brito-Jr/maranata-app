import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Field, Input, Button, Select } from "@/components/ui/field";
import { atualizarAtalhoAction, excluirAtalhoAction } from "../../actions";

export const metadata = { title: "Editar atalho" };
export const dynamic = "force-dynamic";

export default async function EditarAtalhoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [atalho, igrejas] = await Promise.all([
    prisma.atalho.findUnique({ where: { id } }),
    prisma.igreja.findMany({
      where: { ativa: true, tipo: "CONGREGACAO" as const },
      select: { id: true, nome: true, apelido: true },
      orderBy: { nome: "asc" },
    }),
  ]);
  if (!atalho) notFound();

  const atualizarComId = atualizarAtalhoAction.bind(null, id);
  const excluirComId = excluirAtalhoAction.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <Link href="/admin/atalhos" className="text-sm text-muted-foreground hover:text-primary">
            ← Atalhos
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Editar atalho</h1>
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

      <form action={atualizarComId} className="grid gap-3 rounded-2xl border border-border bg-card p-6 md:grid-cols-2">
        <Field label="Título" required>
          <Input name="titulo" required defaultValue={atalho.titulo} />
        </Field>
        <Field label="URL/Link" required>
          <Input name="linkUrl" required defaultValue={atalho.linkUrl} />
        </Field>
        <Field label="Ícone">
          <Input name="icone" defaultValue={atalho.icone ?? ""} />
        </Field>
        <Field label="Ordem">
          <Input type="number" name="ordem" defaultValue={atalho.ordem} />
        </Field>
        <Field label="Escopo" className="md:col-span-2">
          <Select name="igrejaId" defaultValue={atalho.igrejaId ?? "GERAL"}>
            <option value="GERAL">🌐 Geral (todas as 14 unidades)</option>
            {igrejas.map((ig) => (
              <option key={ig.id} value={ig.id}>📍 Local — {ig.apelido ?? ig.nome}</option>
            ))}
          </Select>
        </Field>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" name="ativo" defaultChecked={atalho.ativo} />
          Atalho ativo
        </label>
        <div className="md:col-span-2">
          <Button type="submit">Salvar alterações</Button>
        </div>
      </form>
    </div>
  );
}
