import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { Field, Input } from "@/components/ui/field";

export const metadata = { title: "Usuários do app" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminUsuariosAppPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; igreja?: string; ligacao?: string; page?: string }>;
}) {
  const p = (await searchParams) ?? {};
  const q = p.q?.trim() ?? "";
  const igreja = p.igreja ?? "";
  const ligacao = p.ligacao ?? ""; // "membros" | "soltos"
  const page = Math.max(1, Number(p.page ?? 1));

  const where: Record<string, unknown> = { ativo: true };
  if (q) {
    where.OR = [
      { nome: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { telefone: { contains: q } },
    ];
  }
  if (igreja) where.igrejaId = igreja;
  if (ligacao === "membros") where.membro = { isNot: null };
  if (ligacao === "soltos") where.membro = { is: null };

  const [usuarios, total, totalGeral, totalLinkados, totalSoltos, igrejas, totalCadastroComEmail] = await Promise.all([
    prisma.usuarioApp.findMany({
      where,
      orderBy: { registradoEm: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        igreja: { select: { nome: true } },
        membro: { select: { id: true } },
      },
    }),
    prisma.usuarioApp.count({ where }),
    prisma.usuarioApp.count(),
    prisma.usuarioApp.count({ where: { membro: { isNot: null } } }),
    prisma.usuarioApp.count({ where: { ativo: true, membro: { is: null } } }),
    prisma.igreja.findMany({
      where: { ativa: true },
      orderBy: [{ ehSede: "desc" }, { nome: "asc" }],
      select: { id: true, nome: true },
    }),
    prisma.usuarioApp.count({ where: { email: { not: null } } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <ModuloShell
      titulo="Usuários do app"
      descricao="Pessoas que baixaram o app InChurch antigo mas não eram membros oficiais. Importadas do espelho pra continuar acompanhando."
      stats={[
        { label: "Total", valor: totalGeral, ref: `${total} filtrados` },
        { label: "Soltos", valor: totalSoltos, ref: "sem membro vinculado" },
        { label: "Já membros", valor: totalLinkados, ref: "linkados" },
        { label: "Com e-mail", valor: totalCadastroComEmail, ref: "alcançáveis" },
      ]}
    >
      <section className="rounded-2xl border border-border bg-card p-4">
        <form action="/admin/usuarios-app" method="GET" className="grid gap-3 md:grid-cols-4">
          <Field label="Buscar">
            <Input name="q" placeholder="Nome, e-mail, telefone" defaultValue={q} />
          </Field>
          <Field label="Igreja">
            <select
              name="igreja"
              defaultValue={igreja}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {igrejas.map((i) => (
                <option key={i.id} value={i.id}>{i.nome}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              name="ligacao"
              defaultValue={ligacao}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              <option value="soltos">Sem membro (ainda)</option>
              <option value="membros">Já viraram membros</option>
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
            Nenhum usuário do app encontrado com esses filtros.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Igreja</th>
                <th className="px-4 py-3">Registrado</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-t border-border/40">
                  <td className="px-4 py-3 font-medium">{u.nome}</td>
                  <td className="px-4 py-3 text-xs">
                    {u.email && <div>{u.email}</div>}
                    {u.telefone && <div className="text-muted-foreground">{u.telefone}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{u.igreja?.nome ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {u.registradoEm.toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {u.membro ? (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] uppercase tracking-widest text-emerald-300">
                        ✓ Membro
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] uppercase tracking-widest text-amber-300">
                        Solto
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {totalPages > 1 && (
        <nav className="flex justify-center gap-2 text-sm">
          {page > 1 && (
            <a
              href={`?q=${encodeURIComponent(q)}&igreja=${igreja}&ligacao=${ligacao}&page=${page - 1}`}
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
              href={`?q=${encodeURIComponent(q)}&igreja=${igreja}&ligacao=${ligacao}&page=${page + 1}`}
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
