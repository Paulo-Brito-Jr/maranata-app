"use client";

import { useState, useTransition } from "react";
import { Field, Input, Button } from "@/components/ui/field";

export function CheckoutForm() {
  const [codigo, setCodigo] = useState("");
  const [retiradaPor, setRetiradaPor] = useState("");
  const [retiradaDoc, setRetiradaDoc] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<{ crianca: string; turma: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="mx-auto max-w-lg space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setErro(null);
          setSucesso(null);
          const r = await fetch("/api/kids/checkout", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              etiquetaCode: codigo.trim(),
              retiradaPor: retiradaPor.trim(),
              retiradaDoc: retiradaDoc.trim() || undefined,
            }),
          });
          const j = await r.json().catch(() => ({}));
          if (!r.ok) {
            setErro(j?.erro ?? "Erro");
            return;
          }
          setSucesso({ crianca: j.crianca, turma: j.turma });
          setCodigo("");
          setRetiradaPor("");
          setRetiradaDoc("");
        });
      }}
    >
      <Field label="Código do ticket (QR)" required hint="Leia com qualquer leitor de QR.">
        <Input
          autoFocus
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="xxxxxxxx-xxxx-xxxx"
          required
        />
      </Field>

      <Field label="Quem está retirando" required>
        <Input
          value={retiradaPor}
          onChange={(e) => setRetiradaPor(e.target.value)}
          placeholder="Nome completo"
          required
        />
      </Field>

      <Field label="Documento (opcional)">
        <Input
          value={retiradaDoc}
          onChange={(e) => setRetiradaDoc(e.target.value)}
          placeholder="RG / CPF / CNH"
        />
      </Field>

      {erro && (
        <p className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-300">{erro}</p>
      )}
      {sucesso && (
        <p className="rounded-xl bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300">
          ✓ {sucesso.crianca} liberada da sala {sucesso.turma}. Responsável avisado.
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Validando…" : "Liberar criança"}
      </Button>
    </form>
  );
}
