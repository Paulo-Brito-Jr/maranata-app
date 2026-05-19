import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { marcarPresencaManual } from "./actions";

export const metadata = { title: "Presença manual" };
export const dynamic = "force-dynamic";

export default async function PresencaManualPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const evento = await prisma.evento.findUnique({
    where: { id },
    select: { titulo: true },
  });
  if (!evento) notFound();

  const inscricoes = await prisma.inscricaoEvento.findMany({
    where: { eventoId: id },
    include: { membro: { select: { nome: true } } },
    orderBy: [{ checkInEm: "asc" }, { criadoEm: "asc" }],
    take: 200,
  });

  return (
    <ModuloShell
      titulo={`Presença manual · ${evento.titulo}`}
      descricao="Clique no nome pra alternar a presença sem usar QR."
      stats={[
        { label: "Inscritos", valor: inscricoes.length },
        {
          label: "Presentes",
          valor: inscricoes.filter((i) => i.checkInEm).length,
        },
      ]}
      acoes={[{ href: `/admin/eventos/${id}/checkin`, label: "← Scanner" }]}
    >
      {inscricoes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ninguém inscrito ainda.</p>
      ) : (
        <ul className="space-y-1">
          {inscricoes.map((i) => (
            <li key={i.id}>
              <form action={marcarPresencaManual.bind(null, i.id)}>
                <button
                  type="submit"
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-2 text-left text-sm transition ${
                    i.checkInEm
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-border bg-card hover:bg-secondary"
                  }`}
                >
                  <span className="font-medium">
                    {i.membro?.nome ?? i.nomeAvulso ?? "Inscrito sem nome"}
                  </span>
                  <span
                    className={`text-xs ${
                      i.checkInEm ? "text-emerald-300" : "text-muted-foreground"
                    }`}
                  >
                    {i.checkInEm
                      ? `✓ ${i.checkInEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                      : "marcar presente"}
                  </span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <Link
        href={`/admin/eventos/${id}/checkin`}
        className="mt-4 inline-block text-xs text-primary underline"
      >
        ← voltar pro scanner
      </Link>
    </ModuloShell>
  );
}
