"use client";

import { useEffect, useState } from "react";

type Estado = "carregando" | "sem-suporte" | "negado" | "inativo" | "ativo";

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}

export function PushToggle() {
  const [estado, setEstado] = useState<Estado>("carregando");
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      if (typeof window === "undefined") return;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (!cancelado) setEstado("sem-suporte");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelado) setEstado("negado");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!cancelado) setEstado(sub ? "ativo" : "inativo");
      } catch {
        if (!cancelado) setEstado("inativo");
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  async function ativar() {
    setBusy(true);
    setErro(null);
    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("VAPID public key não configurada");

      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setEstado(perm === "denied" ? "negado" : "inativo");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const resp = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!resp.ok) throw new Error("Servidor recusou inscrição");

      setEstado("ativo");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao ativar push");
    } finally {
      setBusy(false);
    }
  }

  async function desativar() {
    setBusy(true);
    setErro(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEstado("inativo");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao desativar push");
    } finally {
      setBusy(false);
    }
  }

  if (estado === "carregando") return null;

  if (estado === "sem-suporte") {
    return (
      <div className="rounded-2xl border border-border bg-card/40 p-4 text-sm text-muted-foreground">
        Seu navegador não suporta notificações push.
      </div>
    );
  }

  if (estado === "negado") {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
        Notificações bloqueadas no navegador. Libere nas configurações do site.
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
      <div className="flex-1">
        <p className="text-sm font-medium">Notificações</p>
        <p className="text-xs text-muted-foreground">
          {estado === "ativo"
            ? "Você receberá avisos de eventos, oração e mensagens da igreja."
            : "Ative pra receber avisos da Maranata."}
        </p>
        {erro && <p className="mt-1 text-xs text-destructive">{erro}</p>}
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={estado === "ativo" ? desativar : ativar}
        className={`ml-4 rounded-full px-4 py-2 text-xs font-semibold transition disabled:opacity-50 ${
          estado === "ativo"
            ? "border border-border bg-secondary/50 text-foreground hover:bg-secondary"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
      >
        {busy ? "..." : estado === "ativo" ? "Desativar" : "Ativar"}
      </button>
    </div>
  );
}
