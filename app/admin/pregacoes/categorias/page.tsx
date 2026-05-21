import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { EmptyState } from "@/components/empty-state";
import { Field, Input, Button, Select } from "@/components/ui/field";
import { getIgrejaContexto, filtroIgrejaWhere } from "@/lib/igreja-contexto";
import {
  criarCategoriaPregacaoAction,
  excluirCategoriaPregacaoAction,
} from "./actions";

export const metadata = { title: "Categorias de pregação" };
export const dynamic = "force-dynamic";

export default async function CategoriasPregacaoPage() {
  // LOUVOR pastor geral vê categorias de todas as unidades.
  const ctx = await getIgrejaContexto({ ministerioPagina: "LOUVOR" });
  const filtroIgreja = filtroIgrejaWhere(ctx);
  const catWhere = filtroIgreja.igrejaId
    ? { OR: [{ igrejaId: null }, { igrejaId: filtroIgreja.igrejaId }] }
    : {};

  const [categorias, igrejas] = await Promise.all([
    prisma.categoriaPregacao.findMany({
      where: catWhere,
      include: {
        igreja: { select: { nome: true, apelido: true } },
        _count: { select: { pregacoes: true } },
      },
      orderBy: [{ igrejaId: "asc" }, { nome: "asc" }],
    }),
    prisma.igreja.findMany({
      where: { ativa: true, ehSede: false },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, apelido: true },
    }),
  ]);

  return (
    <ModuloShell
      titulo="Categorias de pregação"
      descricao="Tags pra organizar pregações (Evangelística, Devocional, Doutrinária, Ministerial)."
      stats={[
        { label: "Total", valor: categorias.length },
        { label: "Gerais", valor: categorias.filter((c) => !c.igrejaId).length },
        { label: "Locais", valor: categorias.filter((c) => c.igrejaId).length },
      ]}
      acoes={[{ href: "/admin/pregacoes", label: "← Pregações" }]}
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Nova categoria</h2>
        <form
          action={criarCategoriaPregacaoAction}
          className="grid gap-4 md:grid-cols-2"
        >
          <Field label="Nome" required>
            <Input name="nome" required placeholder="Evangelística" />
          </Field>
          <Field label="Escopo">
            <Select name="igrejaId" defaultValue="GERAL">
              <option value="GERAL">🌐 Geral (todas as 14 unidades)</option>
              {igrejas.map((ig) => (
                <option key={ig.id} value={ig.id}>
                  📍 Local — {ig.apelido ?? ig.nome}
                </option>
              ))}
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Button type="submit">Criar</Button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Categorias ({categorias.length})
        </h2>
        {categorias.length === 0 ? (
          <EmptyState
            titulo="Sem categorias"
            descricao="Crie a primeira acima."
          />
        ) : (
          <ul className="grid gap-2 md:grid-cols-3">
            {categorias.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
              >
                <div>
                  <p className="text-sm font-medium">{c.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {c._count.pregacoes} pregação(ões)
                    {c.igreja
                      ? ` · 📍 ${c.igreja.apelido ?? c.igreja.nome}`
                      : " · 🌐 Geral"}
                  </p>
                </div>
                <form action={excluirCategoriaPregacaoAction.bind(null, c.id)}>
                  <button
                    className="rounded-full bg-red-500/10 px-2 py-1 text-xs text-red-600 hover:bg-red-500/20 dark:text-red-400"
                    disabled={c._count.pregacoes > 0}
                    title={
                      c._count.pregacoes > 0
                        ? "Tem pregações vinculadas — não pode excluir"
                        : "Excluir"
                    }
                  >
                    Excluir
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </ModuloShell>
  );
}
