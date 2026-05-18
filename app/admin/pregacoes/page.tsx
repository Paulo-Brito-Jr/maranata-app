import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { EmptyState } from "@/components/empty-state";
import { dataPtBR } from "@/lib/utils";

export const metadata = { title: "Pregações" };
export const dynamic = "force-dynamic";

export default async function PregacoesPage() {
  const [pregacoes, totalSeries, totalTransmissoes, totalBanners] = await Promise.all([
    prisma.pregacao.findMany({
      include: {
        categoria: { select: { nome: true } },
        serie: { select: { titulo: true } },
      },
      orderBy: { data: "desc" },
      take: 50,
    }),
    prisma.seriePregacao.count(),
    prisma.transmissao.count(),
    prisma.banner.count({ where: { ativo: true } }),
  ]);

  return (
    <ModuloShell
      titulo="Pregações"
      descricao="YouTube/SoundCloud, séries, categorias, transmissões ao vivo, banners e planos de leitura."
      stats={[
        { label: "Pregações", valor: pregacoes.length, ref: "InChurch: 587" },
        { label: "Séries", valor: totalSeries, ref: "InChurch: 9" },
        { label: "Transmissões", valor: totalTransmissoes, ref: "InChurch: 85" },
        { label: "Banners ativos", valor: totalBanners, ref: "InChurch: 40" },
      ]}
      acoes={[{ href: "/admin/pregacoes/nova", label: "Nova pregação" }]}
    >
      {pregacoes.length === 0 ? (
        <EmptyState
          titulo="Nenhuma pregação"
          descricao="Cadastre a primeira pregação."
          acao={{ href: "/admin/pregacoes/nova", label: "Nova pregação" }}
        />
      ) : (
        <div className="grid gap-3">
          {pregacoes.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
            >
              {p.youtubeId ? (
                <img
                  src={`https://img.youtube.com/vi/${p.youtubeId}/mqdefault.jpg`}
                  alt=""
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
                {p.serie && (
                  <p className="text-xs text-primary">{p.serie.titulo}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </ModuloShell>
  );
}
