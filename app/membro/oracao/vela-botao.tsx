"use client";

import { useState, useTransition } from "react";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function VelaBotao({
  pedidoId,
  totalInicial,
  ativoInicial,
}: {
  pedidoId: string;
  totalInicial: number;
  ativoInicial: boolean;
}) {
  const [ativo, setAtivo] = useState(ativoInicial);
  const [total, setTotal] = useState(totalInicial);
  const [pending, start] = useTransition();

  return (
    <button
      onClick={() =>
        start(async () => {
          const novo = !ativo;
          setAtivo(novo);
          setTotal((t) => t + (novo ? 1 : -1));
          const r = await fetch(`/api/oracao/${pedidoId}/vela`, {
            method: novo ? "POST" : "DELETE",
          });
          if (!r.ok) {
            setAtivo(!novo);
            setTotal((t) => t + (novo ? -1 : 1));
            return;
          }
          const j = (await r.json()) as { total: number };
          setTotal(j.total);
        })
      }
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition",
        ativo
          ? "bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/40"
          : "border border-border bg-card hover:bg-secondary",
      )}
    >
      <Flame
        className={cn(
          "size-3.5",
          ativo ? "text-amber-300" : "text-muted-foreground",
        )}
      />
      {ativo ? "Estou orando" : "Acender vela"}
      {total > 0 && <span className="text-muted-foreground">· {total}</span>}
    </button>
  );
}
