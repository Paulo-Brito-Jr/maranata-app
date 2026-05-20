"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { atribuirIntercessor } from "./actions";

type Pedido = {
  id: string;
  nome: string;
  pedido: string;
  criadoEm: string;
};

type Intercessor = { id: string; nome: string };

type Props = {
  pedidos: Pedido[];
  intercessores: Intercessor[];
};

export function AtribuicaoIntercessor({ pedidos, intercessores }: Props) {
  const router = useRouter();
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [intercessorId, setIntercessorId] = useState<string>("");
  const [busy, setBusy] = useTransition();

  const N = selecionados.size;
  const total = pedidos.length;

  function toggle(id: string, checked: boolean) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function todosOuNenhum() {
    if (N === total) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(pedidos.map((p) => p.id)));
    }
  }

  function atribuir() {
    if (N === 0 || !intercessorId) return;
    const intercessor = intercessores.find((i) => i.id === intercessorId);
    const nomeInt = intercessor?.nome ?? "intercessor";
    if (
      !confirm(
        `Atribuir ${N} pedido(s) a ${nomeInt}? Eles vão pra "EM_ORACAO" com SLA 48h.`,
      )
    )
      return;

    setBusy(() => {
      atribuirIntercessor([...selecionados], intercessorId)
        .then(() => {
          setSelecionados(new Set());
          router.refresh();
        })
        .catch((e) =>
          alert(
            `Falha ao atribuir: ${e instanceof Error ? e.message : String(e)}`,
          ),
        );
    });
  }

  if (intercessores.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
        Nenhum intercessor na escala. Cadastre primeiro em /admin/intercessao/escala.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={todosOuNenhum}
          className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium hover:bg-secondary"
        >
          {N === total && N > 0
            ? "Deselecionar todos"
            : `Selecionar todos (${total})`}
        </button>
        <span className="text-xs text-muted-foreground">
          {N > 0 ? `${N} selecionado(s)` : "Marque pedidos abaixo"}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select
            value={intercessorId}
            onChange={(e) => setIntercessorId(e.target.value)}
            className="rounded-full border border-input bg-background px-3 py-1 text-xs"
          >
            <option value="">Escolher intercessor…</option>
            {intercessores.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={N === 0 || !intercessorId || busy}
            onClick={atribuir}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-30"
          >
            {busy ? "Atribuindo…" : `Atribuir ${N || ""}`}
          </button>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5">
        {pedidos.map((p) => (
          <li
            key={p.id}
            className="flex items-start gap-3 rounded-xl border border-border/60 bg-secondary/20 p-3 text-sm"
          >
            <input
              type="checkbox"
              checked={selecionados.has(p.id)}
              onChange={(e) => toggle(p.id, e.target.checked)}
              className="mt-1 size-4 shrink-0 cursor-pointer rounded border-input bg-background"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{p.nome}</span>
                <span>{new Date(p.criadoEm).toLocaleDateString("pt-BR")}</span>
              </div>
              <p className="mt-1 line-clamp-2 whitespace-pre-line text-xs">
                {p.pedido}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
