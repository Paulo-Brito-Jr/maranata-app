"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  publicarTodosDestaqueAction,
  publicarUltimos60DiasAction,
  publicarTodosAction,
  despublicarTodosAction,
} from "./lote-actions";

type Props = {
  pendentes: number;
  destaques: number;
  publicados: number;
};

export function BulkPublishToolbar({
  pendentes,
  destaques,
  publicados,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useTransition();
  const [confirmandoTodos, setConfirmandoTodos] = useState(false);

  async function rodar(
    fn: () => Promise<{ atualizados: number }>,
    label: string,
  ) {
    setBusy(() => {
      fn()
        .then((r) => {
          alert(`${label}: ${r.atualizados} testemunho(s) atualizado(s).`);
          router.refresh();
        })
        .catch((e) =>
          alert(`Falha: ${e instanceof Error ? e.message : String(e)}`),
        );
    });
  }

  return (
    <>
      <div className="mb-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Ações em massa
          </span>
          <span className="ml-1 text-xs text-muted-foreground">
            (ignora legado InChurch)
          </span>

          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || destaques === 0}
              onClick={() =>
                rodar(publicarTodosDestaqueAction, "Publicar DESTAQUE")
              }
              className="rounded-full bg-brand-orange/20 px-3 py-1 text-xs font-medium text-brand-orange hover:bg-brand-orange/30 disabled:opacity-30"
            >
              ★ Publicar todos os DESTAQUE
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() =>
                rodar(publicarUltimos60DiasAction, "Publicar últimos 60 dias")
              }
              className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-30"
            >
              ◷ Publicar últimos 60 dias
            </button>

            <button
              type="button"
              disabled={busy || pendentes === 0}
              onClick={() => setConfirmandoTodos(true)}
              className="rounded-full bg-emerald-500/30 px-3 py-1 text-xs font-medium text-emerald-100 hover:bg-emerald-500/40 disabled:opacity-30"
            >
              ✓ Publicar TODOS ({pendentes})
            </button>

            <button
              type="button"
              disabled={busy || publicados === 0}
              onClick={() => {
                if (
                  !confirm(
                    `Despublicar TODOS os ${publicados} testemunhos publicados? Eles somem do app público.`,
                  )
                )
                  return;
                rodar(despublicarTodosAction, "Despublicar todos");
              }}
              className="rounded-full bg-destructive/15 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/25 disabled:opacity-30"
            >
              ✕ Despublicar todos
            </button>
          </div>
        </div>
      </div>

      {confirmandoTodos && (
        <ConfirmModal
          total={pendentes}
          onCancel={() => setConfirmandoTodos(false)}
          onConfirm={() => {
            setConfirmandoTodos(false);
            rodar(publicarTodosAction, "Publicar TODOS");
          }}
        />
      )}
    </>
  );
}

function ConfirmModal({
  total,
  onCancel,
  onConfirm,
}: {
  total: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-6 backdrop-blur">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <h2 className="text-lg font-semibold">Publicar TODOS?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Vai publicar <strong>{total}</strong> testemunho(s). Eles aparecerão
          imediatamente em <code>/testemunhos</code>.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Os registros de legado InChurch (sem texto real) são ignorados
          automaticamente.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Sim, publicar {total}
          </button>
        </div>
      </div>
    </div>
  );
}
