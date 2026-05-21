import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { dataPtBR } from "@/lib/utils";

export const metadata = { title: "Eventos" };
export const dynamic = "force-dynamic";

export default async function MembroEventos() {
  const agora = new Date();
  const eventos = await prisma.evento.findMany({
    where: { publicado: true, inicio: { gte: agora } },
    include: {
      igreja: { select: { nome: true } },
      categoria: { select: { nome: true, cor: true } },
    },
    orderBy: { inicio: "asc" },
    take: 50,
  });

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-medium uppercase tracking-widest text-brand-orange">
          Agenda
        </p>
        <h1 className="mt-1 text-2xl font-bold">Próximos eventos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          As celebrações e encontros nas 14 unidades.
        </p>
      </header>

      {eventos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Nenhum evento publicado. Volte em breve.
        </div>
      ) : (
        <div className="space-y-3">
          {eventos.map((e) => (
            <Link
              key={e.id}
              href={`/eventos/${e.slug}`}
              className="block rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-secondary/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-brand-orange">
                  {dataPtBR(e.inicio)}
                </span>
                {e.categoria && (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={{
                      backgroundColor: (e.categoria.cor ?? "#888") + "33",
                    }}
                  >
                    {e.categoria.nome}
                  </span>
                )}
              </div>
              <h2 className="mt-1 text-base font-semibold leading-tight">
                {e.titulo}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {e.igreja.nome}
              </p>
              {e.local && (
                <p className="mt-1 text-xs text-muted-foreground">📍 {e.local}</p>
              )}
              {e.inscricoesAbertas && (
                <span className="mt-2 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
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
