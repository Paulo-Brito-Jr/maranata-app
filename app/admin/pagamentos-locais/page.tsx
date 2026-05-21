import Link from "next/link";
import { notFound } from "next/navigation";
import { Prisma, StatusPagamentoLocal } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ModuloShell } from "@/components/modulo-shell";
import { brl, dataPtBR } from "@/lib/utils";

export const metadata = { title: "Pagamentos em dinheiro" };
export const dynamic = "force-dynamic";

type Search = { igrejaId?: string; status?: string };

const STATUS_LABELS: Record<string, { label: string; classe: string }> = {
  AGUARDANDO: { label: "Aguardando", classe: "bg-muted text-muted-foreground" },
  MEMBRO_INFORMOU: {
    label: "Membro disse: já paguei",
    classe: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  ADMIN_CONFIRMOU: {
    label: "Aguarda double-check do membro",
    classe: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  },
  VALIDADO: {
    label: "Validado",
    classe: "bg-green-500/15 text-green-700 dark:text-green-300",
  },
  CANCELADO: {
    label: "Cancelado",
    classe: "bg-red-500/15 text-red-700 dark:text-red-300",
  },
};

export default async function PagamentosLocaisPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const user = await getCurrentUser();
  if (!user) notFound();

  const podeVerTudo =
    user.role === "SUPER_ADMIN" || user.role === "PASTOR_DIRETORIA";
  if (!podeVerTudo && user.role !== "ADMIN_IGREJA") notFound();

  const sp = await searchParams;
  const igrejaIdFiltro = podeVerTudo
    ? sp.igrejaId && sp.igrejaId !== "todas"
      ? sp.igrejaId
      : null
    : user.igrejaId ?? null;
  const statusFiltro = sp.status ?? "abertos"; // abertos = não VALIDADO/CANCELADO

  const where: Prisma.PagamentoLocalWhereInput = {
    ...(igrejaIdFiltro ? { igrejaId: igrejaIdFiltro } : {}),
    ...(statusFiltro === "abertos"
      ? {
          status: {
            in: [
              StatusPagamentoLocal.AGUARDANDO,
              StatusPagamentoLocal.MEMBRO_INFORMOU,
              StatusPagamentoLocal.ADMIN_CONFIRMOU,
            ],
          },
        }
      : statusFiltro === "todos"
      ? {}
      : { status: statusFiltro as StatusPagamentoLocal }),
  };

  const [igrejas, pagamentos, totais] = await Promise.all([
    podeVerTudo
      ? prisma.igreja.findMany({
          where: { ativa: true },
          orderBy: [{ ehSede: "desc" }, { nome: "asc" }],
          select: { id: true, nome: true, apelido: true },
        })
      : Promise.resolve([]),
    prisma.pagamentoLocal.findMany({
      where,
      orderBy: [{ status: "asc" }, { criadoEm: "desc" }],
      take: 200,
      include: {
        igreja: { select: { nome: true, apelido: true } },
        membro: { select: { nome: true } },
      },
    }),
    prisma.pagamentoLocal.groupBy({
      by: ["status"],
      where: igrejaIdFiltro ? { igrejaId: igrejaIdFiltro } : {},
      _count: { _all: true },
      _sum: { valor: true },
    }),
  ]);

  const totalAguardando = totais
    .filter((t) => t.status === "AGUARDANDO" || t.status === "MEMBRO_INFORMOU")
    .reduce((acc, t) => acc + Number(t._sum.valor ?? 0), 0);
  const totalValidado = totais
    .filter((t) => t.status === "VALIDADO")
    .reduce((acc, t) => acc + Number(t._sum.valor ?? 0), 0);
  const countMembroInformou = totais.find((t) => t.status === "MEMBRO_INFORMOU")?._count
    ._all ?? 0;

  return (
    <ModuloShell
      titulo="Pagamentos em dinheiro"
      descricao={
        podeVerTudo
          ? "Confirme o recebimento físico em cada unidade."
          : "Pagamentos pendentes na sua unidade."
      }
      stats={[
        { label: "A receber", valor: brl(totalAguardando) },
        { label: "Já validados", valor: brl(totalValidado) },
        {
          label: "Membros sinalizaram",
          valor: countMembroInformou,
          ref: "que já pagaram",
        },
      ]}
    >
      <form method="GET" className="flex flex-wrap items-center gap-2">
        {podeVerTudo && (
          <select
            name="igrejaId"
            defaultValue={igrejaIdFiltro ?? "todas"}
            className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="todas">Todas as unidades</option>
            {igrejas.map((ig) => (
              <option key={ig.id} value={ig.id}>
                {ig.apelido ? `${ig.apelido} (${ig.nome})` : ig.nome}
              </option>
            ))}
          </select>
        )}
        <select
          name="status"
          defaultValue={statusFiltro}
          className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="abertos">Pendentes</option>
          <option value="MEMBRO_INFORMOU">Só membro informou</option>
          <option value="VALIDADO">Validados</option>
          <option value="CANCELADO">Cancelados</option>
          <option value="todos">Todos</option>
        </select>
        <button className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground">
          Filtrar
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Pagador</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Unidade</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Criado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {pagamentos.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  Nenhum pagamento {statusFiltro === "abertos" ? "pendente" : ""}.
                </td>
              </tr>
            )}
            {pagamentos.map((p) => {
              const status = STATUS_LABELS[p.status];
              const podeConfirmar = p.status === "AGUARDANDO" || p.status === "MEMBRO_INFORMOU";
              return (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    {p.membro?.nome ?? p.nomePagador ?? "—"}
                    {p.emailPagador && (
                      <div className="text-xs text-muted-foreground">
                        {p.emailPagador}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">{p.descricao ?? p.origem}</td>
                  <td className="px-4 py-3">
                    {p.igreja.apelido ?? p.igreja.nome}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {brl(Number(p.valor))}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs ${status.classe}`}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {dataPtBR(p.criadoEm)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {podeConfirmar ? (
                      <form
                        action={`/api/admin/pagamento-local/${p.id}/confirmar`}
                        method="POST"
                      >
                        <button className="rounded-full bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700">
                          Confirmar recebimento
                        </button>
                      </form>
                    ) : (
                      <Link
                        href={`/admin/pagamentos-locais/${p.id}`}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Detalhes
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ModuloShell>
  );
}
