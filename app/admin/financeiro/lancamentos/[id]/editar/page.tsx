import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Field, Input, Select, Textarea, Button } from "@/components/ui/field";
import { atualizarLancamento, deletarLancamento } from "../../../actions";

export const metadata = { title: "Editar lançamento" };
export const dynamic = "force-dynamic";

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function EditarLancamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [lanc, igrejas, categorias, contas] = await Promise.all([
    prisma.lancamentoFinanceiro.findUnique({ where: { id } }),
    prisma.igreja.findMany({
      where: { ativa: true },
      select: { id: true, nome: true, tipo: true },
      orderBy: [{ tipo: "asc" }, { nome: "asc" }],
    }),
    prisma.categoriaFinanceira.findMany({ orderBy: { nome: "asc" } }),
    prisma.contaBancaria.findMany({
      where: { ativa: true },
      orderBy: { nome: "asc" },
      include: { igreja: { select: { nome: true } } },
    }),
  ]);
  if (!lanc) notFound();

  const atualizarComId = atualizarLancamento.bind(null, id);
  const excluirComId = deletarLancamento.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <Link
            href="/admin/financeiro/lancamentos"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            ← Lançamentos
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Editar lançamento</h1>
        </div>
        <form action={excluirComId}>
          <button
            type="submit"
            className="rounded-full bg-red-500/10 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-500/20 dark:text-red-400"
          >
            Excluir
          </button>
        </form>
      </header>

      <form action={atualizarComId} className="space-y-5 rounded-2xl border border-border bg-card p-6">
        <Field label="Tipo" required>
          <Select name="tipo" required defaultValue={lanc.tipo}>
            <option value="ENTRADA">Entrada</option>
            <option value="SAIDA">Saída</option>
          </Select>
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Valor" required>
            <Input
              type="number"
              step="0.01"
              min="0"
              name="valor"
              required
              defaultValue={String(lanc.valor)}
            />
          </Field>
          <Field label="Data" required>
            <Input type="date" name="data" required defaultValue={ymd(lanc.data)} />
          </Field>
        </div>
        <Field label="Igreja" required>
          <Select name="igrejaId" required defaultValue={lanc.igrejaId}>
            {igrejas.map((i) => (
              <option key={i.id} value={i.id}>{i.nome}{i.tipo === "SEDE" ? " (Sede)" : ""}</option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Categoria">
            <Select name="categoriaId" defaultValue={lanc.categoriaId ?? ""}>
              <option value="">Sem categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nome} ({c.tipo === "ENTRADA" ? "+" : "-"})</option>
              ))}
            </Select>
          </Field>
          <Field label="Conta bancária">
            <Select name="contaId" defaultValue={lanc.contaId ?? ""}>
              <option value="">Sem conta</option>
              {contas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} {c.igreja && `(${c.igreja.nome})`}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Forma de pagamento">
            <Select name="formaPagamento" defaultValue={lanc.formaPagamento ?? ""}>
              <option value="">—</option>
              <option value="DINHEIRO">Dinheiro</option>
              <option value="PIX">PIX</option>
              <option value="CARTAO_CREDITO">Cartão de crédito</option>
              <option value="CARTAO_DEBITO">Cartão de débito</option>
              <option value="BOLETO">Boleto</option>
              <option value="TRANSFERENCIA">Transferência</option>
              <option value="OFERTA">Oferta</option>
            </Select>
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue={lanc.status}>
              <option value="PENDENTE">Pendente</option>
              <option value="CONCILIADO">Conciliado</option>
              <option value="CANCELADO">Cancelado</option>
            </Select>
          </Field>
        </div>
        <Field label="Descrição">
          <Textarea name="descricao" rows={2} defaultValue={lanc.descricao ?? ""} />
        </Field>
        <Button type="submit">Salvar alterações</Button>
      </form>
    </div>
  );
}
