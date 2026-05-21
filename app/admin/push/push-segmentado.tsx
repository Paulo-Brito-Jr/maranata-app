"use client";

import { useState } from "react";

type Igreja = { id: string; nome: string; apelido: string | null; tipo: string };
type Regional = { id: string; nome: string };
type Ministerio = { value: string; label: string; emoji: string };

const MINISTERIOS: Ministerio[] = [
  { value: "KIDS", label: "Kids", emoji: "🧒" },
  { value: "TEEN", label: "Teen", emoji: "🧑‍🎓" },
  { value: "JOVENS", label: "Jovens", emoji: "🧑" },
  { value: "CASAIS", label: "Casais", emoji: "💑" },
  { value: "TERCEIRA_IDADE", label: "Terceira Idade", emoji: "👴" },
  { value: "LOUVOR", label: "Louvor", emoji: "🎵" },
];

export function PushSegmentado({
  igrejas,
  regionais,
}: {
  igrejas: Igreja[];
  regionais: Regional[];
}) {
  const [igrejasSel, setIgrejasSel] = useState<Set<string>>(new Set());
  const [regionaisSel, setRegionaisSel] = useState<Set<string>>(new Set());
  const [ministeriosSel, setMinisteriosSel] = useState<Set<string>>(new Set());

  function toggleSet(s: Set<string>, v: string, setter: (s: Set<string>) => void) {
    const next = new Set(s);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    setter(next);
  }

  function selecionarTodasIgrejas() {
    setIgrejasSel(new Set(igrejas.map((i) => i.id)));
  }
  function limparIgrejas() {
    setIgrejasSel(new Set());
  }

  const total =
    igrejasSel.size === 0 && regionaisSel.size === 0 && ministeriosSel.size === 0
      ? "Todos os assinantes (broadcast geral)"
      : [
          igrejasSel.size > 0 && `${igrejasSel.size} igreja${igrejasSel.size > 1 ? "s" : ""}`,
          regionaisSel.size > 0 &&
            `${regionaisSel.size} regional${regionaisSel.size > 1 ? "is" : ""}`,
          ministeriosSel.size > 0 &&
            `${ministeriosSel.size} ministério${ministeriosSel.size > 1 ? "s" : ""}`,
        ]
          .filter(Boolean)
          .join(" + ");

  return (
    <section className="space-y-4 rounded-2xl border border-primary/30 bg-primary/5 p-5">
      <header>
        <h2 className="font-semibold">Push / mensagem segmentada</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Combine filtros. Vazio = todos os assinantes. Os filtros são AND entre
          dimensões e OR dentro de cada dimensão (várias igrejas marcadas =
          quem está em qualquer uma delas).
        </p>
      </header>

      <form
        action="/api/admin/push-segmentado-submit"
        method="POST"
        className="space-y-4"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium">Título</span>
            <input
              name="titulo"
              required
              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium">URL (opcional)</span>
            <input
              name="url"
              type="url"
              placeholder="/membro/eventos"
              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>
        <label className="block">
          <span className="text-xs font-medium">Corpo</span>
          <textarea
            name="corpo"
            required
            rows={3}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          />
        </label>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Igrejas ({igrejasSel.size}/{igrejas.length})
            </span>
            <div className="flex gap-2 text-[10px]">
              <button
                type="button"
                onClick={selecionarTodasIgrejas}
                className="rounded-full bg-muted px-2 py-0.5 hover:bg-muted/80"
              >
                Selecionar todas
              </button>
              <button
                type="button"
                onClick={limparIgrejas}
                className="rounded-full bg-muted px-2 py-0.5 hover:bg-muted/80"
              >
                Limpar
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {igrejas.map((ig) => (
              <label
                key={ig.id}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                  igrejasSel.has(ig.id)
                    ? "border-primary bg-primary/10"
                    : "border-input bg-background hover:bg-muted"
                }`}
              >
                <input
                  type="checkbox"
                  name="igrejasIds"
                  value={ig.id}
                  checked={igrejasSel.has(ig.id)}
                  onChange={() => toggleSet(igrejasSel, ig.id, setIgrejasSel)}
                  className="size-4"
                />
                <span className="truncate">
                  {ig.tipo === "SEDE" && "🏛️ "}
                  {ig.tipo === "ACAMPAMENTO" && "🏕️ "}
                  {ig.apelido ?? ig.nome}
                </span>
              </label>
            ))}
          </div>
        </div>

        {regionais.length > 0 && (
          <div>
            <span className="mb-2 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Regionais ({regionaisSel.size}/{regionais.length})
            </span>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {regionais.map((r) => (
                <label
                  key={r.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                    regionaisSel.has(r.id)
                      ? "border-primary bg-primary/10"
                      : "border-input bg-background hover:bg-muted"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="regionaisIds"
                    value={r.id}
                    checked={regionaisSel.has(r.id)}
                    onChange={() => toggleSet(regionaisSel, r.id, setRegionaisSel)}
                    className="size-4"
                  />
                  <span className="truncate">{r.nome}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <span className="mb-2 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Ministérios ({ministeriosSel.size}/{MINISTERIOS.length})
          </span>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {MINISTERIOS.map((m) => (
              <label
                key={m.value}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                  ministeriosSel.has(m.value)
                    ? "border-primary bg-primary/10"
                    : "border-input bg-background hover:bg-muted"
                }`}
              >
                <input
                  type="checkbox"
                  name="ministerios"
                  value={m.value}
                  checked={ministeriosSel.has(m.value)}
                  onChange={() => toggleSet(ministeriosSel, m.value, setMinisteriosSel)}
                  className="size-4"
                />
                <span>{m.emoji} {m.label}</span>
              </label>
            ))}
          </div>
          {ministeriosSel.size > 0 && !ministeriosSel.has("KIDS") && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
              ⚠️ Hoje apenas KIDS tem vínculo direto Membro→Ministério no schema.
              Outros ministérios serão entregues apenas pelo filtro de igreja.
            </p>
          )}
        </div>

        <div className="rounded-xl bg-muted/50 p-3 text-sm">
          <strong>Alcance:</strong> {total}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="enviarAgora" defaultChecked />
          Enviar imediatamente após criar
        </label>

        <button
          type="submit"
          className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
        >
          Criar push
        </button>
      </form>
    </section>
  );
}
