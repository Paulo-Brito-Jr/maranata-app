import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { EmptyState } from "@/components/empty-state";
import { Field, Input, Textarea, Button, Select } from "@/components/ui/field";
import { getIgrejaContexto, filtroIgrejaWhere } from "@/lib/igreja-contexto";
import {
  criarEquipeAction,
  toggleEquipeAtivaAction,
  excluirEquipeAction,
} from "./actions";

export const metadata = { title: "Equipes ministeriais" };
export const dynamic = "force-dynamic";

export default async function EquipesPage() {
  const ctx = await getIgrejaContexto();
  const filtroIgreja = filtroIgrejaWhere(ctx);
  const equipeWhere = filtroIgreja.igrejaId
    ? { OR: [{ igrejaId: null }, { igrejaId: filtroIgreja.igrejaId }] }
    : {};

  const [equipes, igrejas] = await Promise.all([
    prisma.equipe.findMany({
      where: equipeWhere,
      include: {
        igreja: { select: { nome: true, apelido: true } },
        _count: { select: { membros: true } },
      },
      orderBy: [{ ativa: "desc" }, { igrejaId: "asc" }, { nome: "asc" }],
    }),
    prisma.igreja.findMany({
      where: { ativa: true, tipo: "CONGREGACAO" as const },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, apelido: true },
    }),
  ]);

  const ativas = equipes.filter((e) => e.ativa).length;
  const gerais = equipes.filter((e) => !e.igrejaId).length;

  return (
    <ModuloShell
      titulo="Equipes ministeriais"
      descricao="Louvor, Diaconia, Recepção, Intercessão, etc. Cada equipe pode ser local (uma unidade) ou geral (corporativa)."
      stats={[
        { label: "Total", valor: equipes.length },
        { label: "Ativas", valor: ativas },
        { label: "Gerais (sede)", valor: gerais, ref: `${equipes.length - gerais} locais` },
      ]}
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Nova equipe</h2>
        <form action={criarEquipeAction} className="grid gap-4 md:grid-cols-2">
          <Field label="Nome" required className="md:col-span-2">
            <Input name="nome" required placeholder="Ex.: Louvor, Diaconia, Recepção" />
          </Field>
          <Field label="Descrição" className="md:col-span-2">
            <Textarea name="descricao" rows={2} />
          </Field>
          <Field
            label="Escopo"
            className="md:col-span-2"
            hint="Geral = corporativa, atende todas as 14 unidades (ex: ministério de louvor central). Local = só naquela unidade (ex: diaconia da Tijuca)."
          >
            <Select name="igrejaId" defaultValue="GERAL">
              <option value="GERAL">🌐 Geral (corporativo)</option>
              {igrejas.map((ig) => (
                <option key={ig.id} value={ig.id}>
                  📍 Local — {ig.apelido ?? ig.nome}
                </option>
              ))}
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Button type="submit">Criar equipe</Button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Equipes cadastradas ({equipes.length})
        </h2>
        {equipes.length === 0 ? (
          <EmptyState
            titulo="Nenhuma equipe ainda"
            descricao="Cadastre a primeira equipe ministerial acima."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {equipes.map((e) => (
              <div
                key={e.id}
                className={`rounded-2xl border bg-card p-5 ${
                  e.ativa ? "border-border" : "border-border/40 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{e.nome}</h3>
                  <div className="flex gap-1">
                    {e.igreja ? (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300">
                        📍 {e.igreja.apelido ?? e.igreja.nome}
                      </span>
                    ) : (
                      <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-700 dark:text-blue-300">
                        🌐 Geral
                      </span>
                    )}
                    {!e.ativa && (
                      <span className="rounded-full bg-secondary/60 px-2 py-0.5 text-xs">
                        Inativa
                      </span>
                    )}
                  </div>
                </div>
                {e.descricao && (
                  <p className="mt-1 text-sm text-muted-foreground">{e.descricao}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {e._count.membros} membro(s)
                </p>
                <div className="mt-3 flex flex-wrap gap-1 text-xs">
                  <form action={toggleEquipeAtivaAction.bind(null, e.id, !e.ativa)}>
                    <button className="rounded-full bg-secondary/60 px-2 py-1 hover:bg-secondary">
                      {e.ativa ? "Desativar" : "Ativar"}
                    </button>
                  </form>
                  <form action={excluirEquipeAction.bind(null, e.id)}>
                    <button className="rounded-full bg-red-500/10 px-2 py-1 text-red-600 hover:bg-red-500/20 dark:text-red-400">
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
