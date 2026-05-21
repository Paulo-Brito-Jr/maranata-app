import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { dataPtBR } from "@/lib/utils";
import { Share2, ArrowLeft } from "lucide-react";
import { FavoritarBotao } from "./favoritar-botao";
import { ProgressoTracker } from "./progresso-tracker";
import { ComentarioForm } from "./comentario-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.pregacao.findUnique({ where: { id }, select: { titulo: true } });
  return { title: p?.titulo ?? "Pregação" };
}

export default async function PregacaoDetalhe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redir=/membro/pregacoes/${id}`);

  const pregacao = await prisma.pregacao.findUnique({
    where: { id },
    include: {
      categoria: { select: { nome: true } },
      serie: { select: { titulo: true, id: true } },
      _count: { select: { favoritos: true, comentarios: { where: { aprovado: true } } } },
    },
  });
  if (!pregacao || !pregacao.publicada) notFound();

  const membro = await prisma.membro.findFirst({
    where: { email: { equals: user.email, mode: "insensitive" } },
    select: { id: true },
  });

  const [favorito, progresso, comentarios, relacionadas] = await Promise.all([
    membro
      ? prisma.pregacaoFavorita.findUnique({
          where: { pregacaoId_membroId: { pregacaoId: id, membroId: membro.id } },
        })
      : Promise.resolve(null),
    membro
      ? prisma.pregacaoProgresso.findUnique({
          where: { pregacaoId_membroId: { pregacaoId: id, membroId: membro.id } },
        })
      : Promise.resolve(null),
    prisma.pregacaoComentario.findMany({
      where: { pregacaoId: id, aprovado: true },
      orderBy: { criadoEm: "desc" },
      take: 20,
      include: { membro: { select: { nome: true } } },
    }),
    prisma.pregacao.findMany({
      where: {
        publicada: true,
        id: { not: id },
        OR: [
          pregacao.serieId ? { serieId: pregacao.serieId } : { id: "__none__" },
          pregacao.categoriaId ? { categoriaId: pregacao.categoriaId } : { id: "__none__" },
        ],
      },
      orderBy: { data: "desc" },
      take: 5,
      select: { id: true, titulo: true, data: true, youtubeId: true, capaUrl: true },
    }),
  ]);

  // Incrementa execução (fire & forget) — pode ser otimizado pra deduplicar por sessão
  void prisma.pregacao.update({ where: { id }, data: { execucoes: { increment: 1 } } });

  const compartilharUrl = `https://maranata.app/membro/pregacoes/${id}`;
  const compartilharTexto = `Vê essa pregação: ${pregacao.titulo}${pregacao.pregador ? ` — ${pregacao.pregador}` : ""}`;

  return (
    <div className="space-y-5">
      <Link
        href="/membro/pregacoes"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3" /> todas as pregações
      </Link>

      {pregacao.youtubeId && (
        <div className="relative -mx-5 aspect-video overflow-hidden bg-black">
          <iframe
            id={`yt-player-${id}`}
            src={`https://www.youtube.com/embed/${pregacao.youtubeId}?rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent("https://maranata.app")}`}
            title={pregacao.titulo}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      )}

      {pregacao.soundcloudId && !pregacao.youtubeId && (
        <iframe
          width="100%"
          height="166"
          scrolling="no"
          frameBorder="no"
          src={`https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${pregacao.soundcloudId}&color=%23ff5500`}
          className="rounded-xl"
        />
      )}


      <header>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {pregacao.data && <span>{dataPtBR(pregacao.data)}</span>}
          {pregacao.serie && (
            <Link
              href={`/membro/pregacoes?serie=${pregacao.serie.id}`}
              className="rounded-full bg-secondary/60 px-2 py-0.5 hover:bg-secondary"
            >
              🎬 {pregacao.serie.titulo}
            </Link>
          )}
          {pregacao.categoria && (
            <span className="rounded-full bg-secondary/60 px-2 py-0.5">
              {pregacao.categoria.nome}
            </span>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-bold leading-tight">{pregacao.titulo}</h1>
        {pregacao.pregador && (
          <p className="mt-1 text-sm text-muted-foreground">{pregacao.pregador}</p>
        )}
      </header>

      <div className="flex items-center gap-3 border-y border-border py-3">
        <FavoritarBotao
          pregacaoId={id}
          favoritoInicial={!!favorito}
          contagem={pregacao._count.favoritos}
        />
        <CompartilharBotao url={compartilharUrl} texto={compartilharTexto} />
        <Link
          href={`/api/pregacoes/${id}/card.png`}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:bg-secondary"
        >
          <Share2 className="size-3.5" /> Card pro story
        </Link>
      </div>

      {pregacao.descricao && (
        <section className="rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
          {pregacao.descricao}
        </section>
      )}

      {membro && (pregacao.duracaoSeg || pregacao.youtubeId) && (
        <ProgressoTracker
          pregacaoId={id}
          posicaoInicial={progresso?.posicaoSeg ?? 0}
          duracaoSeg={pregacao.duracaoSeg ?? 0}
          concluido={progresso?.concluido ?? false}
          youtubeId={pregacao.youtubeId}
        />
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Comentários ({pregacao._count.comentarios})
          </h2>
        </div>
        {membro ? (
          <ComentarioForm pregacaoId={id} />
        ) : (
          <p className="text-xs text-muted-foreground">
            Faça login pra comentar.
          </p>
        )}
        {comentarios.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Seja o primeiro a comentar sobre esta pregação.
          </p>
        ) : (
          <ul className="space-y-3">
            {comentarios.map((c) => (
              <li key={c.id} className="rounded-2xl border border-border bg-card p-4">
                <p className="text-sm">{c.texto}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {c.membro?.nome ?? c.nomeAvulso ?? "Anônimo"} ·{" "}
                  {dataPtBR(c.criadoEm)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {relacionadas.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Relacionadas
          </h2>
          <ul className="space-y-2">
            {relacionadas.map((r) => {
              const t = r.capaUrl ?? (r.youtubeId ? `https://img.youtube.com/vi/${r.youtubeId}/mqdefault.jpg` : null);
              return (
                <li key={r.id}>
                  <Link
                    href={`/membro/pregacoes/${r.id}`}
                    className="flex gap-3 rounded-xl border border-border bg-card p-2 hover:border-primary/40"
                  >
                    {t && (
                      <div
                        className="size-16 shrink-0 rounded-lg bg-cover bg-center"
                        style={{ backgroundImage: `url(${t})` }}
                      />
                    )}
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-medium">{r.titulo}</p>
                      {r.data && (
                        <p className="text-xs text-muted-foreground">{dataPtBR(r.data)}</p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function CompartilharBotao({ url, texto }: { url: string; texto: string }) {
  const wa = `https://wa.me/?text=${encodeURIComponent(`${texto}\n${url}`)}`;
  return (
    <a
      href={wa}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:bg-secondary"
    >
      <Share2 className="size-3.5" /> WhatsApp
    </a>
  );
}
