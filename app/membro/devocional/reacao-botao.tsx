"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

export function ReacaoBotao({
  devocionalId,
  tipo,
  label,
  ativo: ativoInicial,
  contagem: contagemInicial,
}: {
  devocionalId: string;
  tipo: "amem" | "abencoado" | "orei";
  label: string;
  ativo: boolean;
  contagem: number;
}) {
  const [ativo, setAtivo] = useState(ativoInicial);
  const [contagem, setContagem] = useState(contagemInicial);
  const [pending, start] = useTransition();

  return (
    <button
      onClick={() =>
        start(async () => {
          const novo = !ativo;
          setAtivo(novo);
          setContagem((c) => c + (novo ? 1 : -1));
          const r = await fetch(`/api/devocional/${devocionalId}/reacao`, {
            method: novo ? "POST" : "DELETE",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ tipo }),
          });
          if (!r.ok) {
            setAtivo(!novo);
            setContagem((c) => c + (novo ? -1 : 1));
          }
        })
      }
      disabled={pending}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-xs transition",
        ativo
          ? "bg-primary/15 text-primary ring-1 ring-primary/30"
          : "text-muted-foreground hover:bg-secondary",
      )}
    >
      <span className="font-medium">{label}</span>
      <span className="text-[10px] opacity-80">{contagem}</span>
    </button>
  );
}
