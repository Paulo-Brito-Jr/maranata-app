import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { Field, Input, Select, Button } from "@/components/ui/field";
import { getIgrejaContexto, filtroIgrejaWhere } from "@/lib/igreja-contexto";
import { criarTurma, alternarTurma } from "./actions";

export const metadata = { title: "Turmas Kids" };
export const dynamic = "force-dynamic";

export default async function TurmasPage() {
  const ctx = await getIgrejaContexto({ ministerioPagina: "KIDS" });
  const filtroIgreja = filtroIgrejaWhere(ctx);

  const [turmas, igrejas] = await Promise.all([
    prisma.kidsTurma.findMany({
      where: filtroIgreja,
      include: {
        igreja: { select: { nome: true } },
        _count: { select: { checkins: { where: { saidaEm: null } } } },
      },
      orderBy: [{ ativa: "desc" }, { nome: "asc" }],
    }),
    prisma.igreja.findMany({
      where: { ativa: true, tipo: "CONGREGACAO" as const },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <ModuloShell
      titulo="Turmas Kids"
      descricao="Crie salas por faixa etária. Cada criança vai pra turma compatível no check-in."
      stats={[
        { label: "Turmas ativas", valor: turmas.filter((t) => t.ativa).length },
        { label: "Inativas", valor: turmas.filter((t) => !t.ativa).length },
      ]}
      acoes={[{ href: "/admin/kids", label: "← Voltar" }]}
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Nova turma</h2>
        <form action={criarTurma} className="grid gap-3 md:grid-cols-2">
          <Field label="Nome" required>
            <Input name="nome" required placeholder="Ex: Maternal Sala A" />
          </Field>
          <Field label="Igreja" required>
            <Select name="igrejaId" required>
              <option value="">Selecione</option>
              {igrejas.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Faixa etária" required>
            <Select name="faixaEtaria" required>
              <option value="BERCARIO">Berçário (0-2)</option>
              <option value="MATERNAL">Maternal (3-5)</option>
              <option value="KIDS_1">Kids 1 (6-8)</option>
              <option value="KIDS_2">Kids 2 (9-11)</option>
            </Select>
          </Field>
          <Field label="Sala (opcional)">
            <Input name="sala" placeholder="Ex: 12" />
          </Field>
          <Field label="Capacidade" hint="Número máximo de crianças.">
            <Input type="number" name="capacidade" min={1} max={200} />
          </Field>
          <div className="flex items-end">
            <Button type="submit">Criar turma</Button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Turmas existentes
        </h2>
        {turmas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma turma ainda.</p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {turmas.map((t) => (
              <li
                key={t.id}
                className={`rounded-2xl border bg-card p-4 ${t.ativa ? "border-border" : "border-dashed opacity-60"}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{t.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.igreja.nome} · {t.faixaEtaria}
                      {t.sala && ` · sala ${t.sala}`}
                    </p>
                    {t._count.checkins > 0 && (
                      <p className="mt-1 text-xs text-emerald-300">
                        {t._count.checkins} em sala agora
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 text-right text-xs">
                    <Link
                      href={`/admin/kids/sala/${t.id}`}
                      className="text-primary underline"
                    >
                      ver sala
                    </Link>
                    <form action={alternarTurma.bind(null, t.id)}>
                      <button className="text-muted-foreground hover:text-foreground">
                        {t.ativa ? "desativar" : "ativar"}
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </ModuloShell>
  );
}
