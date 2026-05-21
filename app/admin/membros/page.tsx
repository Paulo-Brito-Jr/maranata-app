import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { EmptyState } from "@/components/empty-state";
import { dataPtBR } from "@/lib/utils";
import { getIgrejaContexto, filtroIgrejaWhere } from "@/lib/igreja-contexto";

export const metadata = { title: "Membros" };
export const dynamic = "force-dynamic";

export default async function MembrosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; igreja?: string }>;
}) {
  const { q, igreja } = await searchParams;
  const ctx = await getIgrejaContexto();
  const ctxFiltro = filtroIgrejaWhere(ctx);
  const igrejaFiltro = igreja || ctxFiltro.igrejaId;

  const [membros, totalMembros, totalVisitantes, totalNovos, igrejas] = await Promise.all([
    prisma.membro.findMany({
      where: {
        ...(q ? { nome: { contains: q, mode: "insensitive" as const } } : {}),
        ...(igrejaFiltro ? { igrejaId: igrejaFiltro } : {}),
      },
      include: { igreja: { select: { nome: true } } },
      orderBy: { nome: "asc" },
      take: 100,
    }),
    prisma.membro.count({ where: igrejaFiltro ? { igrejaId: igrejaFiltro } : {} }),
    prisma.visitante.count({ where: igrejaFiltro ? { igrejaId: igrejaFiltro } : {} }),
    prisma.novoConvertido.count(),
    prisma.igreja.findMany({
      where: { ativa: true, tipo: "CONGREGACAO" as const },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <ModuloShell
      titulo="Membresia"
      descricao="Membros, visitantes, novos convertidos e família espiritual."
      stats={[
        { label: "Membros", valor: totalMembros, ref: "InChurch tinha 2.731" },
        { label: "Visitantes", valor: totalVisitantes, ref: "InChurch tinha 310" },
        { label: "Novos convertidos", valor: totalNovos, ref: "InChurch tinha 4" },
        { label: "Igrejas", valor: igrejas.length },
      ]}
      acoes={[
        { href: "/admin/membros/novo", label: "Novo membro" },
        { href: "/admin/membros/import", label: "Importar XLSX" },
      ]}
    >
      <form className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card/40 p-3">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nome..."
          className="flex-1 min-w-[200px] rounded-xl border border-input bg-background px-3 py-2 text-sm"
        />
        <select
          name="igreja"
          defaultValue={igreja ?? ""}
          className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Todas as igrejas</option>
          {igrejas.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nome}
            </option>
          ))}
        </select>
        <button className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">
          Filtrar
        </button>
      </form>

      {membros.length === 0 ? (
        <EmptyState
          titulo={q || igreja ? "Nenhum membro encontrado com esse filtro" : "Nenhum membro cadastrado"}
          descricao={q || igreja ? "Tente outro filtro." : "Comece cadastrando o primeiro membro."}
          acao={{ href: "/admin/membros/novo", label: "Cadastrar membro" }}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/30">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Igreja</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Batismo</th>
                <th className="px-4 py-3 font-medium">Contato</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {membros.map((m) => (
                <tr key={m.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <Link href={`/admin/membros/${m.id}`} className="font-medium hover:text-primary">
                      {m.nome}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{m.igreja.nome}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                      {m.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{dataPtBR(m.dataBatismo)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {m.email ?? m.telefone ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    <Link
                      href={`/admin/membros/${m.id}/editar`}
                      className="text-primary hover:underline"
                    >
                      editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {membros.length >= 100 && (
            <div className="border-t border-border bg-secondary/20 px-4 py-2 text-xs text-muted-foreground">
              Mostrando os primeiros 100. Use a busca pra refinar.
            </div>
          )}
        </div>
      )}
    </ModuloShell>
  );
}
