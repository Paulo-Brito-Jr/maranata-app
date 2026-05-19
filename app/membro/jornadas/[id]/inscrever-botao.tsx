"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function InscreverBotao({ trilhaId }: { trilhaId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() =>
        start(async () => {
          const r = await fetch(`/api/jornadas/${trilhaId}/inscrever`, { method: "POST" });
          if (r.ok) router.refresh();
        })
      }
      disabled={pending}
      className="w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
    >
      {pending ? "Inscrevendo…" : "Começar trilha"}
    </button>
  );
}
