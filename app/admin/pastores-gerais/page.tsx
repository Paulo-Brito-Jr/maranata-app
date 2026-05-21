import { notFound } from "next/navigation";
import { MinisterioGeral } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ModuloShell } from "@/components/modulo-shell";
import { Field, Input } from "@/components/ui/field";

export const metadata = { title: "Pastores gerais de ministério" };
export const dynamic = "force-dynamic";

const ROTULO: Record<MinisterioGeral, { label: string; emoji: string }> = {
  KIDS: { label: "Kids", emoji: "🧒" },
  TEEN: { label: "Teen", emoji: "🧑‍🎓" },
  JOVENS: { label: "Jovens", emoji: "🧑" },
  CASAIS: { label: "Casais", emoji: "💑" },
  TERCEIRA_IDADE: { label: "Terceira Idade", emoji: "👴" },
  LOUVOR: { label: "Louvor", emoji: "🎵" },
};

export default async function PastoresGeraisPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") notFound();

  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";

  const [vinculos, candidatos] = await Promise.all([
    prisma.pastorGeralMinisterio.findMany({
      where: { ativo: true },
      include: { usuario: { select: { id: true, nome: true, email: true, papel: true } } },
      orderBy: [{ ministerio: "asc" }, { criadoEm: "asc" }],
    }),
    q
      ? prisma.usuario.findMany({
          where: {
            ativo: true,
            OR: [
              { nome: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
          select: { id: true, nome: true, email: true, papel: true },
          orderBy: { nome: "asc" },
          take: 20,
        })
      : Promise.resolve([]),
  ]);

  const porMinisterio = new Map<MinisterioGeral, typeof vinculos>();
  for (const m of Object.values(MinisterioGeral)) {
    porMinisterio.set(m as MinisterioGeral, []);
  }
  for (const v of vinculos) {
    porMinisterio.get(v.ministerio)!.push(v);
  }

  return (
    <ModuloShell
      titulo="Pastores gerais de ministério"
      descricao="Pastores que cuidam de um ministério em todas as 14 unidades. Ganham acesso transversal nas áreas do seu ministério."
      stats={[
        { label: "Pastores designados", valor: new Set(vinculos.map((v) => v.usuarioId)).size },
        { label: "Vínculos ativos", valor: vinculos.length },
        { label: "Ministérios cobertos", valor: Array.from(porMinisterio.values()).filter((vs) => vs.length > 0).length, ref: `de ${porMinisterio.size}` },
      ]}
    >
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from(porMinisterio.entries()).map(([min, vs]) => {
          const meta = ROTULO[min];
          return (
            <div
              key={min}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <header className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <span>{meta.emoji}</span>
                  <span>{meta.label}</span>
                </h2>
                <span className="rounded-full bg-muted/60 px-2 py-0.5 text-xs">
                  {vs.length}
                </span>
              </header>

              <div className="mt-3 space-y-2">
                {vs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum pastor geral atribuído.
                  </p>
                ) : (
                  vs.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {v.usuario.nome}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {v.usuario.email}
                        </div>
                      </div>
                      <form action="/api/admin/pastores-gerais/remover" method="POST">
                        <input type="hidden" name="id" value={v.id} />
                        <button
                          className="rounded-full bg-red-500/10 px-2 py-1 text-xs text-red-600 hover:bg-red-500/20 dark:text-red-400"
                          title="Remover vínculo"
                        >
                          Remover
                        </button>
                      </form>
                    </div>
                  ))
                )}
              </div>

              <form
                action="/api/admin/pastores-gerais/atribuir"
                method="POST"
                className="mt-4 border-t border-border/40 pt-3"
              >
                <input type="hidden" name="ministerio" value={min} />
                <Field label="Atribuir pastor (busque acima)">
                  <select
                    name="usuarioId"
                    required
                    defaultValue=""
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">{q ? "Escolha um..." : "Busque um usuário acima primeiro"}</option>
                    {candidatos.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} ({c.email})
                      </option>
                    ))}
                  </select>
                </Field>
                <button
                  type="submit"
                  disabled={candidatos.length === 0}
                  className="mt-2 w-full rounded-full bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  Atribuir
                </button>
              </form>
            </div>
          );
        })}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Buscar usuário pra atribuir
        </h2>
        <form action="/admin/pastores-gerais" method="GET" className="mt-3 flex gap-2">
          <Input
            name="q"
            placeholder="Nome ou e-mail"
            defaultValue={q}
            className="flex-1"
          />
          <button
            type="submit"
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
          >
            Buscar
          </button>
        </form>
        {q && (
          <p className="mt-2 text-xs text-muted-foreground">
            {candidatos.length} usuário(s) encontrados. Eles aparecem nos selects de
            cada ministério acima.
          </p>
        )}
      </section>
    </ModuloShell>
  );
}
