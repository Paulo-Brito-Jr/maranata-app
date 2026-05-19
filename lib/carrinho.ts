/**
 * Carrinho de compra persistido em cookie HTTP-only.
 * Estrutura: [{ produtoId, quantidade }]
 */
import { cookies } from "next/headers";

export const CARRINHO_COOKIE = "maranata_carrinho";

export type ItemCarrinho = { produtoId: string; quantidade: number };

export async function lerCarrinho(): Promise<ItemCarrinho[]> {
  const store = await cookies();
  const raw = store.get(CARRINHO_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ItemCarrinho[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x) =>
        typeof x === "object" &&
        typeof x.produtoId === "string" &&
        Number.isInteger(x.quantidade) &&
        x.quantidade > 0,
    );
  } catch {
    return [];
  }
}

export async function salvarCarrinho(itens: ItemCarrinho[]): Promise<void> {
  const store = await cookies();
  store.set(CARRINHO_COOKIE, JSON.stringify(itens), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function limparCarrinho(): Promise<void> {
  const store = await cookies();
  store.set(CARRINHO_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
