import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { brl } from "@/lib/utils";
import { Field, Input, Textarea, Button } from "@/components/ui/field";
import { criarProduto } from "../kids/actions";

export const metadata = { title: "Loja" };
export const dynamic = "force-dynamic";

export default async function LojaPage() {
  const [produtos, pedidos, faturamento] = await Promise.all([
    prisma.lojaProduto.findMany({
      orderBy: { criadoEm: "desc" },
      take: 50,
    }),
    prisma.lojaPedido.count(),
    prisma.lojaPedido.aggregate({
      _sum: { total: true },
      where: { status: "PAGO" },
    }),
  ]);

  return (
    <ModuloShell
      titulo="Loja Maranata"
      descricao="E-commerce próprio com white-label e dropshipping. Vinculado a pregações e jornadas."
      stats={[
        { label: "Produtos", valor: produtos.length },
        { label: "Pedidos", valor: pedidos },
        { label: "Faturamento", valor: brl(Number(faturamento._sum.total ?? 0)) },
        { label: "Economia anual", valor: "R$ 3.118,80", ref: "vs InChurch Loja" },
      ]}
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Novo produto</h2>
        <form action={criarProduto} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome" required>
              <Input name="nome" required placeholder="Devocional Diário 2026" />
            </Field>
            <Field label="Slug" required>
              <Input name="slug" required placeholder="devocional-diario-2026" />
            </Field>
          </div>
          <Field label="Preço (R$)" required>
            <Input type="number" step="0.01" min="0.01" name="preco" required />
          </Field>
          <Field label="Descrição">
            <Textarea name="descricao" rows={2} />
          </Field>
          <Button type="submit">Criar produto</Button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Produtos
        </h2>
        {produtos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum produto cadastrado.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {produtos.map((p) => (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-4">
                <h3 className="font-semibold">{p.nome}</h3>
                <p className="mt-1 text-lg font-bold">{brl(Number(p.preco))}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.status === "ATIVO" ? "✓ Ativo" : `Status: ${p.status.toLowerCase()}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </ModuloShell>
  );
}
