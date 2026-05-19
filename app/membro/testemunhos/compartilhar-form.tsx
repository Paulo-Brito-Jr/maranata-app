"use client";

import { useState } from "react";

export function CompartilharTestemunho() {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "erro">("idle");
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (texto.trim().length < 20) {
      setErro("Conta um pouquinho mais (pelo menos 20 caracteres).");
      return;
    }
    setBusy(true);
    setErro(null);
    try {
      const resp = await fetch("/api/testemunhos/criar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ texto: texto.trim() }),
      });
      if (!resp.ok) {
        const d = await resp.json().catch(() => ({}));
        throw new Error(d.erro ?? "Falha ao enviar");
      }
      setStatus("ok");
      setTexto("");
      setTimeout(() => {
        setAberto(false);
        setStatus("idle");
      }, 3000);
    } catch (e) {
      setStatus("erro");
      setErro(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(false);
    }
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-brand-orange/40 bg-brand-orange/10 px-4 py-3 text-sm font-medium text-brand-orange hover:bg-brand-orange/20"
      >
        ✍ Compartilhar meu testemunho
      </button>
    );
  }

  if (status === "ok") {
    return (
      <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-300">
        🙏 Obrigado! Seu testemunho foi enviado e será revisado antes de ser
        publicado.
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="rounded-2xl border border-border bg-card p-4">
      <label htmlFor="texto" className="text-sm font-medium">
        Seu testemunho
      </label>
      <textarea
        id="texto"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={6}
        maxLength={2000}
        placeholder="Conta o que Deus fez na sua vida..."
        className="mt-2 w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>{texto.length}/2000</span>
        <span>Revisado antes de publicar</span>
      </div>
      {erro && <p className="mt-2 text-xs text-destructive">{erro}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setAberto(false);
            setErro(null);
          }}
          className="flex-1 rounded-full border border-border bg-secondary/40 px-4 py-2 text-sm text-muted-foreground"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={busy || texto.trim().length < 20}
          className="flex-1 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Enviando..." : "Enviar"}
        </button>
      </div>
    </form>
  );
}
