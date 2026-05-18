import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { EmptyState } from "@/components/empty-state";
import { dataPtBR } from "@/lib/utils";

export const metadata = { title: "Eventos" };
export const dynamic = "force-dynamic";

export default async function EventosPage() {
  const agora = new Date();

  const [proximos, passados, totalCategorias, totalInscricoes] = await Promise.all([
    prisma.evento.findMany({
      where: { inicio: { gte: agora } },
      include: {
        igreja: { select: { nome: true } },
        categoria: { select: { nome: true, cor: true } },
        _count: { select: { inscricoes: true } },
      },
      orderBy: { inicio: "asc" },
      take: 50,
    }),
    prisma.evento.count({ where: { inicio: { lt: agora } } }),
    prisma.categoriaEvento.count(),
    prisma.inscricaoEvento.count(),
  ]);

  return (
    <ModuloShell
      titulo="Eventos"
      descricao="Calendário, inscrições, ingressos, check-in via QR."
      stats={[
        { label: "Próximos eventos", valor: proximos.length, ref: "InChurch tinha 315 únicos" },
        { label: "Categorias", valor: totalCategorias },
        { label: "Inscrições", valor: totalInscricoes },
        { label: "Realizados", valor: passados },
      ]}
      acoes={[{ href: "/admin/eventos/novo", label: "Novo evento" }]}
    >
      {proximos.length === 0 ? (
        <EmptyState
          titulo="Nenhum evento próximo"
          descricao="Crie o próximo evento da igreja."
          acao={{ href: "/admin/eventos/novo", label: "Novo evento" }}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {proximos.map((e) => (
            <Link
              key={e.id}
              href={`/admin/eventos/${e.id}`}
              className="rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{e.titulo}</h3>
                {e.categoria && (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={{ backgroundColor: (e.categoria.cor ?? "#888") + "33" }}
                  >
                    {e.categoria.nome}
                  </span>
                )}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {dataPtBR(e.inicio)} · {e.igreja.nome}
              </div>
              <div className="mt-2 text-xs">
                {e.publicado ? (
                  <span className="text-success">Publicado</span>
                ) : (
                  <span className="text-warning">Rascunho</span>
                )}
                {e.inscricoesAbertas && (
                  <span className="ml-2 text-primary">
                    · Inscrições abertas ({e._count.inscricoes})
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </ModuloShell>
  );
}
