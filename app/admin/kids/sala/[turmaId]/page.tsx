import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { EmergenciaBotao } from "./emergencia-botao";
import { TempoDecorrido } from "./tempo-decorrido";

export const dynamic = "force-dynamic";
export const revalidate = 10;

export async function generateMetadata({ params }: { params: Promise<{ turmaId: string }> }) {
  const { turmaId } = await params;
  const t = await prisma.kidsTurma.findUnique({
    where: { id: turmaId },
    select: { nome: true },
  });
  return { title: t ? `Sala ${t.nome}` : "Sala Kids" };
}

export default async function SalaPage({
  params,
}: {
  params: Promise<{ turmaId: string }>;
}) {
  const { turmaId } = await params;
  const turma = await prisma.kidsTurma.findUnique({
    where: { id: turmaId },
    include: { igreja: { select: { nome: true } } },
  });
  if (!turma) notFound();

  const ativos = await prisma.kidsCheckin.findMany({
    where: { turmaId, saidaEm: null },
    include: {
      crianca: {
        include: {
          responsaveis: {
            where: { podeBuscar: true },
            select: { nome: true, telefone: true, principal: true },
          },
        },
      },
    },
    orderBy: { entradaEm: "asc" },
  });

  const comAlergias = ativos.filter((c) => c.crianca.alergias).length;

  return (
    <ModuloShell
      titulo={`Sala ${turma.nome}`}
      descricao={`${turma.igreja.nome}${turma.sala ? ` · ${turma.sala}` : ""} · ${turma.faixaEtaria}`}
      stats={[
        { label: "Em sala agora", valor: ativos.length },
        { label: "Capacidade", valor: turma.capacidade ?? "—" },
        { label: "Com alergias", valor: comAlergias },
      ]}
      acoes={[
        { href: "/admin/kids/checkin", label: "Check-in" },
        { href: "/admin/kids/checkout", label: "Retirar" },
      ]}
    >
      <EmergenciaBotao turmaId={turmaId} turmaLabel={turma.nome} />

      {ativos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
          Sala vazia. Faça um check-in pra começar.
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {ativos.map((c) => {
            return (
              <li
                key={c.id}
                className={`rounded-2xl border bg-card p-4 ${
                  c.crianca.alergias
                    ? "border-red-500/40 ring-1 ring-red-500/20"
                    : "border-border"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-semibold">{c.crianca.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      Entrou às{" "}
                      {c.entradaEm.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      (<TempoDecorrido desde={c.entradaEm.toISOString()} />)
                    </p>
                  </div>
                  <code className="rounded bg-secondary/60 px-1.5 py-0.5 text-[10px]">
                    {c.etiquetaCode.slice(-6).toUpperCase()}
                  </code>
                </div>

                {c.crianca.alergias && (
                  <p className="mt-2 rounded-lg bg-red-500/15 px-2 py-1 text-xs font-medium text-red-300">
                    ⚠ Alergias: {c.crianca.alergias}
                  </p>
                )}
                {c.crianca.restricoesAlim && (
                  <p className="mt-1 text-xs text-amber-300">
                    🍴 {c.crianca.restricoesAlim}
                  </p>
                )}
                {c.crianca.necessidadesEsp && (
                  <p className="mt-1 text-xs text-cyan-300">
                    ♿ {c.crianca.necessidadesEsp}
                  </p>
                )}
                {c.observacoes && (
                  <p className="mt-1 text-xs text-muted-foreground italic">«{c.observacoes}»</p>
                )}

                {c.crianca.responsaveis.length > 0 && (
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer text-muted-foreground">
                      Responsáveis ({c.crianca.responsaveis.length})
                    </summary>
                    <ul className="mt-1 space-y-0.5 pl-2">
                      {c.crianca.responsaveis.map((r, i) => (
                        <li key={i}>
                          {r.principal && "★ "}
                          {r.nome}
                          {r.telefone && ` · ${r.telefone}`}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}

                <Link
                  href={`/admin/kids/etiqueta/${c.id}`}
                  className="mt-3 inline-block text-xs text-primary underline"
                >
                  Reimprimir etiqueta →
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-center text-[10px] text-muted-foreground">
        Página atualiza sozinha a cada 10s.
      </p>
    </ModuloShell>
  );
}
