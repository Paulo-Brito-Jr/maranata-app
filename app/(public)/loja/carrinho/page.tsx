import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { lerCarrinho } from "@/lib/carrinho";
import { brl } from "@/lib/utils";
import { Field, Input, Textarea, Button } from "@/components/ui/field";
import { removerDoCarrinho, finalizarPedido } from "./actions";

export const metadata = { title: "Carrinho" };
export const dynamic = "force-dynamic";

const FRETE_FIXO = 15;

export default async function CarrinhoPage() {
  const itens = await lerCarrinho();
  if (itens.length === 0) {
    return (
      <main className="mx-auto max-w-md space-y-6 px-6 py-12 text-center">
        <h1 className="text-2xl font-bold">Carrinho vazio</h1>
        <p className="text-sm text-muted-foreground">
          Adicione produtos da loja pra continuar.
        </p>
        <Link
          href="/loja"
          className="inline-block rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
        >
          Ir pra loja
        </Link>
      </main>
    );
  }

  const produtos = await prisma.lojaProduto.findMany({
    where: { id: { in: itens.map((i) => i.produtoId) } },
    select: {
      id: true,
      nome: true,
      slug: true,
      preco: true,
      precoPromocional: true,
      estoque: true,
    },
  });
  const mapa = new Map(produtos.map((p) => [p.id, p]));

  const linhas = itens.map((i) => {
    const p = mapa.get(i.produtoId);
    const preco = p ? Number(p.precoPromocional ?? p.preco) : 0;
    const total = preco * i.quantidade;
    return { i, p, preco, total };
  });
  const subtotal = linhas.reduce((a, l) => a + l.total, 0);
  const total = subtotal + FRETE_FIXO;

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-10">
      <Link href="/loja" className="text-xs text-muted-foreground hover:text-foreground">
        ← Loja
      </Link>

      <h1 className="text-2xl font-bold">Seu carrinho</h1>

      <ul className="space-y-2">
        {linhas.map(({ i, p, preco, total }) => (
          <li
            key={i.produtoId}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
          >
            <div className="min-w-0 flex-1">
              {p ? (
                <Link href={`/loja/${p.slug}`} className="font-medium hover:text-primary">
                  {p.nome}
                </Link>
              ) : (
                <span className="text-muted-foreground">Produto removido</span>
              )}
              <p className="text-xs text-muted-foreground">
                {i.quantidade} × {brl(preco)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{brl(total)}</p>
              <form action={removerDoCarrinho.bind(null, i.produtoId)}>
                <button className="text-xs text-destructive hover:underline">remover</button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      <div className="space-y-1 border-t border-border pt-4 text-sm">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="font-mono">{brl(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Frete (fixo)</span>
          <span className="font-mono">{brl(FRETE_FIXO)}</span>
        </div>
        <div className="flex items-center justify-between pt-1 text-lg font-bold">
          <span>Total</span>
          <span>{brl(total)}</span>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Finalizar pedido</h2>
        <form action={finalizarPedido} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nome" required>
              <Input name="nome" required maxLength={120} />
            </Field>
            <Field label="E-mail" required>
              <Input type="email" name="email" required />
            </Field>
            <Field label="Telefone">
              <Input type="tel" name="telefone" />
            </Field>
            <Field label="Documento (CPF)">
              <Input name="documento" />
            </Field>
            <Field label="CEP" required>
              <Input
                name="cep"
                required
                inputMode="numeric"
                pattern="\d{5}-?\d{3}"
                placeholder="00000-000"
              />
            </Field>
            <Field label="Cidade / UF">
              <Input name="cidadeUf" placeholder="Rio de Janeiro / RJ" />
            </Field>
          </div>
          <Field label="Endereço completo" required hint="Rua, número, complemento, bairro.">
            <Textarea name="endereco" rows={2} required />
          </Field>
          <Button type="submit">
            Finalizar e pagar via PIX ({brl(total)})
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Você receberá link de pagamento Safe2Pay (PIX/cartão) e atualização por e-mail.
          </p>
        </form>
      </section>
    </main>
  );
}
