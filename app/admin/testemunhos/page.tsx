import { prisma } from "@/lib/prisma";
import { dataPtBR } from "@/lib/utils";
import { ModuloShell } from "@/components/modulo-shell";
import {
  publicarTestemunhoAction,
  ocultarTestemunhoAction,
  toggleDestaqueAction,
  excluirTestemunhoAction,
} from "./actions";

export const metadata = { title: "Moderar testemunhos" };
export const dynamic = "force-dynamic";

type SearchParams = { aba?: "pendentes" | "publicados" | "destaque" };

export default async function AdminTestemunhos({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const aba = params.aba ?? "pendentes";

  const where =
    aba === "publicados"
      ? { publicado: true }
      : aba === "destaque"
        ? { destaque: true }
        : { publicado: false };

  const [lista, pendentes, publicados, destaques, total] = await Promise.all([
    prisma.testemunho.findMany({
      where,
      include: { membro: { select: { nome: true } } },
      orderBy: [{ destaque: "desc" }, { criadoEm: "desc" }],
      take: 100,
    }),
    prisma.testemunho.count({ where: { publicado: false } }),
    prisma.testemunho.count({ where: { publicado: true } }),
    prisma.testemunho.count({ where: { destaque: true } }),
    prisma.testemunho.count(),
  ]);

  const nomeDe = (t: {
    nomeAvulso: string | null;
    membro: { nome: string } | null;
  }) => t.membro?.nome ?? t.nomeAvulso ?? "(anônimo)";

  return (
    <ModuloShell
      titulo="Testemunhos"
      descricao="Modere o que aparece em /testemunhos e /membro/testemunhos."
      stats={[
        { label: "Pendentes", valor: pendentes, ref: "Aguardam moderação" },
        { label: "Publicados", valor: publicados },
        { label: "Destaques", valor: destaques },
        { label: "Total", valor: total },
      ]}
    >
      <div className="mb-4 inline-flex rounded-full border border-border bg-card p-1 text-xs">
        {(["pendentes", "publicados", "destaque"] as const).map((opcao) => (
          <a
            key={opcao}
            href={`/admin/testemunhos?aba=${opcao}`}
            className={`rounded-full px-3 py-1.5 capitalize transition ${
              aba === opcao
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opcao}
          </a>
        ))}
      </div>

      {lista.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
          Sem testemunhos {aba === "pendentes" ? "pendentes — tudo em dia!" : "nessa aba."}
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map((t) => (
            <article
              key={t.id}
              className={`rounded-2xl border bg-card p-5 ${
                t.destaque ? "border-brand-orange/40" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{nomeDe(t)}</span>
                    <span>·</span>
                    <span>{dataPtBR(t.criadoEm)}</span>
                    {t.destaque && (
                      <span className="rounded-full bg-brand-orange/20 px-2 py-0.5 text-xs uppercase tracking-widest text-brand-orange">
                        Destaque
                      </span>
                    )}
                    {t.publicado && !t.destaque && (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                        Publicado
                      </span>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                    {t.texto}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {!t.publicado && (
                  <form action={publicarTestemunhoAction.bind(null, t.id)}>
                    <button className="rounded-full bg-emerald-500/20 px-3 py-1 font-medium text-emerald-300 hover:bg-emerald-500/30">
                      ✓ Publicar
                    </button>
                  </form>
                )}
                {t.publicado && !t.destaque && (
                  <form
                    action={toggleDestaqueAction.bind(null, t.id, true)}
                  >
                    <button className="rounded-full bg-brand-orange/20 px-3 py-1 font-medium text-brand-orange hover:bg-brand-orange/30">
                      ★ Destacar
                    </button>
                  </form>
                )}
                {t.destaque && (
                  <form
                    action={toggleDestaqueAction.bind(null, t.id, false)}
                  >
                    <button className="rounded-full bg-secondary/60 px-3 py-1 hover:bg-secondary">
                      Tirar destaque
                    </button>
                  </form>
                )}
                {t.publicado && (
                  <form action={ocultarTestemunhoAction.bind(null, t.id)}>
                    <button className="rounded-full bg-secondary/60 px-3 py-1 hover:bg-secondary">
                      Ocultar
                    </button>
                  </form>
                )}
                <form action={excluirTestemunhoAction.bind(null, t.id)}>
                  <button className="rounded-full bg-destructive/15 px-3 py-1 text-destructive hover:bg-destructive/25">
                    Excluir
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </ModuloShell>
  );
}
