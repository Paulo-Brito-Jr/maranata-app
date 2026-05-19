import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { brl, dataPtBR } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export const metadata = { title: "Pedido recebido" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  CARRINHO: "Carrinho",
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PAGO: "Pago",
  EM_SEPARACAO: "Em separação",
  ENVIADO: "Enviado",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
  REEMBOLSADO: "Reembolsado",
};

export default async function PedidoConfirmado({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pedido = await prisma.lojaPedido.findUnique({
    where: { id },
    include: { itens: { include: { produto: { select: { nome: true } } } } },
  });
  if (!pedido) notFound();

  return (
    <main className="mx-auto max-w-xl space-y-6 px-6 py-12">
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-400" />
        <h1 className="mt-3 text-2xl font-bold">Pedido recebido!</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pedido #{pedido.numero} · {STATUS_LABEL[pedido.status] ?? pedido.status}
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Resumo</h2>
        <ul className="divide-y divide-border">
          {pedido.itens.map((i) => (
            <li key={i.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                {i.quantidade}× {i.produto.nome}
              </span>
              <span className="font-mono">{brl(Number(i.total))}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 font-bold">
          <span>Total</span>
          <span>{brl(Number(pedido.total))}</span>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 text-sm text-amber-200">
        <p className="font-semibold">Pagamento via PIX</p>
        <p className="mt-1 text-amber-300/80">
          O link de pagamento Safe2Pay vai chegar no seu e-mail <strong>{pedido.email}</strong>.
          Em breve a integração real (creds Safe2Pay) entra em produção.
        </p>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Criado em {dataPtBR(pedido.criadoEm)} ·{" "}
        <Link href="/loja" className="text-primary underline">
          continuar comprando
        </Link>
      </p>
    </main>
  );
}
