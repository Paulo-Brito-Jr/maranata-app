import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { EmptyState } from "@/components/empty-state";
import { Field, Input, Textarea, Button, Select } from "@/components/ui/field";
import { getIgrejaContexto, filtroIgrejaWhere } from "@/lib/igreja-contexto";
import {
  criarPlanoAction,
  togglePlanoPublicadoAction,
  excluirPlanoAction,
} from "./actions";

export const metadata = { title: "Planos de leitura" };
export const dynamic = "force-dynamic";

export default async function PlanosLeituraPage() {
  const ctx = await getIgrejaContexto();
  const filtroIgreja = filtroIgrejaWhere(ctx);
  const planoWhere = filtroIgreja.igrejaId
    ? { OR: [{ igrejaId: null }, { igrejaId: filtroIgreja.igrejaId }] }
    : {};

  const [planos, igrejas] = await Promise.all([
    prisma.planoLeitura.findMany({
      where: planoWhere,
      include: {
        igreja: { select: { nome: true, apelido: true } },
        _count: { select: { inscricoes: true } },
      },
      orderBy: [{ publicado: "desc" }, { criadoEm: "desc" }],
    }),
    prisma.igreja.findMany({
      where: { ativa: true, ehSede: false },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, apelido: true },
    }),
  ]);

  return (
    <ModuloShell
      titulo="Planos de leitura"
      descricao="Roteiros diários de leitura bíblica. Membros se inscrevem e acompanham progresso."
      stats={[
        { label: "Total planos", valor: planos.length },
        { label: "Publicados", valor: planos.filter((p) => p.publicado).length },
        {
          label: "Total inscritos",
          valor: planos.reduce((a, p) => a + p._count.inscricoes, 0),
        },
      ]}
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Novo plano</h2>
        <form action={criarPlanoAction} className="grid gap-4 md:grid-cols-2">
          <Field label="Título" required className="md:col-span-2">
            <Input name="titulo" required placeholder="Ex.: Bíblia em 1 ano" />
          </Field>
          <Field label="Descrição" className="md:col-span-2">
            <Textarea name="descricao" rows={3} placeholder="Sobre o plano…" />
          </Field>
          <Field label="Capa (URL)">
            <Input name="capaUrl" placeholder="https://..." />
          </Field>
          <Field
            label="Escopo"
            hint="Geral aparece pra todos. Local só pra membros daquela unidade."
          >
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
            <Button type="submit">Criar plano</Button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Planos cadastrados ({planos.length})
        </h2>
        {planos.length === 0 ? (
          <EmptyState
            titulo="Nenhum plano ainda"
            descricao="Crie o primeiro plano de leitura acima."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {planos.map((p) => (
              <div
                key={p.id}
                className={`rounded-2xl border bg-card p-5 ${
                  p.publicado ? "border-border" : "border-border/40 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{p.titulo}</h3>
                  {p.igreja ? (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300">
                      📍 {p.igreja.apelido ?? p.igreja.nome}
                    </span>
                  ) : (
                    <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-700 dark:text-blue-300">
                      🌐 Geral
                    </span>
                  )}
                </div>
                {p.descricao && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {p.descricao}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {p._count.inscricoes} inscrito(s)
                </p>
                <div className="mt-3 flex flex-wrap gap-1 text-xs">
                  <form
                    action={togglePlanoPublicadoAction.bind(null, p.id, !p.publicado)}
                  >
                    <button className="rounded-full bg-secondary/60 px-2 py-1 hover:bg-secondary">
                      {p.publicado ? "Despublicar" : "Publicar"}
                    </button>
                  </form>
                  <form action={excluirPlanoAction.bind(null, p.id)}>
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
