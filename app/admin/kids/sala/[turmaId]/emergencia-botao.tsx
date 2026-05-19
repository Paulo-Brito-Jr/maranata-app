"use client";

import { useState, useTransition } from "react";
import { AlertTriangle } from "lucide-react";

export function EmergenciaBotao({
  turmaId,
  turmaLabel,
}: {
  turmaId: string;
  turmaLabel: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [resultado, setResultado] = useState<{
    avisados: number;
    enviados: number;
    ativos: number;
  } | null>(null);
  const [pending, start] = useTransition();

  return (
    <section className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-400" />
        <div className="flex-1">
          <p className="font-semibold text-red-200">Emergência</p>
          <p className="text-sm text-red-300/80">
            Dispara push pra todos os responsáveis das crianças em sala {turmaLabel}.
          </p>
        </div>
        {!aberto && (
          <button
            onClick={() => setAberto(true)}
            className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400"
          >
            Ativar
          </button>
        )}
      </div>

      {aberto && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await fetch(`/api/kids/emergencia/${turmaId}`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ mensagem: mensagem.trim() || undefined }),
              });
              const j = (await r.json()) as {
                avisados: number;
                enviados: number;
                ativos: number;
              };
              setResultado(j);
              setMensagem("");
            });
          }}
          className="mt-4 space-y-3"
        >
          <textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Mensagem (opcional)"
            rows={2}
            className="w-full rounded-lg border border-red-500/40 bg-background px-3 py-2 text-sm focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
            >
              {pending ? "Enviando…" : "Confirmar emergência"}
            </button>
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-secondary"
            >
              Cancelar
            </button>
          </div>
          {resultado && (
            <p className="text-sm text-emerald-300">
              ✓ {resultado.avisados} responsável(is) notificado(s) ({resultado.enviados}{" "}
              dispositivo(s), {resultado.ativos} criança(s) em sala).
            </p>
          )}
        </form>
      )}
    </section>
  );
}
