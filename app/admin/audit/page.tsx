import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";

export const metadata = { title: "Auditoria" };
export const dynamic = "force-dynamic";

const TIPOS = ["criou", "editou", "deletou", "login", "logout", "export"];

function corDoTipo(acao: string): string {
  const a = acao.toLowerCase();
  if (a.startsWith("criou") || a.startsWith("login")) return "bg-emerald-500/15 text-emerald-300";
  if (a.startsWith("deletou") || a.startsWith("logout")) return "bg-red-500/15 text-red-300";
  if (a.startsWith("editou")) return "bg-amber-500/15 text-amber-300";
  return "bg-secondary/60 text-muted-foreground";
}

function dataHoraCurta(d: Date): string {
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams?: Promise<{ recurso?: string; acao?: string }>;
}) {
  const p = (await searchParams) ?? {};
  const where: Record<string, string> = {};
  if (p.recurso) where.recurso = p.recurso;
  if (p.acao) where.acao = p.acao;

  const [logs, total, porAcao, recursos] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { criadoEm: "desc" },
      take: 100,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.groupBy({ by: ["acao"], _count: { _all: true }, orderBy: { _count: { acao: "desc" } } }),
    prisma.auditLog.groupBy({ by: ["recurso"], _count: { _all: true } }),
  ]);

  return (
    <ModuloShell
      titulo="Auditoria"
      descricao="Trilha completa de ações no sistema. Registros recentes primeiro."
      stats={[
        { label: "Total registros", valor: total, ref: "filtrado" },
        { label: "Mostrando", valor: Math.min(logs.length, 100) },
        { label: "Tipos de ação", valor: porAcao.length },
        { label: "Recursos", valor: recursos.length },
      ]}
    >
      <section className="flex flex-wrap gap-2">
        <span className="text-xs uppercase tracking-widest text-muted-foreground self-center">
          Filtros:
        </span>
        <a
          href="/admin/audit"
          className="rounded-full bg-secondary/60 px-3 py-1 text-xs text-muted-foreground hover:bg-secondary"
        >
          Todos
        </a>
        {TIPOS.map((t) => (
          <a
            key={t}
            href={`/admin/audit?acao=${t}`}
            className={`rounded-full px-3 py-1 text-xs ${
              p.acao === t ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
            }`}
          >
            {t}
          </a>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-card overflow-hidden">
        {logs.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Sem registros de auditoria ainda.
            <br />
            <span className="text-xs">Quando ações forem rastreadas, aparecem aqui.</span>
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Quando</th>
                <th className="px-4 py-3">Ação</th>
                <th className="px-4 py-3">Recurso</th>
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-border/40">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {dataHoraCurta(l.criadoEm)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${corDoTipo(l.acao)}`}>
                      {l.acao}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="font-mono">{l.recurso}</span>
                    {l.recursoId && (
                      <span className="ml-1 text-muted-foreground">#{l.recursoId.slice(0, 8)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {l.usuarioId?.slice(0, 8) ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                    {l.ip ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </ModuloShell>
  );
}
