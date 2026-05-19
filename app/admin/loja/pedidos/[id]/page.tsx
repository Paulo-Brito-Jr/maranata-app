import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { brl, dataPtBR } from "@/lib/utils";
import { Button } from "@/components/ui/field";
import { mudarStatusPedido } from "./actions";

export const dynamic = "force-dynamic";

const PROXIMO_STATUS: Record<string, { next: string; label: string }[]> = {
  AGUARDANDO_PAGAMENTO: [
    { next: "PAGO", label: "Marcar como pago" },
    { next: "CANCELADO", label: "Cancelar" },
  ],
  PAGO: [{ next: "EM_SEPARACAO", label: "Iniciar separação" }],
  EM_SEPARACAO: [{ next: "ENVIADO", label: "Marcar como enviado" }],
  ENVIADO: [{ next: "ENTREGUE", label: "Marcar como entregue" }],
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.lojaPedido.findUnique({ where: { id }, select: { numero: true } });
  return { title: p ? `Pedido #${p.numero}` : "Pedido" };
}

export default async function PedidoDetalhe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pedido = await prisma.lojaPedido.findUnique({
    where: { id },
    include: {
      itens: { include: { produto: { select: { nome: true, slug: true } } } },
      igreja: { select: { nome: true } },
    },
  });
  if (!pedido) notFound();

  const proximos = PROXIMO_STATUS[pedido.status] ?? [];
  const endereco =
    pedido.enderecoJson && typeof pedido.enderecoJson === "object"
      ? (pedido.enderecoJson as { endereco?: string }).endereco
      : null;

  return (
    <ModuloShell
      titulo={`Pedido #${pedido.numero}`}
      descricao={`${pedido.nome} · ${pedido.email}`}
      stats={[
        { label: "Status", valor: pedido.status },
        { label: "Total", valor: brl(Number(pedido.total)) },
        { label: "Itens", valor: pedido.itens.length },
        { label: "Criado", valor: dataPtBR(pedido.criadoEm) },
      ]}
      acoes={[{ href: "/admin/loja?aba=pedidos", label: "← Pedidos" }]}
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Itens</h2>
        <ul className="divide-y divide-border">
          {pedido.itens.map((i) => (
            <li key={i.id} className="flex items-center justify-between py-2 text-sm">
              <Link
                href={`/loja/${i.produto.slug}`}
                className="font-medium hover:text-primary"
              >
                {i.quantidade}× {i.produto.nome}
              </Link>
              <span className="font-mono">{brl(Number(i.total))}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 font-bold">
          <span>Total</span>
          <span>{brl(Number(pedido.total))}</span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 text-sm">
          <h2 className="mb-3 font-semibold">Contato</h2>
          <dl className="space-y-1">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Nome</dt>
              <dd className="font-medium">{pedido.nome}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">E-mail</dt>
              <dd>{pedido.email}</dd>
            </div>
            {pedido.telefone && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Telefone</dt>
                <dd>{pedido.telefone}</dd>
              </div>
            )}
            {pedido.documento && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Documento</dt>
                <dd>{pedido.documento}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 text-sm">
          <h2 className="mb-3 font-semibold">Entrega</h2>
          {endereco ? (
            <p className="whitespace-pre-wrap">{endereco}</p>
          ) : (
            <p className="text-muted-foreground">Retirada presencial.</p>
          )}
          {pedido.rastreamento && (
            <p className="mt-2 text-xs">
              Rastreio: <code>{pedido.rastreamento}</code>
            </p>
          )}
        </div>
      </section>

      {proximos.length > 0 && (
        <section className="flex flex-wrap gap-2">
          {proximos.map((p) => (
            <form key={p.next} action={mudarStatusPedido}>
              <input type="hidden" name="pedidoId" value={id} />
              <input type="hidden" name="status" value={p.next} />
              <Button type="submit">{p.label}</Button>
            </form>
          ))}
        </section>
      )}
    </ModuloShell>
  );
}
