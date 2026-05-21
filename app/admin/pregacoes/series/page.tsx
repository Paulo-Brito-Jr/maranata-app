import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { EmptyState } from "@/components/empty-state";
import { Field, Input, Textarea, Button, Select } from "@/components/ui/field";
import { getIgrejaContexto, filtroIgrejaWhere } from "@/lib/igreja-contexto";
import {
  criarSerieAction,
  excluirSerieAction,
} from "./actions";

export const metadata = { title: "Séries de pregação" };
export const dynamic = "force-dynamic";

export default async function SeriesPregacaoPage() {
  // Pastor geral LOUVOR vê séries de todas as unidades.
  const ctx = await getIgrejaContexto({ ministerioPagina: "LOUVOR" });
  const filtroIgreja = filtroIgrejaWhere(ctx);
  const serieWhere = filtroIgreja.igrejaId
    ? { OR: [{ igrejaId: null }, { igrejaId: filtroIgreja.igrejaId }] }
    : {};

  const [series, igrejas] = await Promise.all([
    prisma.seriePregacao.findMany({
      where: serieWhere,
      include: {
        igreja: { select: { nome: true, apelido: true } },
        _count: { select: { pregacoes: true } },
      },
      orderBy: [{ criadaEm: "desc" }],
    }),
    prisma.igreja.findMany({
      where: { ativa: true, tipo: "CONGREGACAO" as const },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, apelido: true },
    }),
  ]);

  return (
    <ModuloShell
      titulo="Séries de pregação"
      descricao="Agrupe pregações em séries (ex: 'Vida cristã', 'Cartas de Paulo'). Cada série pode ser global ou local."
      stats={[
        { label: "Total séries", valor: series.length },
        {
          label: "Pregações organizadas",
          valor: series.reduce((a, s) => a + s._count.pregacoes, 0),
        },
      ]}
      acoes={[{ href: "/admin/pregacoes", label: "← Pregações" }]}
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Nova série</h2>
        <form action={criarSerieAction} className="grid gap-4 md:grid-cols-2">
          <Field label="Título" required className="md:col-span-2">
            <Input name="titulo" required placeholder="Ex.: Cartas Paulinas" />
          </Field>
          <Field label="Descrição" className="md:col-span-2">
            <Textarea name="descricao" rows={2} />
          </Field>
          <Field label="Capa (URL)">
            <Input name="capaUrl" placeholder="https://..." />
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
            <Button type="submit">Criar série</Button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Séries cadastradas
        </h2>
        {series.length === 0 ? (
          <EmptyState
            titulo="Nenhuma série ainda"
            descricao="Cadastre uma série acima."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {series.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{s.titulo}</h3>
                  {s.igreja ? (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300">
                      📍 {s.igreja.apelido ?? s.igreja.nome}
                    </span>
                  ) : (
                    <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-700 dark:text-blue-300">
                      🌐 Geral
                    </span>
                  )}
                </div>
                {s.descricao && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {s.descricao}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {s._count.pregacoes} pregação(ões)
                </p>
                <form
                  action={excluirSerieAction.bind(null, s.id)}
                  className="mt-3"
                >
                  <button className="rounded-full bg-red-500/10 px-2 py-1 text-xs text-red-600 hover:bg-red-500/20 dark:text-red-400">
                    Excluir
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </ModuloShell>
  );
}
