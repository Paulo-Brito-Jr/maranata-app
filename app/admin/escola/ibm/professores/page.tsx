import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { Field, Input, Textarea, Button, Select } from "@/components/ui/field";
import { criarProfessor } from "./actions";

export const metadata = { title: "Professores IBM" };
export const dynamic = "force-dynamic";

export default async function ProfessoresPage() {
  const [profs, membros] = await Promise.all([
    prisma.ibmProfessor.findMany({
      include: { _count: { select: { turmas: true } } },
      orderBy: { nome: "asc" },
    }),
    prisma.membro.findMany({
      where: { status: "ATIVO", ibmProfessor: null },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
      take: 500,
    }),
  ]);

  return (
    <ModuloShell
      titulo="Professores IBM"
      descricao="Corpo docente do seminário."
      stats={[
        { label: "Ativos", valor: profs.filter((p) => p.ativo).length },
        { label: "Total", valor: profs.length },
      ]}
      acoes={[{ href: "/admin/escola", label: "← Hub" }]}
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Novo professor</h2>
        <form action={criarProfessor} className="grid gap-3 md:grid-cols-2">
          <Field label="Nome" required>
            <Input name="nome" required maxLength={150} />
          </Field>
          <Field label="Vincular a membro (opcional)">
            <Select name="membroId">
              <option value="">Sem vínculo</option>
              {membros.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Titulação" className="md:col-span-2">
            <Input name="titulacao" placeholder="Mestre em Teologia, STBSB" />
          </Field>
          <Field label="Mini bio" className="md:col-span-2">
            <Textarea name="bio" rows={3} />
          </Field>
          <div className="md:col-span-2">
            <Button type="submit">Cadastrar</Button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Cadastrados ({profs.length})
        </h2>
        {profs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Cadastre o primeiro professor.</p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {profs.map((p) => (
              <li
                key={p.id}
                className="rounded-2xl border border-border bg-card p-4 text-sm"
              >
                <p className="font-semibold">{p.nome}</p>
                {p.titulacao && (
                  <p className="text-xs text-muted-foreground">{p.titulacao}</p>
                )}
                {p.bio && <p className="mt-2 text-xs text-muted-foreground">{p.bio}</p>}
                <p className="mt-2 text-xs">{p._count.turmas} turma(s)</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </ModuloShell>
  );
}
