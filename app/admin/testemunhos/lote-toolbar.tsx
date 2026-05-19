"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  publicarLoteAction,
  ocultarLoteAction,
  excluirLoteAction,
} from "./lote-actions";

type Props = { ids: string[]; aba: string };

export function LoteToolbar({ ids, aba }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useTransition();

  useEffect(() => {
    const ev = (e: Event) => {
      const t = e.target as HTMLInputElement;
      if (t?.matches?.('input[type="checkbox"][data-id]')) {
        setSelected((prev) => {
          const next = new Set(prev);
          if (t.checked) next.add(t.dataset.id!);
          else next.delete(t.dataset.id!);
          return next;
        });
      }
    };
    document.addEventListener("change", ev);
    return () => document.removeEventListener("change", ev);
  }, []);

  const todos = ids.length;
  const N = selected.size;

  function todosOuNenhum() {
    const target = N === todos ? false : true;
    document
      .querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-id]')
      .forEach((cb) => {
        cb.checked = target;
      });
    setSelected(new Set(target ? ids : []));
  }

  async function executar(
    label: string,
    fn: (ids: string[]) => Promise<void>,
    confirmMsg: string,
  ) {
    if (N === 0) return;
    if (!confirm(confirmMsg.replace("{N}", String(N)))) return;
    setBusy(() => {
      fn([...selected])
        .then(() => {
          setSelected(new Set());
          router.refresh();
        })
        .catch((e) =>
          alert(`Falha em ${label}: ${e instanceof Error ? e.message : e}`),
        );
    });
  }

  return (
    <div className="sticky top-0 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card/95 p-3 text-xs backdrop-blur">
      <button
        type="button"
        onClick={todosOuNenhum}
        className="rounded-full border border-border bg-secondary/60 px-3 py-1 font-medium hover:bg-secondary"
      >
        {N === todos && N > 0 ? "Deselecionar todos" : `Selecionar todos (${todos})`}
      </button>
      <span className="text-muted-foreground">
        {N > 0 ? `${N} selecionado(s)` : "Marque pra ações em lote"}
      </span>

      <div className="ml-auto flex flex-wrap gap-1">
        {aba === "pendentes" && (
          <button
            type="button"
            disabled={N === 0 || busy}
            onClick={() =>
              executar(
                "publicar lote",
                publicarLoteAction,
                "Publicar {N} testemunhos selecionados?",
              )
            }
            className="rounded-full bg-emerald-500/20 px-3 py-1 font-medium text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-30"
          >
            ✓ Publicar {N || ""}
          </button>
        )}
        {aba === "publicados" && (
          <button
            type="button"
            disabled={N === 0 || busy}
            onClick={() =>
              executar(
                "ocultar lote",
                ocultarLoteAction,
                "Ocultar {N} testemunhos (não aparecem mais no público)?",
              )
            }
            className="rounded-full bg-secondary/60 px-3 py-1 font-medium hover:bg-secondary disabled:opacity-30"
          >
            Ocultar {N || ""}
          </button>
        )}
        <button
          type="button"
          disabled={N === 0 || busy}
          onClick={() =>
            executar(
              "excluir lote",
              excluirLoteAction,
              "EXCLUIR {N} testemunhos? Esta ação é permanente.",
            )
          }
          className="rounded-full bg-destructive/15 px-3 py-1 font-medium text-destructive hover:bg-destructive/25 disabled:opacity-30"
        >
          Excluir {N || ""}
        </button>
      </div>
    </div>
  );
}
