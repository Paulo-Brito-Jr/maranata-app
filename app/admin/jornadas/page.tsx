import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { Field, Input, Textarea, Button } from "@/components/ui/field";
import { criarTrilha } from "../kids/actions";

export const metadata = { title: "Jornadas" };
export const dynamic = "force-dynamic";

export default async function JornadasPage() {
  const [trilhas, totalPessoas] = await Promise.all([
    prisma.trilha.findMany({
      include: { _count: { select: { pessoas: true } } },
      orderBy: { ordem: "asc" },
    }),
    prisma.pessoaJornada.count(),
  ]);

  return (
    <ModuloShell
      titulo="Jornadas"
      descricao="Trilhas de discipulado com atribuição automática para novos convertidos."
      stats={[
        { label: "Trilhas", valor: trilhas.length, ref: "InChurch: 3 (2 vazias!)" },
        { label: "Pessoas em jornada", valor: totalPessoas, ref: "InChurch: 60" },
        { label: "Obrigatórias", valor: trilhas.filter((t) => t.obrigatoria).length },
        { label: "Economia anual", valor: "R$ 1.318,80", ref: "vs InChurch Jornadas" },
      ]}
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Nova trilha</h2>
        <form action={criarTrilha} className="space-y-4">
          <Field label="Título" required>
            <Input name="titulo" required placeholder="Boas-vindas" />
          </Field>
          <Field label="Descrição">
            <Textarea name="descricao" rows={2} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="obrigatoria" /> Trilha obrigatória pra novos convertidos
          </label>
          <Button type="submit">Criar trilha</Button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Trilhas cadastradas
        </h2>
        {trilhas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma trilha ainda.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {trilhas.map((t) => (
              <div key={t.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{t.titulo}</h3>
                  {t.obrigatoria && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                      Obrigatória
                    </span>
                  )}
                </div>
                {t.descricao && (
                  <p className="mt-1 text-sm text-muted-foreground">{t.descricao}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {t._count.pessoas} pessoas em andamento
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </ModuloShell>
  );
}
