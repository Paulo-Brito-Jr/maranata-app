import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { EmptyState } from "@/components/empty-state";

export const metadata = { title: "Células" };
export const dynamic = "force-dynamic";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default async function CelulasPage() {
  const [celulas, totalParticipantes, totalRedes, totalVisitantes] = await Promise.all([
    prisma.celula.findMany({
      include: {
        igreja: { select: { nome: true } },
        rede: { select: { nome: true, cor: true } },
        _count: { select: { participantes: { where: { ativo: true } } } },
      },
      orderBy: [{ status: "asc" }, { nome: "asc" }],
    }),
    prisma.participanteCelula.count({ where: { ativo: true } }),
    prisma.rede.count(),
    prisma.visitanteCelula.count(),
  ]);

  const ativas = celulas.filter((c) => c.status === "ATIVA").length;

  return (
    <ModuloShell
      titulo="Células"
      descricao="Redes, células, líderes, participantes e relatórios."
      stats={[
        { label: "Células ativas", valor: ativas, ref: "InChurch: 62" },
        { label: "Total redes", valor: totalRedes },
        { label: "Participantes", valor: totalParticipantes, ref: "InChurch: 713" },
        { label: "Visitantes", valor: totalVisitantes, ref: "InChurch: 85" },
      ]}
      acoes={[{ href: "/admin/celulas/nova", label: "Nova célula" }]}
    >
      {celulas.length === 0 ? (
        <EmptyState
          titulo="Nenhuma célula cadastrada"
          descricao="Cadastre a primeira célula da sua igreja."
          acao={{ href: "/admin/celulas/nova", label: "Nova célula" }}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {celulas.map((c) => (
            <Link
              key={c.id}
              href={`/admin/celulas/${c.id}`}
              className="rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{c.nome}</h3>
                {c.rede && (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={{ backgroundColor: (c.rede.cor ?? "#888") + "33" }}
                  >
                    {c.rede.nome}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{c.igreja.nome}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                {c.diaSemana != null && <span>{DIAS[c.diaSemana]}</span>}
                {c.horario && <span>{c.horario}</span>}
                <span>· {c._count.participantes} membros</span>
              </div>
              {c.status !== "ATIVA" && (
                <span className="mt-2 inline-block rounded-full bg-secondary px-2 py-0.5 text-xs">
                  {c.status.toLowerCase().replace("_", " ")}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </ModuloShell>
  );
}
