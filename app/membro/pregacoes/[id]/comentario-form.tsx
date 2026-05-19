"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function ComentarioForm({ pregacaoId }: { pregacaoId: string }) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (texto.trim().length < 3) {
          setErro("Escreva pelo menos 3 caracteres.");
          return;
        }
        start(async () => {
          setErro(null);
          const r = await fetch(`/api/pregacoes/${pregacaoId}/comentar`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ texto }),
          });
          if (!r.ok) {
            const j = await r.json().catch(() => ({}));
            setErro(j?.erro ?? "Não foi possível enviar.");
            return;
          }
          setTexto("");
          setEnviado(true);
          router.refresh();
        });
      }}
      className="rounded-2xl border border-border bg-card p-4"
    >
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Compartilhe o que Deus falou com você nesta pregação…"
        rows={3}
        className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className={erro ? "text-destructive" : "text-muted-foreground"}>
          {erro
            ? erro
            : enviado
              ? "✓ enviado pra moderação"
              : "Será publicado após aprovação."}
        </span>
        <button
          disabled={pending || texto.trim().length === 0}
          className="rounded-full bg-primary px-4 py-1.5 font-medium text-primary-foreground disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </form>
  );
}
