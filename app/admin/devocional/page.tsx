import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { EmptyState } from "@/components/empty-state";
import { dataPtBR } from "@/lib/utils";

export const metadata = { title: "Devocional" };
export const dynamic = "force-dynamic";

export default async function AdminDevocional() {
  const [devs, total] = await Promise.all([
    prisma.devocional.findMany({
      orderBy: { data: "desc" },
      take: 30,
      include: { _count: { select: { reacoes: true } } },
    }),
    prisma.devocional.count(),
  ]);

  return (
    <ModuloShell
      titulo="Devocional"
      descricao="Publique uma reflexão diária + versículo. Aparece em /membro/devocional."
      stats={[
        { label: "Devocionais publicados", valor: total },
        { label: "Próximos 7 dias", valor: devs.filter((d) => d.data >= new Date()).length },
      ]}
      acoes={[{ href: "/admin/devocional/novo", label: "Novo devocional" }]}
    >
      {devs.length === 0 ? (
        <EmptyState
          titulo="Nenhum devocional ainda"
          descricao="Publique o primeiro pra começar a alimentar a comunidade."
          acao={{ href: "/admin/devocional/novo", label: "Novo devocional" }}
        />
      ) : (
        <div className="grid gap-3">
          {devs.map((d) => (
            <Link
              key={d.id}
              href={`/admin/devocional/${d.id}`}
              className="flex items-start justify-between rounded-2xl border border-border bg-card p-4 hover:border-primary/40"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {dataPtBR(d.data)}
                </p>
                <h3 className="mt-1 font-semibold">{d.titulo}</h3>
                <p className="mt-1 line-clamp-1 text-sm italic text-muted-foreground">
                  «{d.versiculoTexto}» — {d.versiculoRef}
                </p>
              </div>
              <div className="ml-4 text-right text-xs">
                <span className="rounded-full bg-secondary/60 px-2 py-0.5">
                  {d._count.reacoes} reações
                </span>
                {!d.publicado && (
                  <p className="mt-1 text-amber-300">rascunho</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </ModuloShell>
  );
}
