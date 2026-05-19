import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { ScannerEvento } from "./scanner";

export const metadata = { title: "Check-in evento" };
export const dynamic = "force-dynamic";
export const revalidate = 10;

export default async function CheckinEventoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const evento = await prisma.evento.findUnique({
    where: { id },
    include: { _count: { select: { inscricoes: true } } },
  });
  if (!evento) notFound();

  const [presentes, recentes] = await Promise.all([
    prisma.inscricaoEvento.count({
      where: { eventoId: id, checkInEm: { not: null } },
    }),
    prisma.inscricaoEvento.findMany({
      where: { eventoId: id, checkInEm: { not: null } },
      orderBy: { checkInEm: "desc" },
      take: 20,
      include: { membro: { select: { nome: true } } },
    }),
  ]);

  return (
    <ModuloShell
      titulo={`Check-in · ${evento.titulo}`}
      descricao="Escaneie o QR da inscrição. A página atualiza sozinha a cada 10s."
      stats={[
        { label: "Total inscritos", valor: evento._count.inscricoes },
        { label: "Presentes", valor: presentes },
        {
          label: "Comparecimento",
          valor: `${
            evento._count.inscricoes > 0
              ? Math.round((presentes / evento._count.inscricoes) * 100)
              : 0
          }%`,
        },
      ]}
      acoes={[{ href: `/admin/eventos/${id}`, label: "← Voltar" }]}
    >
      <ScannerEvento eventoId={id} />

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Últimos check-ins
        </h2>
        {recentes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ninguém marcou presença ainda.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
            {recentes.map((i) => (
              <li key={i.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="font-medium">{i.membro?.nome ?? i.nomeAvulso ?? "—"}</span>
                <span className="text-xs text-muted-foreground">
                  {i.checkInEm?.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link
        href={`/admin/eventos/${id}/checkin/manual`}
        className="inline-block rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-secondary"
      >
        Marcar presença manualmente
      </Link>
    </ModuloShell>
  );
}
