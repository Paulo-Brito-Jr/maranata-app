import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Field, Input, Textarea, Button, Select } from "@/components/ui/field";
import { criarDevocional, excluirDevocional } from "../../novo/actions";

export const metadata = { title: "Editar devocional" };
export const dynamic = "force-dynamic";

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function EditarDevocionalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [dev, igrejas] = await Promise.all([
    prisma.devocional.findUnique({ where: { id } }),
    prisma.igreja.findMany({
      where: { ativa: true, tipo: "CONGREGACAO" as const },
      select: { id: true, nome: true, apelido: true },
      orderBy: { nome: "asc" },
    }),
  ]);
  if (!dev) notFound();

  const excluirComId = excluirDevocional.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <Link href="/admin/devocional" className="text-sm text-muted-foreground hover:text-primary">
            ← Devocional
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Editar devocional</h1>
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

      <form action={criarDevocional} className="space-y-4">
        <Field label="Data" required>
          <Input type="date" name="data" defaultValue={ymd(dev.data)} required />
        </Field>
        <Field label="Título" required>
          <Input name="titulo" required defaultValue={dev.titulo} />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Referência" required>
            <Input name="versiculoRef" required defaultValue={dev.versiculoRef} />
          </Field>
          <Field label="Autor">
            <Input name="autor" defaultValue={dev.autor ?? ""} />
          </Field>
        </div>
        <Field label="Texto do versículo" required>
          <Textarea name="versiculoTexto" required rows={3} defaultValue={dev.versiculoTexto} />
        </Field>
        <Field label="Reflexão" required>
          <Textarea name="texto" required rows={10} defaultValue={dev.texto} />
        </Field>
        <Field label="Escopo">
          <Select name="igrejaId" defaultValue={dev.igrejaId ?? "GERAL"}>
            <option value="GERAL">🌐 Geral (todas as 14 unidades)</option>
            {igrejas.map((ig) => (
              <option key={ig.id} value={ig.id}>
                📍 Local — {ig.apelido ?? ig.nome}
              </option>
            ))}
          </Select>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="publicado" defaultChecked={dev.publicado} />
          Publicado
        </label>
        <Button type="submit">Salvar alterações</Button>
        <p className="text-xs text-muted-foreground">
          Salvar atualiza o devocional dessa data (upsert por data + escopo).
        </p>
      </form>
    </div>
  );
}
