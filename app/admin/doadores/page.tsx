import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { Field, Input } from "@/components/ui/field";
import { getIgrejaContexto, filtroIgrejaWhere } from "@/lib/igreja-contexto";

export const metadata = { title: "Doadores" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminDoadoresPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; igreja?: string; tipo?: string; page?: string }>;
}) {
  const p = (await searchParams) ?? {};
  const q = p.q?.trim() ?? "";
  const igreja = p.igreja ?? "";
  const tipo = p.tipo ?? ""; // "natural_person" | "legal_person"
  const page = Math.max(1, Number(p.page ?? 1));

  // Respeita ctx do topbar; filtro explícito ?igreja=... sobrescreve.
  const ctx = await getIgrejaContexto();
  const ctxFiltro = filtroIgrejaWhere(ctx);

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { nome: { contains: q, mode: "insensitive" } },
      { documento: { contains: q } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (igreja) where.igrejaId = igreja;
  else if (ctxFiltro.igrejaId) where.igrejaId = ctxFiltro.igrejaId;
  if (tipo) where.personType = tipo;

  const [doadores, total, totalGeral, comMembro, comPix, comWhatsapp, igrejas] = await Promise.all([
    prisma.doador.findMany({
      where,
      orderBy: { nome: "asc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        igreja: { select: { nome: true } },
        membro: { select: { id: true, nome: true } },
      },
    }),
    prisma.doador.count({ where }),
    prisma.doador.count(),
    prisma.doador.count({ where: { membroId: { not: null } } }),
    prisma.doador.count({ where: { pixKey: { not: null } } }),
    prisma.doador.count({ where: { hasWhatsapp: true } }),
    prisma.igreja.findMany({
      where: { ativa: true },
      orderBy: [{ ehSede: "desc" }, { nome: "asc" }],
      select: { id: true, nome: true },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <ModuloShell
      titulo="Doadores & Fornecedores"
      descricao="Histórico migrado do InChurch entry_source. Use pra cruzar com Doacao e comunicar parceiros."
      stats={[
        { label: "Total", valor: totalGeral, ref: `${total} filtrados` },
        { label: "Com PIX", valor: comPix },
        { label: "Com WhatsApp", valor: comWhatsapp },
        { label: "Vinculado a membro", valor: comMembro },
      ]}
    >
      <section className="rounded-2xl border border-border bg-card p-4">
        <form action="/admin/doadores" method="GET" className="grid gap-3 md:grid-cols-4">
          <Field label="Buscar">
            <Input name="q" placeholder="Nome, CPF, email" defaultValue={q} />
          </Field>
          <Field label="Igreja">
            <select
              name="igreja"
              defaultValue={igreja}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {igrejas.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tipo">
            <select
              name="tipo"
              defaultValue={tipo}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              <option value="natural_person">Pessoa Física</option>
              <option value="legal_person">Pessoa Jurídica</option>
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
        {doadores.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Nenhum doador encontrado com esses filtros.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Igreja</th>
                <th className="px-4 py-3">Membro</th>
                <th className="px-4 py-3">PIX</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {doadores.map((d) => (
                <tr key={d.id} className="border-t border-border/40">
                  <td className="px-4 py-3 font-medium">{d.nome}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{d.documento ?? "—"}</td>
                  <td className="px-4 py-3 text-xs">
                    {d.email && <div>{d.email}</div>}
                    {d.telefone && (
                      <div className="text-muted-foreground">
                        {d.telefone}
                        {d.hasWhatsapp && " · WhatsApp"}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{d.igreja?.nome ?? "—"}</td>
                  <td className="px-4 py-3 text-xs">
                    {d.membro ? (
                      <Link href={`/admin/membros/${d.membro.id}`} className="text-primary underline">
                        {d.membro.nome.split(" ").slice(0, 2).join(" ")}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {d.pixKey ? (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] uppercase tracking-widest text-emerald-300">
                        ✓
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    <Link
                      href={`/admin/doadores/${d.id}/editar`}
                      className="text-primary hover:underline"
                    >
                      editar
                    </Link>
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
            <Link
              href={`?q=${encodeURIComponent(q)}&igreja=${igreja}&tipo=${tipo}&page=${page - 1}`}
              className="rounded-full bg-secondary/60 px-4 py-2 hover:bg-secondary"
            >
              ← Anterior
            </Link>
          )}
          <span className="self-center text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`?q=${encodeURIComponent(q)}&igreja=${igreja}&tipo=${tipo}&page=${page + 1}`}
              className="rounded-full bg-secondary/60 px-4 py-2 hover:bg-secondary"
            >
              Próxima →
            </Link>
          )}
        </nav>
      )}
    </ModuloShell>
  );
}
