"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          events?: {
            onReady?: (event: { target: YouTubePlayer }) => void;
            onStateChange?: (event: {
              data: number;
              target: YouTubePlayer;
            }) => void;
          };
        },
      ) => YouTubePlayer;
      PlayerState: { PLAYING: number; ENDED: number; PAUSED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YouTubePlayer = {
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
};

/**
 * Tracker de progresso de pregação.
 *
 * Quando `youtubeId` está presente, usa a YouTube IFrame API pra capturar
 * `getCurrentTime()` a cada 30s (durante reprodução) e dispara POST no
 * endpoint de progresso. Quando não há youtubeId, usa um fallback temporal
 * (relógio da página).
 */
export function ProgressoTracker({
  pregacaoId,
  posicaoInicial,
  duracaoSeg,
  concluido,
  youtubeId,
}: {
  pregacaoId: string;
  posicaoInicial: number;
  duracaoSeg: number;
  concluido: boolean;
  youtubeId?: string | null;
}) {
  const [posicao, setPosicao] = useState(posicaoInicial);
  const [terminou, setTerminou] = useState(concluido);
  const ultimoEnvio = useRef<number>(posicaoInicial);

  // Envia progresso pro backend (dedup: só envia se diferença ≥ 10s ou concluído mudou)
  const salvar = useRef(async (pos: number, conclude: boolean) => {
    if (!conclude && Math.abs(pos - ultimoEnvio.current) < 10) return;
    ultimoEnvio.current = pos;
    try {
      await fetch(`/api/pregacoes/${pregacaoId}/progresso`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          posicaoSeg: Math.max(0, Math.min(duracaoSeg, Math.floor(pos))),
          concluido: conclude,
        }),
      });
    } catch {
      /* offline-tolerant */
    }
  });

  // Fallback temporal quando não há YouTube ID
  useEffect(() => {
    if (youtubeId) return;
    if (terminou) return;
    const inicio = Date.now();
    const id = window.setInterval(() => {
      const seg = Math.floor((Date.now() - inicio) / 1000);
      const nova = Math.min(duracaoSeg, posicaoInicial + seg);
      setPosicao(nova);
      const conclude = nova >= duracaoSeg;
      if (conclude) setTerminou(true);
      void salvar.current(nova, conclude);
    }, 30_000);
    return () => window.clearInterval(id);
  }, [duracaoSeg, posicaoInicial, terminou, youtubeId]);

  // YouTube IFrame API: hooks no player existente (id = `yt-player-${pregacaoId}`)
  useEffect(() => {
    if (!youtubeId) return;
    const elementId = `yt-player-${pregacaoId}`;

    let player: YouTubePlayer | undefined;
    let pollId: number | undefined;
    let cancelled = false;

    const wireUp = () => {
      if (cancelled || !window.YT?.Player) return;
      const el = document.getElementById(elementId);
      if (!el) return;
      player = new window.YT.Player(elementId, {
        events: {
          onStateChange: (event) => {
            const playing = event.data === window.YT?.PlayerState.PLAYING;
            const ended = event.data === window.YT?.PlayerState.ENDED;
            if (ended) {
              setTerminou(true);
              setPosicao(duracaoSeg);
              void salvar.current(duracaoSeg, true);
              return;
            }
            // Liga/desliga polling de tempo conforme estado
            if (playing && pollId === undefined) {
              pollId = window.setInterval(() => {
                if (!player) return;
                const t = Math.floor(player.getCurrentTime());
                setPosicao((prev) => (Math.abs(t - prev) > 1 ? t : prev));
                const conclude = duracaoSeg > 0 && t >= duracaoSeg - 1;
                if (conclude) setTerminou(true);
                void salvar.current(t, conclude);
              }, 30_000);
            } else if (!playing && pollId !== undefined) {
              window.clearInterval(pollId);
              pollId = undefined;
              // grava posição na pausa
              if (player) {
                const t = Math.floor(player.getCurrentTime());
                void salvar.current(t, false);
              }
            }
          },
        },
      });
    };

    // Carrega script da API só uma vez
    if (window.YT?.Player) {
      wireUp();
    } else {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src="https://www.youtube.com/iframe_api"]',
      );
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        wireUp();
      };
      if (!existing) {
        const s = document.createElement("script");
        s.src = "https://www.youtube.com/iframe_api";
        s.async = true;
        document.head.appendChild(s);
      }
    }

    return () => {
      cancelled = true;
      if (pollId !== undefined) window.clearInterval(pollId);
      try {
        player?.destroy();
      } catch {
        /* ignore */
      }
    };
  }, [duracaoSeg, pregacaoId, youtubeId]);

  const pct =
    duracaoSeg > 0
      ? Math.min(100, Math.round((posicao / duracaoSeg) * 100))
      : 0;

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
      {terminou && (
        <p className="mt-2 text-xs text-emerald-300">
          ✓ você já terminou esta pregação
        </p>
      )}
    </div>
  );
}
