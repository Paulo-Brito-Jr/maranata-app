"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function ConcluirEtapaBotao({
  trilhaId,
  etapaId,
}: {
  trilhaId: string;
  etapaId: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() =>
        start(async () => {
          const r = await fetch(`/api/jornadas/${trilhaId}/etapa/${etapaId}/concluir`, {
            method: "POST",
          });
          if (r.ok) router.refresh();
        })
      }
      disabled={pending}
      className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
    >
      {pending ? "Marcando…" : "Concluí esta etapa ✓"}
    </button>
  );
}
