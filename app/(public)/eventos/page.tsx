import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { dataPtBR } from "@/lib/utils";

export const metadata = { title: "Eventos" };
export const dynamic = "force-dynamic";

export default async function EventosPublicosPage() {
  const eventos = await prisma.evento.findMany({
    where: {
      publicado: true,
      inicio: { gte: new Date() },
    },
    include: {
      igreja: { select: { nome: true } },
      categoria: { select: { nome: true, cor: true } },
    },
    orderBy: { inicio: "asc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-widest text-brand-orange">
          Agenda Maranata
        </p>
        <h1 className="mt-1 text-3xl font-bold">Próximos eventos</h1>
        <p className="mt-1 text-muted-foreground">
          Celebrações, conferências e encontros nas 15 unidades.
        </p>
      </header>

      {eventos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-muted-foreground">
          Nenhum evento publicado no momento. Volte em breve.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {eventos.map((e) => (
            <Link
              key={e.id}
              href={`/eventos/${e.slug}`}
              className="block rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:bg-secondary/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-brand-orange">
                  {dataPtBR(e.inicio)}
                </span>
                {e.categoria && (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={{ backgroundColor: (e.categoria.cor ?? "#888") + "33" }}
                  >
                    {e.categoria.nome}
                  </span>
                )}
              </div>
              <h2 className="mt-2 text-lg font-semibold">{e.titulo}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{e.igreja.nome}</p>
              {e.local && (
                <p className="mt-2 text-xs text-muted-foreground">📍 {e.local}</p>
              )}
              {e.inscricoesAbertas && (
                <span className="mt-3 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                  Inscrições abertas
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
