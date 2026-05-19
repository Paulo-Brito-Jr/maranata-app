import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { brl } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";

export const metadata = { title: "Loja Maranata" };
export const dynamic = "force-dynamic";

function primeiraImagem(json: unknown): string | null {
  if (Array.isArray(json) && json[0] && typeof json[0] === "string") return json[0];
  return null;
}

export default async function LojaIndex() {
  const [produtos, categorias] = await Promise.all([
    prisma.lojaProduto.findMany({
      where: { status: "ATIVO" },
      include: { categoria: { select: { nome: true, slug: true } } },
      orderBy: { atualizadoEm: "desc" },
      take: 60,
    }),
    prisma.lojaCategoria.findMany({
      where: { ativa: true },
      orderBy: { ordem: "asc" },
    }),
  ]);

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
      <header className="text-center">
        <ShoppingBag className="mx-auto size-8 text-primary" />
        <h1 className="mt-3 text-3xl font-bold">Loja Maranata</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Materiais, livros, mídias e produtos do ministério.
        </p>
        <Link
          href="/loja/carrinho"
          className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
        >
          Ver carrinho
        </Link>
      </header>

      {categorias.length > 0 && (
        <nav className="flex flex-wrap justify-center gap-2 text-sm">
          {categorias.map((c) => (
            <Link
              key={c.id}
              href={`/loja?cat=${c.slug}`}
              className="rounded-full border border-border bg-card px-3 py-1 hover:border-primary/40"
            >
              {c.nome}
            </Link>
          ))}
        </nav>
      )}

      {produtos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
          Loja vazia por enquanto. Em breve novidades.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {produtos.map((p) => {
            const img = primeiraImagem(p.imagensJson);
            const preco = p.precoPromocional ?? p.preco;
            return (
              <li key={p.id}>
                <Link
                  href={`/loja/${p.slug}`}
                  className="block overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40"
                >
                  {img ? (
                    <div className="relative h-48 w-full bg-secondary">
                      <Image
                        src={img}
                        alt={p.nome}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-secondary text-4xl">
                      📦
                    </div>
                  )}
                  <div className="p-4">
                    {p.categoria && (
                      <p className="text-xs text-muted-foreground">{p.categoria.nome}</p>
                    )}
                    <p className="mt-1 font-semibold">{p.nome}</p>
                    <p className="mt-1 text-lg font-bold text-primary">{brl(Number(preco))}</p>
                    {p.precoPromocional && (
                      <p className="text-xs text-muted-foreground line-through">
                        {brl(Number(p.preco))}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
