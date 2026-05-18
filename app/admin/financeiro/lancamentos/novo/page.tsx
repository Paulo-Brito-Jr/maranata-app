import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Field, Input, Select, Textarea, Button } from "@/components/ui/field";
import { criarLancamento } from "../../actions";

export const metadata = { title: "Novo lançamento" };

export default async function NovoLancamentoPage() {
  const [igrejas, categorias, contas] = await Promise.all([
    prisma.igreja.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    prisma.categoriaFinanceira.findMany({ orderBy: { nome: "asc" } }),
    prisma.contaBancaria.findMany({
      where: { ativa: true },
      orderBy: { nome: "asc" },
      include: { igreja: { select: { nome: true } } },
    }),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <Link
          href="/admin/financeiro/lancamentos"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          ← Voltar
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Novo lançamento</h1>
      </header>

      <form action={criarLancamento} className="space-y-5 rounded-2xl border border-border bg-card p-6">
        <Field label="Tipo" required>
          <Select name="tipo" required defaultValue="ENTRADA">
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
              placeholder="0,00"
              required
            />
          </Field>
          <Field label="Data" required>
            <Input type="date" name="data" defaultValue={today} required />
          </Field>
        </div>

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

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Categoria">
            <Select name="categoriaId" defaultValue="">
              <option value="">Sem categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} ({c.tipo === "ENTRADA" ? "+" : "-"})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Conta bancária">
            <Select name="contaId" defaultValue="">
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
            <Select name="formaPagamento" defaultValue="">
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
            <Select name="status" defaultValue="CONCILIADO">
              <option value="PENDENTE">Pendente</option>
              <option value="CONCILIADO">Conciliado</option>
              <option value="CANCELADO">Cancelado</option>
            </Select>
          </Field>
        </div>

        <Field label="Descrição">
          <Textarea name="descricao" rows={2} />
        </Field>

        <Button type="submit">Lançar</Button>
      </form>
    </div>
  );
}
