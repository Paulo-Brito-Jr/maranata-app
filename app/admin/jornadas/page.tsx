import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { Field, Input, Textarea, Button, Select } from "@/components/ui/field";
import { getIgrejaContexto, filtroIgrejaWhere } from "@/lib/igreja-contexto";
import {
  criarTrilhaAction,
  toggleTrilhaAtivaAction,
  excluirTrilhaAction,
} from "./actions";

export const metadata = { title: "Jornadas" };
export const dynamic = "force-dynamic";

export default async function JornadasPage() {
  const ctx = await getIgrejaContexto();
  const filtroIgreja = filtroIgrejaWhere(ctx);
  // Trilhas gerais (igrejaId null) sempre aparecem; locais filtram.
  const trilhaWhere = filtroIgreja.igrejaId
    ? { OR: [{ igrejaId: null }, { igrejaId: filtroIgreja.igrejaId }] }
    : {};

  const [trilhas, totalPessoas, igrejas] = await Promise.all([
    prisma.trilha.findMany({
      where: trilhaWhere,
      include: {
        igreja: { select: { nome: true, apelido: true } },
        _count: { select: { pessoas: true, etapas: true } },
      },
      orderBy: [{ igrejaId: "asc" }, { ordem: "asc" }],
    }),
    prisma.pessoaJornada.count(),
    ctx.tipo === "todas" || ctx.tipo === "selecionada"
      ? prisma.igreja.findMany({
          where: { ativa: true },
          orderBy: [{ ehSede: "desc" }, { nome: "asc" }],
          select: { id: true, nome: true, apelido: true },
        })
      : Promise.resolve([]),
  ]);

  return (
    <ModuloShell
      titulo="Jornadas"
      descricao="Trilhas de discipulado com atribuição automática para novos convertidos."
      stats={[
        {
          label: "Trilhas",
          valor: trilhas.length,
          ref: "InChurch: 3 (2 vazias!)",
        },
        {
          label: "Pessoas em jornada",
          valor: totalPessoas,
          ref: "InChurch: 60",
        },
        {
          label: "Obrigatórias",
          valor: trilhas.filter((t) => t.obrigatoria).length,
        },
        {
          label: "Economia anual",
          valor: "R$ 1.318,80",
          ref: "vs InChurch Jornadas",
        },
      ]}
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Nova trilha</h2>
        <form action={criarTrilhaAction} className="space-y-4">
          <Field label="Título" required>
            <Input name="titulo" required placeholder="Boas-vindas" />
          </Field>
          <Field label="Descrição">
            <Textarea
              name="descricao"
              rows={2}
              placeholder="Trilha pra quem acabou de chegar..."
            />
          </Field>
          {igrejas.length > 0 && (
            <Field
              label="Escopo"
              hint="Geral = disponível pra todas as unidades. Local = só pra aquela unidade."
            >
              <Select name="igrejaId" defaultValue="GERAL">
                <option value="GERAL">🌐 Geral (todas as 15 unidades)</option>
                {igrejas.map((ig) => (
                  <option key={ig.id} value={ig.id}>
                    📍 Local — {ig.apelido ?? ig.nome}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="obrigatoria" /> Trilha obrigatória pra
            novos convertidos
          </label>
          <Button type="submit">Criar trilha</Button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Trilhas cadastradas
        </h2>
        {trilhas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma trilha ainda.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {trilhas.map((t) => (
              <div
                key={t.id}
                className={`rounded-2xl border bg-card p-5 ${
                  t.ativa ? "border-border" : "border-border/40 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{t.titulo}</h3>
                  <div className="flex gap-1">
                    {t.igreja ? (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300">
                        📍 {t.igreja.apelido ?? t.igreja.nome}
                      </span>
                    ) : (
                      <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-700 dark:text-blue-300">
                        🌐 Geral
                      </span>
                    )}
                    {t.obrigatoria && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                        Obrigatória
                      </span>
                    )}
                    {!t.ativa && (
                      <span className="rounded-full bg-secondary/60 px-2 py-0.5 text-xs">
                        Inativa
                      </span>
                    )}
                  </div>
                </div>
                {t.descricao && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t.descricao}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {t._count.etapas} etapas · {t._count.pessoas} pessoas
                </p>

                <div className="mt-3 flex flex-wrap gap-1 text-xs">
                  <form
                    action={toggleTrilhaAtivaAction.bind(null, t.id, !t.ativa)}
                  >
                    <button className="rounded-full bg-secondary/60 px-3 py-1 hover:bg-secondary">
                      {t.ativa ? "Desativar" : "Reativar"}
                    </button>
                  </form>
                  <form action={excluirTrilhaAction.bind(null, t.id)}>
                    <button className="rounded-full bg-destructive/15 px-3 py-1 text-destructive hover:bg-destructive/25">
                      Excluir
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </ModuloShell>
  );
}
