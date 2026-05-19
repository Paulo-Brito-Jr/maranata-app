import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dataPtBR } from "@/lib/utils";
import { ModuloShell } from "@/components/modulo-shell";
import {
  publicarTestemunhoAction,
  ocultarTestemunhoAction,
  toggleDestaqueAction,
  excluirTestemunhoAction,
} from "./actions";
import { LoteToolbar } from "./lote-toolbar";

export const metadata = { title: "Moderar testemunhos" };
export const dynamic = "force-dynamic";

type SearchParams = {
  aba?: "pendentes" | "publicados" | "destaque" | "legado";
};

// Testemunhos do InChurch: vieram só com título "Testemunho de <unidade>"
// e autor. Texto real nunca foi capturado. NÃO são moderáveis.
const LEGADO_PLACEHOLDER_PATTERN = "Testemunho de %";

export default async function AdminTestemunhos({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const aba = params.aba ?? "pendentes";

  let where: Prisma.TestemunhoWhereInput = {};

  if (aba === "legado") {
    where = { texto: { startsWith: "Testemunho de " } };
  } else {
    // Pra abas reais, EXCLUIR placeholders do legado
    const semPlaceholder = { NOT: { texto: { startsWith: "Testemunho de " } } };
    if (aba === "publicados") {
      where = { AND: [semPlaceholder, { publicado: true }] };
    } else if (aba === "destaque") {
      where = { AND: [semPlaceholder, { destaque: true }] };
    } else {
      where = { AND: [semPlaceholder, { publicado: false }] };
    }
  }

  const [
    lista,
    pendentesReais,
    publicados,
    destaques,
    legadoCount,
  ] = await Promise.all([
    prisma.testemunho.findMany({
      where,
      include: { membro: { select: { nome: true } } },
      orderBy: [{ destaque: "desc" }, { criadoEm: "desc" }],
      take: 100,
    }),
    prisma.testemunho.count({
      where: {
        publicado: false,
        NOT: { texto: { startsWith: "Testemunho de " } },
      },
    }),
    prisma.testemunho.count({
      where: {
        publicado: true,
        NOT: { texto: { startsWith: "Testemunho de " } },
      },
    }),
    prisma.testemunho.count({
      where: {
        destaque: true,
        NOT: { texto: { startsWith: "Testemunho de " } },
      },
    }),
    prisma.testemunho.count({
      where: { texto: { startsWith: "Testemunho de " } },
    }),
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
        {
          label: "Pendentes (reais)",
          valor: pendentesReais,
          ref: "Aguardam moderação",
        },
        { label: "Publicados", valor: publicados },
        { label: "Destaques", valor: destaques },
        {
          label: "Hist. legado",
          valor: legadoCount,
          ref: "InChurch sem texto real",
        },
      ]}
    >
      <div className="mb-4 inline-flex rounded-full border border-border bg-card p-1 text-xs">
        {(["pendentes", "publicados", "destaque", "legado"] as const).map(
          (opcao) => (
            <a
              key={opcao}
              href={`/admin/testemunhos?aba=${opcao}`}
              className={`rounded-full px-3 py-1.5 capitalize transition ${
                aba === opcao
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opcao === "legado" ? "Histórico legado" : opcao}
            </a>
          ),
        )}
      </div>

      {aba === "legado" && (
        <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <p className="font-medium text-amber-300">
            ⚠ Estes 654 registros vieram do InChurch sem texto real
          </p>
          <p className="mt-1 text-xs text-amber-200/70">
            O InChurch nunca capturou o conteúdo dos testemunhos — só nome do
            autor + unidade. São históricos de quem deu testemunho, mas não
            moderáveis. Não aparecem em /testemunhos. Pra evoluir: dar baixa em
            lote pra excluir todos.
          </p>
        </div>
      )}

      {lista.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
          {aba === "pendentes"
            ? "Sem testemunhos pendentes — tudo em dia!"
            : "Sem testemunhos nessa aba."}
        </div>
      ) : (
        <>
          <LoteToolbar ids={lista.map((t) => t.id)} aba={aba} />

          <div className="space-y-3">
            {lista.map((t) => (
              <article
                key={t.id}
                className={`flex gap-3 rounded-2xl border bg-card p-5 ${
                  t.destaque ? "border-brand-orange/40" : "border-border"
                }`}
                data-testemunho-id={t.id}
              >
                <input
                  type="checkbox"
                  name="testemunho-id"
                  value={t.id}
                  className="mt-1 size-4 shrink-0 cursor-pointer rounded border-input bg-background"
                  data-id={t.id}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {nomeDe(t)}
                    </span>
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

                  {aba !== "legado" && (
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
                        <form
                          action={ocultarTestemunhoAction.bind(null, t.id)}
                        >
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
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </ModuloShell>
  );
}
