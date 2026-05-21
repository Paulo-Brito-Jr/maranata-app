import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Field, Input, Select, Textarea, Button } from "@/components/ui/field";
import { atualizarPregacao, excluirPregacao } from "../../actions";

export const metadata = { title: "Editar pregação" };
export const dynamic = "force-dynamic";

function ymd(d: Date | null): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export default async function EditarPregacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [pregacao, categorias, igrejas] = await Promise.all([
    prisma.pregacao.findUnique({ where: { id } }),
    prisma.categoriaPregacao.findMany({ orderBy: { nome: "asc" } }),
    prisma.igreja.findMany({
      where: { ativa: true, tipo: "CONGREGACAO" as const },
      select: { id: true, nome: true, apelido: true },
      orderBy: { nome: "asc" },
    }),
  ]);
  if (!pregacao) notFound();

  const atualizarComId = atualizarPregacao.bind(null, id);
  const excluirComId = excluirPregacao.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <Link href="/admin/pregacoes" className="text-sm text-muted-foreground hover:text-primary">
            ← Pregações
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Editar pregação</h1>
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

      <form action={atualizarComId} className="space-y-5 rounded-2xl border border-border bg-card p-6">
        <Field label="Título" required>
          <Input name="titulo" required defaultValue={pregacao.titulo} />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Pregador">
            <Input name="pregador" defaultValue={pregacao.pregador ?? ""} />
          </Field>
          <Field label="Data">
            <Input type="date" name="data" defaultValue={ymd(pregacao.data)} />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="YouTube ID">
            <Input name="youtubeId" defaultValue={pregacao.youtubeId ?? ""} />
          </Field>
          <Field label="Categoria">
            <Select name="categoriaId" defaultValue={pregacao.categoriaId ?? ""}>
              <option value="">Sem categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Descrição">
          <Textarea name="descricao" rows={3} defaultValue={pregacao.descricao ?? ""} />
        </Field>
        <Field label="Escopo">
          <Select name="igrejaId" defaultValue={pregacao.igrejaId ?? "GERAL"}>
            <option value="GERAL">🌐 Geral (todas as 14 unidades)</option>
            {igrejas.map((ig) => (
              <option key={ig.id} value={ig.id}>📍 Local — {ig.apelido ?? ig.nome}</option>
            ))}
          </Select>
        </Field>
        <Button type="submit">Salvar alterações</Button>
      </form>
    </div>
  );
}
