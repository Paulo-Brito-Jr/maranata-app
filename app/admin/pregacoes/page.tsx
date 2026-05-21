import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { EmptyState } from "@/components/empty-state";
import { dataPtBR } from "@/lib/utils";
import { Heart, MessageCircle, PlayCircle } from "lucide-react";
import { getIgrejaContexto, filtroIgrejaWhere } from "@/lib/igreja-contexto";

export const metadata = { title: "Pregações" };
export const dynamic = "force-dynamic";

export default async function PregacoesPage() {
  // Pastor geral de LOUVOR também pode ver pregações de todas as unidades.
  const ctx = await getIgrejaContexto({ ministerioPagina: "LOUVOR" });
  const filtroIgreja = filtroIgrejaWhere(ctx);
  // Pregação pode ter igrejaId null (pregação geral) — quando filtra, OR null
  const pregacaoIgreja = filtroIgreja.igrejaId
    ? { OR: [{ igrejaId: null }, { igrejaId: filtroIgreja.igrejaId }] }
    : {};

  const [pregacoes, totalSeries, , totalBanners, agg, top10] = await Promise.all([
    prisma.pregacao.findMany({
      where: pregacaoIgreja,
      include: {
        categoria: { select: { nome: true } },
        serie: { select: { titulo: true } },
        _count: { select: { favoritos: true, comentarios: true } },
      },
      orderBy: [{ data: "desc" }, { criadaEm: "desc" }],
      take: 50,
    }),
    prisma.seriePregacao.count({ where: pregacaoIgreja }),
    prisma.transmissao.count(),
    prisma.banner.count({ where: { ativo: true } }),
    prisma.pregacao.aggregate({
      where: pregacaoIgreja,
      _sum: { execucoes: true },
      _count: { id: true },
    }),
    prisma.pregacao.findMany({
      where: { execucoes: { gt: 0 }, ...pregacaoIgreja },
      orderBy: { execucoes: "desc" },
      take: 10,
      select: {
        id: true,
        titulo: true,
        pregador: true,
        execucoes: true,
        _count: { select: { favoritos: true } },
      },
    }),
  ]);

  const totalExec = agg._sum.execucoes ?? 0;
  const totalPregacoes = agg._count.id;

  return (
    <ModuloShell
      titulo="Pregações"
      descricao="YouTube/SoundCloud, séries, categorias, analytics, comentários e banners."
      stats={[
        { label: "Pregações", valor: totalPregacoes, ref: "InChurch: 587" },
        { label: "Execuções", valor: totalExec.toLocaleString("pt-BR"), ref: "soma de plays" },
        { label: "Séries", valor: totalSeries, ref: "InChurch: 9" },
        { label: "Banners ativos", valor: totalBanners, ref: "InChurch: 40" },
      ]}
      acoes={[
        { href: "/admin/pregacoes/nova", label: "Nova pregação" },
        { href: "/admin/pregacoes/comentarios", label: "Moderar comentários" },
      ]}
    >
      {top10.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Top 10 mais assistidas
          </h2>
          <ol className="mt-3 space-y-2">
            {top10.map((p, i) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl px-2 py-1.5 text-sm hover:bg-secondary/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-6 text-right text-xs font-bold text-muted-foreground">
                    {i + 1}.
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.titulo}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.pregador ?? "—"}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <PlayCircle className="size-3" />
                    {p.execucoes}
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <Heart className="size-3 fill-current" />
                    {p._count.favoritos}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {pregacoes.length === 0 ? (
        <EmptyState
          titulo="Nenhuma pregação"
          descricao="Cadastre a primeira pregação."
          acao={{ href: "/admin/pregacoes/nova", label: "Nova pregação" }}
        />
      ) : (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Acervo recente
          </h2>
          <div className="grid gap-3">
            {pregacoes.map((p) => (
              <Link
                key={p.id}
                href={`/admin/pregacoes/${p.id}/editar`}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40"
              >
                {p.youtubeId ? (
                  <Image
                    src={`https://img.youtube.com/vi/${p.youtubeId}/mqdefault.jpg`}
                    alt=""
                    width={80}
                    height={80}
                    className="size-20 rounded-xl object-cover"
                  />
                ) : (
                  <div className="size-20 rounded-xl bg-secondary" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">{p.titulo}</h3>
                  <p className="text-sm text-muted-foreground">
                    {p.pregador ?? "—"}
                    {p.data && ` · ${dataPtBR(p.data)}`}
                    {p.categoria && ` · ${p.categoria.nome}`}
                  </p>
                  {p.serie && <p className="text-xs text-primary">{p.serie.titulo}</p>}
                </div>
                <div className="flex flex-col items-end gap-1 text-xs">
                  <span className="flex items-center gap-1">
                    <PlayCircle className="size-3" /> {p.execucoes}
                  </span>
                  {p._count.favoritos > 0 && (
                    <span className="flex items-center gap-1 text-rose-400">
                      <Heart className="size-3 fill-current" /> {p._count.favoritos}
                    </span>
                  )}
                  {p._count.comentarios > 0 && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MessageCircle className="size-3" /> {p._count.comentarios}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </ModuloShell>
  );
}
