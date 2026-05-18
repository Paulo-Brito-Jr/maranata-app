import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { dataPtBR } from "@/lib/utils";
import { Field, Input, Select, Button } from "@/components/ui/field";
import { criarCrianca } from "./actions";

export const metadata = { title: "Kids" };
export const dynamic = "force-dynamic";

export default async function KidsPage() {
  const [criancas, turmas, checkinsHoje, igrejas] = await Promise.all([
    prisma.kidsCrianca.findMany({
      include: {
        igreja: { select: { nome: true } },
        responsaveis: { where: { principal: true }, take: 1 },
      },
      orderBy: { nome: "asc" },
      take: 50,
    }),
    prisma.kidsTurma.count({ where: { ativa: true } }),
    prisma.kidsCheckin.count({
      where: { entradaEm: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
    prisma.igreja.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
  ]);

  return (
    <ModuloShell
      titulo="Kids"
      descricao="Check-in/out via QR, etiquetas com alergias, autorização de imagem, turmas por faixa etária."
      stats={[
        { label: "Crianças cadastradas", valor: criancas.length },
        { label: "Turmas ativas", valor: turmas },
        { label: "Check-ins hoje", valor: checkinsHoje },
        { label: "Economia anual", valor: "R$ 718,80", ref: "vs InChurch Kids" },
      ]}
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Cadastrar criança</h2>
        <form action={criarCrianca} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome" required>
              <Input name="nome" required />
            </Field>
            <Field label="Igreja" required>
              <Select name="igrejaId" required>
                <option value="">Selecione...</option>
                {igrejas.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nome}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Data de nascimento" required>
              <Input type="date" name="dataNascimento" required />
            </Field>
            <Field label="Faixa etária" required>
              <Select name="faixaEtaria" required>
                <option value="BERCARIO">Berçário (0-2)</option>
                <option value="MATERNAL">Maternal (3-5)</option>
                <option value="KIDS_1">Kids 1 (6-8)</option>
                <option value="KIDS_2">Kids 2 (9-11)</option>
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Alergias">
              <Input name="alergias" placeholder="Ex: amendoim, lactose..." />
            </Field>
            <Field label="Restrições alimentares">
              <Input name="restricoesAlim" />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome do responsável" required>
              <Input name="nomeResp" required />
            </Field>
            <Field label="Telefone do responsável">
              <Input type="tel" name="telefoneResp" />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="autorizaImagem" /> Autorizo uso de imagem
          </label>
          <Button type="submit">Cadastrar criança</Button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Crianças cadastradas
        </h2>
        {criancas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma criança ainda.</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {criancas.map((c) => (
              <div key={c.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{c.nome}</span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                    {c.faixaEtaria.toLowerCase()}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {c.igreja.nome} · {dataPtBR(c.dataNascimento)}
                  {c.alergias && <span className="ml-2 text-destructive">⚠ {c.alergias}</span>}
                </div>
                {c.responsaveis[0] && (
                  <div className="mt-1 text-xs">Resp.: {c.responsaveis[0].nome}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </ModuloShell>
  );
}
