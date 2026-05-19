import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { Field, Input, Textarea, Button } from "@/components/ui/field";
import { dataPtBR } from "@/lib/utils";
import { adicionarEtapaAction } from "../actions";
import { removerEtapaAction } from "./actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await prisma.trilha.findUnique({ where: { id }, select: { titulo: true } });
  return { title: t?.titulo ?? "Trilha" };
}

export default async function TrilhaDetalhe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trilha = await prisma.trilha.findUnique({
    where: { id },
    include: {
      etapas: { orderBy: { ordem: "asc" }, include: { _count: { select: { progressos: true } } } },
      pessoas: {
        orderBy: { iniciadaEm: "desc" },
        include: {
          membro: { select: { nome: true } },
          _count: { select: { progressos: true } },
        },
      },
    },
  });
  if (!trilha) notFound();

  const concluidos = trilha.pessoas.filter((p) => p.status === "CONCLUIDA").length;
  const emAndamento = trilha.pessoas.filter((p) => p.status === "EM_ANDAMENTO").length;

  return (
    <ModuloShell
      titulo={trilha.titulo}
      descricao={trilha.descricao ?? "—"}
      stats={[
        { label: "Etapas", valor: trilha.etapas.length },
        { label: "Em andamento", valor: emAndamento },
        { label: "Concluído", valor: concluidos },
        { label: "Total inscritos", valor: trilha.pessoas.length },
      ]}
      acoes={[{ href: "/admin/jornadas", label: "← Voltar" }]}
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Adicionar etapa</h2>
        <form action={adicionarEtapaAction} className="space-y-3">
          <input type="hidden" name="trilhaId" value={id} />
          <Field label="Título da etapa" required>
            <Input name="titulo" required />
          </Field>
          <Field label="Descrição">
            <Textarea name="descricao" rows={2} />
          </Field>
          <Button type="submit">Adicionar</Button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Etapas ({trilha.etapas.length})
        </h2>
        {trilha.etapas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma etapa ainda. Adicione acima — alunos só conseguem se inscrever quando há ao
            menos 1 etapa.
          </p>
        ) : (
          <ol className="space-y-2">
            {trilha.etapas.map((e, i) => (
              <li
                key={e.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium">{e.titulo}</p>
                    {e.descricao && (
                      <p className="text-xs text-muted-foreground">{e.descricao}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">{e._count.progressos} ✓</span>
                  <form action={removerEtapaAction.bind(null, e.id, id)}>
                    <button className="rounded-full bg-destructive/15 px-2 py-1 text-destructive hover:bg-destructive/25">
                      remover
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Alunos ({trilha.pessoas.length})
        </h2>
        {trilha.pessoas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ninguém inscrito ainda.{" "}
            <Link
              href={`/membro/jornadas/${id}`}
              className="text-primary underline"
            >
              ver como membro
            </Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {trilha.pessoas.map((p) => {
              const pct =
                trilha.etapas.length > 0
                  ? Math.round((p._count.progressos / trilha.etapas.length) * 100)
                  : 0;
              return (
                <li
                  key={p.id}
                  className="rounded-2xl border border-border bg-card p-4 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{p.membro.nome}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        p.status === "CONCLUIDA"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : p.status === "ABANDONADA"
                            ? "bg-red-500/15 text-red-300"
                            : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Iniciada em {dataPtBR(p.iniciadaEm)} ·{" "}
                    {p._count.progressos}/{trilha.etapas.length} etapas ({pct}%)
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </ModuloShell>
  );
}
