import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { dataPtBR } from "@/lib/utils";

export const metadata = { title: "Histórico Kids" };
export const dynamic = "force-dynamic";

export default async function HistoricoKidsPage() {
  const checkins = await prisma.kidsCheckin.findMany({
    orderBy: { entradaEm: "desc" },
    take: 100,
    include: {
      crianca: { select: { nome: true, alergias: true } },
      turma: { select: { nome: true, igreja: { select: { nome: true } } } },
    },
  });

  return (
    <ModuloShell
      titulo="Histórico de check-ins"
      descricao="Últimos 100 registros. Em breve: busca por criança, exportação CSV."
      stats={[
        { label: "Registros listados", valor: checkins.length },
        { label: "Hoje", valor: checkins.filter((c) => sameDay(c.entradaEm, new Date())).length },
      ]}
      acoes={[{ href: "/admin/kids", label: "← Voltar" }]}
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Criança</th>
              <th className="px-3 py-2 text-left">Turma</th>
              <th className="px-3 py-2 text-left">Entrada</th>
              <th className="px-3 py-2 text-left">Saída</th>
              <th className="px-3 py-2 text-left">Retirou</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {checkins.map((c) => (
              <tr key={c.id} className={c.saidaEm ? "" : "bg-emerald-500/5"}>
                <td className="px-3 py-2 font-medium">
                  {c.crianca.nome}
                  {c.crianca.alergias && (
                    <span className="ml-2 text-xs text-red-300">⚠</span>
                  )}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {c.turma.nome}{" "}
                  <span className="text-xs">({c.turma.igreja.nome})</span>
                </td>
                <td className="px-3 py-2">
                  {dataPtBR(c.entradaEm)} ·{" "}
                  {c.entradaEm.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-3 py-2">
                  {c.saidaEm
                    ? `${dataPtBR(c.saidaEm)} · ${c.saidaEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                    : "—"}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {c.retiradaPor ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModuloShell>
  );
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
