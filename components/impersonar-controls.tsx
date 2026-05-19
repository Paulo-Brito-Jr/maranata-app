"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MKRole } from "@/lib/maranata-key-sso";

const PAPEIS_TESTE: { value: MKRole; label: string }[] = [
  { value: "MEMBRO", label: "Membro comum" },
  { value: "LIDER_CELULA", label: "Líder de célula" },
  { value: "SECRETARIA", label: "Secretaria" },
  { value: "FINANCEIRO", label: "Financeiro" },
  { value: "KIDS_RESPONSAVEL", label: "Kids — Responsável" },
  { value: "ADMIN_IGREJA", label: "Admin Igreja" },
  { value: "PASTOR_DIRETORIA", label: "Pastor / Diretoria" },
];

export function ImpersonarStarter() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [pending, start] = useTransition();

  async function ativar(papel: MKRole) {
    start(async () => {
      await fetch("/api/auth/impersonar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ papel }),
      });
      setAberto(false);
      if (papel === "MEMBRO") router.push("/membro");
      else router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-secondary"
      >
        Ver como…
      </button>
      {aberto && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          <div className="border-b border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground">
            Impersonar (4h)
          </div>
          <ul className="max-h-80 overflow-auto py-1">
            {PAPEIS_TESTE.map((p) => (
              <li key={p.value}>
                <button
                  onClick={() => ativar(p.value)}
                  disabled={pending}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-secondary disabled:opacity-50"
                >
                  {p.label}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
            Sai sozinho em 4h ou pelo banner amarelo.
          </div>
        </div>
      )}
    </div>
  );
}

export function ImpersonarSair({ texto = "Sair do modo teste" }: { texto?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() =>
        start(async () => {
          await fetch("/api/auth/impersonar", { method: "DELETE" });
          router.push("/admin");
        })
      }
      disabled={pending}
      className="rounded-full bg-yellow-500 px-3 py-1 text-xs font-semibold text-yellow-950 hover:bg-yellow-400 disabled:opacity-50"
    >
      {texto}
    </button>
  );
}
