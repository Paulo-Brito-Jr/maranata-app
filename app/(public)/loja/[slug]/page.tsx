import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { brl } from "@/lib/utils";
import { adicionarAoCarrinho } from "./actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await prisma.lojaProduto.findUnique({ where: { slug }, select: { nome: true } });
  return { title: p?.nome ?? "Produto" };
}

function primeiraImagem(json: unknown): string | null {
  if (Array.isArray(json) && json[0] && typeof json[0] === "string") return json[0];
  return null;
}

export default async function ProdutoDetalhe({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const produto = await prisma.lojaProduto.findUnique({
    where: { slug },
    include: { categoria: { select: { nome: true } } },
  });
  if (!produto || produto.status !== "ATIVO") notFound();

  const img = primeiraImagem(produto.imagensJson);
  const preco = produto.precoPromocional ?? produto.preco;

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <Link href="/loja" className="text-xs text-muted-foreground hover:text-foreground">
        ← Loja
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-secondary">
          {img ? (
            <Image src={img} alt={produto.nome} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-6xl">📦</div>
          )}
        </div>

        <div className="space-y-4">
          {produto.categoria && (
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {produto.categoria.nome}
            </p>
          )}
          <h1 className="text-3xl font-bold">{produto.nome}</h1>

          <div>
            <p className="text-3xl font-bold text-primary">{brl(Number(preco))}</p>
            {produto.precoPromocional && (
              <p className="text-sm text-muted-foreground line-through">
                de {brl(Number(produto.preco))}
              </p>
            )}
          </div>

          {produto.descricao && (
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {produto.descricao}
            </p>
          )}

          {produto.estoque !== null && (
            <p className="text-xs text-muted-foreground">
              {produto.estoque > 0
                ? `${produto.estoque} unidade(s) em estoque`
                : "Sem estoque"}
            </p>
          )}

          <form action={adicionarAoCarrinho} className="flex gap-2">
            <input type="hidden" name="produtoId" value={produto.id} />
            <input
              type="number"
              name="quantidade"
              defaultValue={1}
              min={1}
              max={produto.estoque ?? 99}
              className="w-20 rounded-xl border border-input bg-background px-3 py-2 text-center"
            />
            <button className="flex-1 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">
              Adicionar ao carrinho
            </button>
          </form>

          <Link
            href="/loja/carrinho"
            className="block text-center text-xs text-muted-foreground hover:text-foreground"
          >
            ver carrinho →
          </Link>
        </div>
      </div>
    </main>
  );
}
