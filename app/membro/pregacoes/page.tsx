import { prisma } from "@/lib/prisma";

export const metadata = { title: "Pregações" };
export const dynamic = "force-dynamic";

function dataCurta(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function youtubeThumb(id: string | null | undefined): string | null {
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}

export default async function MembroPregacoes() {
  const [pregacoes, total] = await Promise.all([
    prisma.pregacao.findMany({
      where: { publicada: true },
      include: { categoria: { select: { nome: true } } },
      orderBy: [{ data: "desc" }, { criadaEm: "desc" }],
      take: 30,
    }),
    prisma.pregacao.count({ where: { publicada: true } }),
  ]);

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-medium uppercase tracking-widest text-brand-orange">
          Pregações
        </p>
        <h1 className="mt-1 text-2xl font-bold">A Palavra na Maranata</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total > 0
            ? `${total} pregações no acervo.`
            : "Em breve mais conteúdo."}
        </p>
      </header>

      {pregacoes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Sem pregações publicadas ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {pregacoes.map((p) => {
            const thumb = youtubeThumb(p.youtubeId);
            const href = p.youtubeId
              ? `https://youtu.be/${p.youtubeId}`
              : undefined;
            const inner = (
              <>
                {thumb && (
                  <div
                    className="h-32 w-full rounded-t-2xl bg-cover bg-center"
                    style={{ backgroundImage: `url(${thumb})` }}
                  />
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{dataCurta(p.data)}</span>
                    {p.categoria && (
                      <span className="rounded-full bg-secondary/60 px-2 py-0.5">
                        {p.categoria.nome}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-1 text-base font-semibold leading-tight">
                    {p.titulo}
                  </h2>
                  {p.pregador && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {p.pregador}
                    </p>
                  )}
                </div>
              </>
            );
            return href ? (
              <a
                key={p.id}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40"
              >
                {inner}
              </a>
            ) : (
              <article
                key={p.id}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                {inner}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
