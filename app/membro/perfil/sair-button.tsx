"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SairButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function sair() {
    if (!confirm("Sair da conta?")) return;
    setBusy(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={sair}
      disabled={busy}
      className="w-full rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive transition hover:bg-destructive/20 disabled:opacity-50"
    >
      {busy ? "Saindo..." : "Sair"}
    </button>
  );
}
