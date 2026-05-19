"use client";

import { useEffect, useState } from "react";

export function ProgressoTracker({
  pregacaoId,
  posicaoInicial,
  duracaoSeg,
  concluido,
}: {
  pregacaoId: string;
  posicaoInicial: number;
  duracaoSeg: number;
  concluido: boolean;
}) {
  const [posicao, setPosicao] = useState(posicaoInicial);

  useEffect(() => {
    if (concluido) return;
    const inicioPagina = Date.now();
    const id = window.setInterval(() => {
      const segNaPagina = Math.floor((Date.now() - inicioPagina) / 1000);
      const nova = Math.min(duracaoSeg, posicaoInicial + segNaPagina);
      setPosicao(nova);
      void fetch(`/api/pregacoes/${pregacaoId}/progresso`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ posicaoSeg: nova, concluido: nova >= duracaoSeg }),
      });
    }, 30_000); // a cada 30s
    return () => window.clearInterval(id);
  }, [concluido, duracaoSeg, posicaoInicial, pregacaoId]);

  const pct = Math.min(100, Math.round((posicao / duracaoSeg) * 100));

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Seu progresso</span>
        <span className="font-medium">
          {Math.floor(posicao / 60)}/{Math.floor(duracaoSeg / 60)}min ({pct}%)
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {concluido && (
        <p className="mt-2 text-xs text-emerald-300">✓ você já terminou esta pregação</p>
      )}
    </div>
  );
}
