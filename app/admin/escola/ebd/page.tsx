import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { Field, Input, Select, Textarea, Button } from "@/components/ui/field";
import { criarClasseEbd } from "./actions";
import { dataPtBR } from "@/lib/utils";

export const metadata = { title: "Classes EBD" };
export const dynamic = "force-dynamic";

function cicloPadrao(): string {
  const ano = new Date().getFullYear();
  const mes = new Date().getMonth();
  const trim = Math.floor(mes / 3) + 1;
  return `${ano}.T${trim}`;
}

export default async function EbdClassesPage() {
  const [classes, igrejas] = await Promise.all([
    prisma.ebdClasse.findMany({
      include: {
        igreja: { select: { nome: true } },
        _count: { select: { inscricoes: { where: { status: "ATIVA" } }, aulas: true } },
      },
      orderBy: [{ ativa: "desc" }, { ciclo: "desc" }, { nome: "asc" }],
    }),
    prisma.igreja.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
  ]);

  return (
    <ModuloShell
      titulo="Classes EBD"
      descricao="Cada aluno se inscreve em 1 classe por ciclo trimestral. Sem notas formais — só presença."
      stats={[
        { label: "Classes ativas", valor: classes.filter((c) => c.ativa).length },
        { label: "Total inscritos", valor: classes.reduce((a, c) => a + c._count.inscricoes, 0) },
      ]}
      acoes={[{ href: "/admin/escola", label: "← Hub" }]}
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Nova classe</h2>
        <form action={criarClasseEbd} className="grid gap-4 md:grid-cols-2">
          <Field label="Nome da classe" required>
            <Input name="nome" required placeholder="Ex.: Adultos — Cartas Paulinas" />
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
          <Field label="Faixa">
            <Select name="faixa" defaultValue="ADULTOS">
              <option value="BERCARIO">Berçário</option>
              <option value="CRIANCAS">Crianças (4-7)</option>
              <option value="PRE_ADOLESCENTES">Pré-adolescentes (8-11)</option>
              <option value="ADOLESCENTES">Adolescentes (12-15)</option>
              <option value="JOVENS">Jovens (16-29)</option>
              <option value="ADULTOS">Adultos</option>
              <option value="CASAIS">Casais</option>
              <option value="LIDERES">Líderes</option>
              <option value="TERCEIRA_IDADE">Terceira idade</option>
              <option value="GERAL">Geral</option>
            </Select>
          </Field>
          <Field label="Professor principal">
            <Input name="professorPrincipal" placeholder="Nome do professor" />
          </Field>
          <Field label="Sala">
            <Input name="sala" placeholder="Ex.: Sala 5" />
          </Field>
          <Field label="Ciclo" required hint={`Padrão: ${cicloPadrao()} (trimestre atual).`}>
            <Input name="ciclo" defaultValue={cicloPadrao()} required maxLength={20} />
          </Field>
          <Field label="Capacidade">
            <Input type="number" name="capacidade" min={1} max={500} />
          </Field>
          <Field label="Descrição" className="md:col-span-2">
            <Textarea
              name="descricao"
              rows={2}
              placeholder="Sobre o conteúdo do ciclo…"
            />
          </Field>
          <div className="md:col-span-2">
            <Button type="submit">Criar classe</Button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Classes ({classes.length})
        </h2>
        {classes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma classe ainda.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {classes.map((c) => (
              <li
                key={c.id}
                className={`rounded-2xl border bg-card p-4 ${
                  c.ativa ? "border-border" : "border-dashed opacity-60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      href={`/admin/escola/ebd/${c.id}`}
                      className="font-semibold hover:text-primary"
                    >
                      {c.nome}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {c.igreja.nome} · {c.faixa} · ciclo {c.ciclo}
                      {c.sala && ` · sala ${c.sala}`}
                    </p>
                    {c.professorPrincipal && (
                      <p className="text-xs text-muted-foreground">
                        Prof. {c.professorPrincipal}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold">{c._count.inscricoes} alunos</p>
                    <p className="text-muted-foreground">{c._count.aulas} aulas</p>
                  </div>
                </div>
                {c.descricao && (
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {c.descricao}
                  </p>
                )}
                <div className="mt-3 text-xs">
                  <Link
                    href={`/admin/escola/ebd/${c.id}/chamada`}
                    className="text-primary underline"
                  >
                    fazer chamada
                  </Link>
                  {" · "}
                  <span className="text-muted-foreground">
                    criada em {dataPtBR(c.criadoEm)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </ModuloShell>
  );
}
