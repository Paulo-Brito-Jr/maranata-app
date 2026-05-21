"use client";

import { useState } from "react";

type Ingresso = { id: string; nome: string; preco: number };
type Igreja = { id: string; nome: string; apelido: string | null; endereco: string | null };

export function InscricaoForm({
  eventoId,
  ingressos,
  igrejas,
}: {
  eventoId: string;
  ingressos: Ingresso[];
  igrejas: Igreja[];
}) {
  const [ingressoId, setIngressoId] = useState(ingressos[0]?.id ?? "");
  const [metodo, setMetodo] = useState<"PIX" | "CARTAO" | "DINHEIRO_LOCAL">("PIX");

  const ingressoAtual = ingressos.find((i) => i.id === ingressoId);
  const ehPago = ingressoAtual && Number(ingressoAtual.preco) > 0;

  return (
    <form action="/api/eventos/inscrever" method="POST" className="mt-4 space-y-3">
      <input type="hidden" name="eventoId" value={eventoId} />
      <input
        type="text"
        name="nome"
        required
        placeholder="Seu nome"
        className="w-full rounded-xl border border-input bg-background px-3 py-2"
      />
      <input
        type="email"
        name="email"
        required
        placeholder="Seu e-mail"
        className="w-full rounded-xl border border-input bg-background px-3 py-2"
      />
      <input
        type="tel"
        name="telefone"
        placeholder="Telefone (opcional)"
        className="w-full rounded-xl border border-input bg-background px-3 py-2"
      />

      {ingressos.length > 0 && (
        <select
          name="ingressoId"
          required
          value={ingressoId}
          onChange={(e) => setIngressoId(e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-3 py-2"
        >
          <option value="">Tipo de inscrição...</option>
          {ingressos.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nome} — R$ {Number(i.preco).toFixed(2)}
            </option>
          ))}
        </select>
      )}

      {ehPago && (
        <div className="space-y-2 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm font-medium">Como você quer pagar?</p>
          <div className="grid grid-cols-3 gap-2">
            {(["PIX", "CARTAO", "DINHEIRO_LOCAL"] as const).map((opt) => (
              <label
                key={opt}
                className={`cursor-pointer rounded-xl border px-3 py-2 text-center text-sm transition ${
                  metodo === opt
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-muted"
                }`}
              >
                <input
                  type="radio"
                  name="metodoPagamento"
                  value={opt}
                  checked={metodo === opt}
                  onChange={() => setMetodo(opt)}
                  className="sr-only"
                />
                {opt === "PIX" && "PIX"}
                {opt === "CARTAO" && "Cartão"}
                {opt === "DINHEIRO_LOCAL" && "Dinheiro 💵"}
              </label>
            ))}
          </div>

          {metodo === "DINHEIRO_LOCAL" && (
            <div className="space-y-2 pt-2">
              <p className="text-sm font-medium">Em qual unidade você vai pagar?</p>
              <select
                name="pagamentoLocalIgrejaId"
                required
                defaultValue=""
                className="w-full rounded-xl border border-input bg-background px-3 py-2"
              >
                <option value="">Escolha a unidade...</option>
                {igrejas.map((ig) => (
                  <option key={ig.id} value={ig.id}>
                    {ig.apelido ? `${ig.apelido} (${ig.nome})` : ig.nome}
                    {ig.endereco && ` — ${ig.endereco}`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Sua vaga fica reservada. Vá até a unidade escolhida e diga ao
                responsável que veio pagar pelo evento.
              </p>
            </div>
          )}
        </div>
      )}

      <button className="w-full rounded-full bg-primary py-3 font-medium text-primary-foreground hover:opacity-90">
        Inscrever
      </button>
    </form>
  );
}
