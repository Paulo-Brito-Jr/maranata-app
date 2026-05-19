"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function FavoritarBotao({
  pregacaoId,
  favoritoInicial,
  contagem: contagemInicial,
}: {
  pregacaoId: string;
  favoritoInicial: boolean;
  contagem: number;
}) {
  const [favorito, setFavorito] = useState(favoritoInicial);
  const [contagem, setContagem] = useState(contagemInicial);
  const [pending, start] = useTransition();

  return (
    <button
      onClick={() =>
        start(async () => {
          const novo = !favorito;
          setFavorito(novo);
          setContagem((c) => c + (novo ? 1 : -1));
          const r = await fetch(`/api/pregacoes/${pregacaoId}/favoritar`, {
            method: novo ? "POST" : "DELETE",
          });
          if (!r.ok) {
            setFavorito(!novo);
            setContagem((c) => c + (novo ? -1 : 1));
          }
        })
      }
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition",
        favorito
          ? "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/40"
          : "border border-border bg-card hover:bg-secondary",
      )}
    >
      <Heart className={cn("size-3.5", favorito && "fill-current")} />
      {favorito ? "Favoritada" : "Favoritar"}
      {contagem > 0 && <span className="text-muted-foreground">· {contagem}</span>}
    </button>
  );
}
