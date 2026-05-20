"use client";

import { useActionState } from "react";
import { processarOfx, type ResumoOfx } from "../actions";

type Igreja = { id: string; nome: string };
type Conta = { id: string; nome: string; igrejaId: string | null };

export function FormOfx({ igrejas, contas }: { igrejas: Igreja[]; contas: Conta[] }) {
  const [state, formAction, isPending] = useActionState<ResumoOfx | null, FormData>(
    processarOfx,
    null,
  );

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-5 rounded-2xl border border-border bg-card p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Igreja <span className="text-destructive">*</span>
            </label>
            <select
              name="igrejaId"
              required
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecione...</option>
              {igrejas.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Conta destino <span className="text-destructive">*</span>
            </label>
            <select
              name="contaId"
              required
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecione...</option>
              {contas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Arquivo OFX <span className="text-destructive">*</span>
          </label>
          <input
            type="file"
            name="arquivo"
            accept=".ofx,text/x-ofx,application/x-ofx,text/plain"
            required
            className="block w-full rounded-xl border border-dashed border-border bg-background px-3 py-4 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
          />
          <p className="text-xs text-muted-foreground">
            Exporte o extrato no internet banking da igreja em formato OFX. O sistema vai conciliar
            cada transação com lançamentos existentes (mesma data ±1 dia, mesmo valor e tipo).
          </p>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Processando..." : "Importar e conciliar"}
        </button>
      </form>

      {state && (
        <section
          className={`rounded-2xl border p-5 ${
            state.erro
              ? "border-destructive/40 bg-destructive/10"
              : "border-emerald-500/40 bg-emerald-500/10"
          }`}
        >
          {state.erro ? (
            <>
              <h3 className="text-base font-semibold text-destructive">Falhou</h3>
              <p className="mt-1 text-sm">{state.erro}</p>
            </>
          ) : (
            <>
              <h3 className="text-base font-semibold text-emerald-300">Importação concluída</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {state.total} transações processadas no arquivo.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <div className="text-xs uppercase tracking-widest text-emerald-300">Conciliadas</div>
                  <div className="mt-1 text-2xl font-semibold">{state.conciliadas}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    bateram com lançamento existente
                  </div>
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <div className="text-xs uppercase tracking-widest text-primary">Novas</div>
                  <div className="mt-1 text-2xl font-semibold">{state.novas}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">criadas como PENDENTE</div>
                </div>
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                  <div className="text-xs uppercase tracking-widest text-amber-300">Conflitos</div>
                  <div className="mt-1 text-2xl font-semibold">{state.conflitos}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    múltiplos matches — revisar
                  </div>
                </div>
              </div>
              <a
                href="/admin/financeiro/lancamentos"
                className="mt-4 inline-flex rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary"
              >
                Ver lançamentos →
              </a>
            </>
          )}
        </section>
      )}
    </div>
  );
}
