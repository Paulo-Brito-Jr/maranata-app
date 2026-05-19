"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Field, Input, Select, Button } from "@/components/ui/field";

type Crianca = {
  id: string;
  nome: string;
  faixaEtaria: string;
  alergias: string | null;
  restricoesAlim: string | null;
  necessidadesEsp: string | null;
  autonomiaEntrada: boolean;
  igreja: { id: string; nome: string };
  responsaveis: {
    id: string;
    nome: string;
    parentesco: string;
    telefone: string | null;
    podeBuscar: boolean;
    principal: boolean;
  }[];
};

type Turma = {
  id: string;
  nome: string;
  faixaEtaria: string;
  sala: string | null;
  igreja: { nome: string };
};

export function CheckinForm({
  criancas,
  turmas,
}: {
  criancas: Crianca[];
  turmas: Turma[];
}) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [selecionada, setSelecionada] = useState<Crianca | null>(null);
  const [turmaId, setTurmaId] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const filtradas = useMemo(() => {
    if (!busca.trim()) return criancas.slice(0, 20);
    const q = busca.toLowerCase();
    return criancas.filter((c) => c.nome.toLowerCase().includes(q)).slice(0, 20);
  }, [busca, criancas]);

  const turmasCompativeis = useMemo(() => {
    if (!selecionada) return [];
    return turmas.filter((t) => t.faixaEtaria === selecionada.faixaEtaria);
  }, [selecionada, turmas]);

  return (
    <div className="space-y-5">
      <Field label="1. Buscar criança" required>
        <Input
          autoFocus
          placeholder="Comece a digitar o nome…"
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setSelecionada(null);
          }}
        />
      </Field>

      {!selecionada && (
        <ul className="grid gap-2 md:grid-cols-2">
          {filtradas.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setSelecionada(c)}
                className="w-full rounded-2xl border border-border bg-card p-3 text-left hover:border-primary/40"
              >
                <p className="font-medium">{c.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {c.igreja.nome} · {c.faixaEtaria}
                </p>
                {c.alergias && (
                  <p className="mt-1 text-xs font-medium text-red-300">⚠ {c.alergias}</p>
                )}
              </button>
            </li>
          ))}
          {filtradas.length === 0 && (
            <li className="text-sm text-muted-foreground">Nenhuma criança encontrada.</li>
          )}
        </ul>
      )}

      {selecionada && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!turmaId) {
              setErro("Escolha a turma.");
              return;
            }
            start(async () => {
              setErro(null);
              const r = await fetch("/api/kids/checkin", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  criancaId: selecionada.id,
                  turmaId,
                  observacoes: observacoes.trim() || null,
                }),
              });
              if (!r.ok) {
                const j = await r.json().catch(() => ({}));
                setErro(j?.erro ?? "Erro ao gerar check-in");
                return;
              }
              const j = (await r.json()) as { checkinId: string };
              router.push(`/admin/kids/etiqueta/${j.checkinId}`);
            });
          }}
          className="space-y-4 rounded-2xl border border-border bg-card p-5"
        >
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Criança selecionada
              </p>
              <p className="text-lg font-semibold">{selecionada.nome}</p>
              <p className="text-xs text-muted-foreground">
                {selecionada.igreja.nome} · {selecionada.faixaEtaria}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelecionada(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              trocar
            </button>
          </header>

          {(selecionada.alergias || selecionada.restricoesAlim || selecionada.necessidadesEsp) && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
              <p className="font-semibold uppercase tracking-widest text-xs">⚠ Atenção</p>
              {selecionada.alergias && <p className="mt-1">Alergias: {selecionada.alergias}</p>}
              {selecionada.restricoesAlim && (
                <p>Restrições alimentares: {selecionada.restricoesAlim}</p>
              )}
              {selecionada.necessidadesEsp && (
                <p>Necessidades especiais: {selecionada.necessidadesEsp}</p>
              )}
            </div>
          )}

          {selecionada.responsaveis.length > 0 && (
            <div className="rounded-xl border border-border bg-secondary/30 p-3 text-sm">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Pode buscar
              </p>
              <ul className="mt-1 space-y-0.5">
                {selecionada.responsaveis
                  .filter((r) => r.podeBuscar)
                  .map((r) => (
                    <li key={r.id}>
                      {r.principal ? "★ " : ""}
                      <strong>{r.nome}</strong> ({r.parentesco})
                      {r.telefone && <span className="text-muted-foreground"> · {r.telefone}</span>}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <Field label="2. Turma / sala" required>
            <Select value={turmaId} onChange={(e) => setTurmaId(e.target.value)} required>
              <option value="">Selecione a sala</option>
              {turmasCompativeis.length === 0 ? (
                <option disabled>Nenhuma turma compatível com a faixa</option>
              ) : (
                turmasCompativeis.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome} ({t.igreja.nome}
                    {t.sala ? ` · sala ${t.sala}` : ""})
                  </option>
                ))
              )}
            </Select>
          </Field>

          <Field label="Observações pra equipe (opcional)">
            <Input
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: hoje está com tosse"
            />
          </Field>

          {erro && (
            <p className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-300">{erro}</p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Gerando ticket…" : "Confirmar check-in"}
          </Button>
        </form>
      )}
    </div>
  );
}
