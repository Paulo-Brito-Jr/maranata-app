import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { brl, dataPtBR } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";

export const metadata = { title: "Lançamentos" };
export const dynamic = "force-dynamic";

export default async function LancamentosPage() {
  const lancamentos = await prisma.lancamentoFinanceiro.findMany({
    include: {
      igreja: { select: { nome: true } },
      categoria: { select: { nome: true, cor: true } },
    },
    orderBy: { data: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href="/admin/financeiro"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            ← Voltar
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Lançamentos</h1>
          <p className="text-muted-foreground">
            Entradas e saídas em todas as 14 unidades.
          </p>
        </div>
        <Link
          href="/admin/financeiro/lancamentos/novo"
          className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
        >
          Novo lançamento
        </Link>
      </header>

      {lancamentos.length === 0 ? (
        <EmptyState
          titulo="Nenhum lançamento"
          descricao="Cadastre o primeiro lançamento financeiro."
          acao={{ href: "/admin/financeiro/lancamentos/novo", label: "Novo lançamento" }}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/30">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Igreja</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium text-right">Valor</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {lancamentos.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3 text-muted-foreground">{dataPtBR(l.data)}</td>
                  <td className="px-4 py-3">{l.descricao ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.igreja.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {l.categoria?.nome ?? "—"}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${
                      l.tipo === "ENTRADA" ? "text-success" : "text-destructive"
                    }`}
                  >
                    {l.tipo === "ENTRADA" ? "+" : "-"} {brl(Number(l.valor))}
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    <Link
                      href={`/admin/financeiro/lancamentos/${l.id}/editar`}
                      className="text-primary hover:underline"
                    >
                      editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
