import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { dataPtBR } from "@/lib/utils";
import { aprovarComentario, removerComentario } from "./actions";

export const metadata = { title: "Moderar comentários" };
export const dynamic = "force-dynamic";

export default async function ModerarComentarios() {
  const [pendentes, recentes] = await Promise.all([
    prisma.pregacaoComentario.findMany({
      where: { aprovado: false },
      orderBy: { criadoEm: "desc" },
      include: {
        pregacao: { select: { titulo: true, id: true } },
        membro: { select: { nome: true } },
      },
      take: 50,
    }),
    prisma.pregacaoComentario.findMany({
      where: { aprovado: true },
      orderBy: { criadoEm: "desc" },
      include: {
        pregacao: { select: { titulo: true, id: true } },
        membro: { select: { nome: true } },
      },
      take: 20,
    }),
  ]);

  return (
    <ModuloShell
      titulo="Moderar comentários"
      descricao="Aprove ou remova comentários em pregações."
      stats={[
        { label: "Pendentes", valor: pendentes.length },
        { label: "Aprovados recentes", valor: recentes.length },
      ]}
    >
      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Pendentes de aprovação
        </h2>
        {pendentes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
            Nada pra moderar agora. ✨
          </p>
        ) : (
          <ul className="space-y-2">
            {pendentes.map((c) => (
              <li key={c.id} className="rounded-2xl border border-border bg-card p-4">
                <p className="text-sm">{c.texto}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {c.membro?.nome ?? c.nomeAvulso ?? "Anônimo"} · {dataPtBR(c.criadoEm)} ·{" "}
                    <a href={`/membro/pregacoes/${c.pregacao.id}`} className="text-primary underline">
                      {c.pregacao.titulo}
                    </a>
                  </span>
                  <div className="flex gap-2">
                    <form action={aprovarComentario.bind(null, c.id)}>
                      <button className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-300 hover:bg-emerald-500/25">
                        Aprovar
                      </button>
                    </form>
                    <form action={removerComentario.bind(null, c.id)}>
                      <button className="rounded-full bg-red-500/15 px-3 py-1 text-red-300 hover:bg-red-500/25">
                        Remover
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {recentes.length > 0 && (
        <section className="mt-8 space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Aprovados recentes
          </h2>
          <ul className="space-y-2">
            {recentes.map((c) => (
              <li
                key={c.id}
                className="rounded-2xl border border-border bg-card/50 p-3 text-sm text-muted-foreground"
              >
                <p className="line-clamp-2">{c.texto}</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest">
                  {c.membro?.nome ?? c.nomeAvulso ?? "Anônimo"} · {dataPtBR(c.criadoEm)} ·{" "}
                  <span>{c.pregacao.titulo}</span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </ModuloShell>
  );
}
