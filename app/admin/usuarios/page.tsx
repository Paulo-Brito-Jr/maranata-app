import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { Field, Input } from "@/components/ui/field";
import { RoleBadge } from "@/components/role-badge";

export const metadata = { title: "Usuários administradores" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; papel?: string; ativo?: string; page?: string }>;
}) {
  const p = (await searchParams) ?? {};
  const q = p.q?.trim() ?? "";
  const papel = p.papel ?? "";
  const ativo = p.ativo ?? "";
  const page = Math.max(1, Number(p.page ?? 1));

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { nome: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (papel) where.papel = papel;
  if (ativo === "true") where.ativo = true;
  if (ativo === "false") where.ativo = false;

  const [usuarios, total, totalGeral, totalAtivos, porPapel] = await Promise.all([
    prisma.usuario.findMany({
      where,
      orderBy: [{ ativo: "desc" }, { nome: "asc" }],
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: { membro: { select: { id: true, igreja: { select: { nome: true } } } } },
    }),
    prisma.usuario.count({ where }),
    prisma.usuario.count(),
    prisma.usuario.count({ where: { ativo: true } }),
    prisma.usuario.groupBy({ by: ["papel"], _count: { _all: true } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const papeisStats = porPapel
    .map((p) => ({ papel: p.papel, count: p._count._all }))
    .sort((a, b) => b.count - a.count);

  return (
    <ModuloShell
      titulo="Usuários administradores"
      descricao="Quem tem acesso ao painel. Importado do InChurch + criado via Maranata Key SSO."
      stats={[
        { label: "Total", valor: totalGeral, ref: `${total} filtrados` },
        { label: "Ativos", valor: totalAtivos },
        { label: "Papéis distintos", valor: papeisStats.length },
      ]}
    >
      <section className="rounded-2xl border border-border bg-card p-4">
        <form action="/admin/usuarios" method="GET" className="grid gap-3 md:grid-cols-4">
          <Field label="Buscar">
            <Input name="q" placeholder="Nome ou e-mail" defaultValue={q} />
          </Field>
          <Field label="Papel">
            <select
              name="papel"
              defaultValue={papel}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="PASTOR_DIRETORIA">Pastor Diretoria</option>
              <option value="ADMIN_IGREJA">Admin Igreja</option>
              <option value="LIDER_CELULA">Líder de Célula</option>
              <option value="SECRETARIA">Secretaria</option>
              <option value="FINANCEIRO">Financeiro</option>
              <option value="KIDS_RESPONSAVEL">Kids</option>
              <option value="MEMBRO">Membro</option>
            </select>
          </Field>
          <Field label="Status">
            <select
              name="ativo"
              defaultValue={ativo}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              <option value="true">Ativos</option>
              <option value="false">Desativados</option>
            </select>
          </Field>
          <div className="flex items-end">
            <button
              type="submit"
              className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
            >
              Filtrar
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-card overflow-hidden">
        {usuarios.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Nenhum usuário encontrado.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Papel</th>
                <th className="px-4 py-3">Igreja</th>
                <th className="px-4 py-3">Último login</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-t border-border/40">
                  <td className="px-4 py-3 font-medium">{u.nome}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.papel} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {u.membro?.igreja?.nome ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {u.ultimoLogin
                      ? new Date(u.ultimoLogin).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {u.ativo ? (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] uppercase tracking-widest text-emerald-300">
                        Ativo
                      </span>
                    ) : (
                      <span className="rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                        Off
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Distribuição por papel
        </h2>
        <div className="flex flex-wrap gap-2">
          {papeisStats.map((p) => (
            <span
              key={p.papel}
              className="rounded-full bg-secondary/60 px-3 py-1 text-xs text-muted-foreground"
            >
              {p.papel} <strong className="text-foreground">{p.count}</strong>
            </span>
          ))}
        </div>
      </section>

      {totalPages > 1 && (
        <nav className="flex justify-center gap-2 text-sm">
          {page > 1 && (
            <a
              href={`?q=${encodeURIComponent(q)}&papel=${papel}&ativo=${ativo}&page=${page - 1}`}
              className="rounded-full bg-secondary/60 px-4 py-2"
            >
              ← Anterior
            </a>
          )}
          <span className="self-center text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`?q=${encodeURIComponent(q)}&papel=${papel}&ativo=${ativo}&page=${page + 1}`}
              className="rounded-full bg-secondary/60 px-4 py-2"
            >
              Próxima →
            </a>
          )}
        </nav>
      )}
    </ModuloShell>
  );
}
