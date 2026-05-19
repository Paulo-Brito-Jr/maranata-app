"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CriarPedidoForm() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [pedido, setPedido] = useState("");
  const [anonimo, setAnonimo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (pedido.trim().length < 5) {
      setErro("Escreva um pouquinho mais sobre o pedido.");
      return;
    }
    setBusy(true);
    setErro(null);
    try {
      const resp = await fetch("/api/oracao/criar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pedido: pedido.trim(), anonimo }),
      });
      if (!resp.ok) {
        const d = await resp.json().catch(() => ({}));
        throw new Error(d.erro ?? "Falha");
      }
      setOk(true);
      setPedido("");
      setAnonimo(false);
      setTimeout(() => {
        setAberto(false);
        setOk(false);
        router.refresh();
      }, 2500);
    } catch (e) {
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
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        🙏 Quero fazer um pedido de oração
      </button>
    );
  }

  if (ok) {
    return (
      <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-300">
        🙏 Recebemos seu pedido. A casa Maranata vai orar por você.
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="rounded-2xl border border-border bg-card p-4">
      <label htmlFor="pedido" className="text-sm font-medium">
        Seu pedido
      </label>
      <textarea
        id="pedido"
        value={pedido}
        onChange={(e) => setPedido(e.target.value)}
        rows={5}
        maxLength={1500}
        placeholder="O que você quer pedir em oração?"
        className="mt-2 w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={anonimo}
          onChange={(e) => setAnonimo(e.target.checked)}
          className="size-4 rounded border-input bg-background"
        />
        Manter anônimo (intercessores não veem seu nome)
      </label>
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
          disabled={busy || pedido.trim().length < 5}
          className="flex-1 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Enviando..." : "Enviar pedido"}
        </button>
      </div>
    </form>
  );
}
