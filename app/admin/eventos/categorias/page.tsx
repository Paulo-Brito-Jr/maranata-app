import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { EmptyState } from "@/components/empty-state";
import { Field, Input, Button, Select } from "@/components/ui/field";
import { getIgrejaContexto, filtroIgrejaWhere } from "@/lib/igreja-contexto";
import {
  criarCategoriaEventoAction,
  excluirCategoriaEventoAction,
} from "./actions";

export const metadata = { title: "Categorias de evento" };
export const dynamic = "force-dynamic";

export default async function CategoriasEventoPage() {
  const ctx = await getIgrejaContexto();
  const filtroIgreja = filtroIgrejaWhere(ctx);
  const catWhere = filtroIgreja.igrejaId
    ? { OR: [{ igrejaId: null }, { igrejaId: filtroIgreja.igrejaId }] }
    : {};

  const [categorias, igrejas] = await Promise.all([
    prisma.categoriaEvento.findMany({
      where: catWhere,
      include: {
        igreja: { select: { nome: true, apelido: true } },
        _count: { select: { eventos: true } },
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
      titulo="Categorias de evento"
      descricao="Tags coloridas pra organizar tipos de evento (Celebrações, Acampamento, Casais, etc.)."
      stats={[
        { label: "Total", valor: categorias.length },
        { label: "Gerais", valor: categorias.filter((c) => !c.igrejaId).length },
        { label: "Locais", valor: categorias.filter((c) => c.igrejaId).length },
      ]}
      acoes={[{ href: "/admin/eventos", label: "← Eventos" }]}
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Nova categoria</h2>
        <form
          action={criarCategoriaEventoAction}
          className="grid gap-4 md:grid-cols-3"
        >
          <Field label="Nome" required>
            <Input name="nome" required placeholder="Celebrações" />
          </Field>
          <Field label="Cor (hex)" hint="ex: #F0641E">
            <Input name="cor" placeholder="#F0641E" />
          </Field>
          <Field label="Ícone" hint="lucide name (opcional)">
            <Input name="icone" placeholder="calendar" />
          </Field>
          <Field label="Escopo" className="md:col-span-3">
            <Select name="igrejaId" defaultValue="GERAL">
              <option value="GERAL">🌐 Geral (todas as 14 unidades)</option>
              {igrejas.map((ig) => (
                <option key={ig.id} value={ig.id}>
                  📍 Local — {ig.apelido ?? ig.nome}
                </option>
              ))}
            </Select>
          </Field>
          <div className="md:col-span-3">
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
                <div className="flex items-center gap-2">
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: c.cor ?? "#888" }}
                  />
                  <div>
                    <p className="text-sm font-medium">{c.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {c._count.eventos} evento(s)
                      {c.igreja
                        ? ` · 📍 ${c.igreja.apelido ?? c.igreja.nome}`
                        : " · 🌐 Geral"}
                    </p>
                  </div>
                </div>
                <form action={excluirCategoriaEventoAction.bind(null, c.id)}>
                  <button
                    className="rounded-full bg-red-500/10 px-2 py-1 text-xs text-red-600 hover:bg-red-500/20 dark:text-red-400"
                    disabled={c._count.eventos > 0}
                    title={
                      c._count.eventos > 0
                        ? "Tem eventos vinculados — não pode excluir"
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
