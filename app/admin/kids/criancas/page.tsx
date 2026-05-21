import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { Field, Input, Select, Button } from "@/components/ui/field";
import { dataPtBR } from "@/lib/utils";
import { getIgrejaContexto, filtroIgrejaWhere } from "@/lib/igreja-contexto";
import { criarCrianca } from "../actions";

export const metadata = { title: "Crianças Kids" };
export const dynamic = "force-dynamic";

export default async function CriancasPage() {
  const ctx = await getIgrejaContexto({ ministerioPagina: "KIDS" });
  const filtroIgreja = filtroIgrejaWhere(ctx);

  const [criancas, igrejas, total] = await Promise.all([
    prisma.kidsCrianca.findMany({
      where: filtroIgreja,
      include: {
        igreja: { select: { nome: true } },
        responsaveis: { where: { principal: true }, take: 1 },
      },
      orderBy: { nome: "asc" },
      take: 100,
    }),
    prisma.igreja.findMany({
      where: { ativa: true, tipo: "CONGREGACAO" as const },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.kidsCrianca.count({ where: filtroIgreja }),
  ]);

  return (
    <ModuloShell
      titulo="Crianças"
      descricao="Cadastro completo com alergias, restrições e responsáveis. Necessário pro check-in."
      stats={[
        { label: "Total", valor: total },
        { label: "Ativas", valor: criancas.filter((c) => c.ativa).length },
      ]}
      acoes={[{ href: "/admin/kids", label: "← Voltar" }]}
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Nova criança</h2>
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
            <Field label="Nome do responsável principal" required>
              <Input name="nomeResp" required />
            </Field>
            <Field label="Telefone do responsável">
              <Input type="tel" name="telefoneResp" />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="autorizaImagem" /> Autorizo uso de imagem em redes
            sociais da Maranata
          </label>
          <Button type="submit">Cadastrar criança</Button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Cadastradas ({criancas.length})
        </h2>
        {criancas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma criança cadastrada ainda.</p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {criancas.map((c) => (
              <li
                key={c.id}
                className={`rounded-2xl border bg-card p-4 ${
                  c.alergias ? "border-red-500/30 ring-1 ring-red-500/10" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Link
                    href={`/admin/kids/checkin?crianca=${c.id}`}
                    className="font-medium hover:text-primary"
                  >
                    {c.nome}
                  </Link>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                    {c.faixaEtaria}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {c.igreja.nome} · {dataPtBR(c.dataNascimento)}
                </div>
                {c.alergias && (
                  <p className="mt-1 text-xs font-medium text-red-300">⚠ {c.alergias}</p>
                )}
                {c.responsaveis[0] && (
                  <p className="mt-1 text-xs">Resp.: {c.responsaveis[0].nome}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </ModuloShell>
  );
}
