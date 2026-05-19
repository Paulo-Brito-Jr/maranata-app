"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ResultadoOk = { ok: true; nome: string; jaCheckin?: boolean };
type ResultadoErr = { ok: false; erro: string };

export function ScannerEvento({ eventoId }: { eventoId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<unknown>(null);
  const router = useRouter();
  const [ultimo, setUltimo] = useState<ResultadoOk | ResultadoErr | null>(null);
  const [codigoManual, setCodigoManual] = useState("");
  const [pendente, setPendente] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function processar(code: string) {
      if (pendente) return;
      setPendente(true);
      try {
        const r = await fetch(`/api/eventos/${eventoId}/checkin`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ qrCode: code }),
        });
        const j = (await r.json()) as ResultadoOk | ResultadoErr;
        setUltimo(j);
        if (j.ok) router.refresh();
      } finally {
        setTimeout(() => setPendente(false), 1500);
      }
    }

    async function setup() {
      try {
        const mod = await import("html5-qrcode");
        if (cancelado || !containerRef.current) return;
        const Html5Qrcode = mod.Html5Qrcode;
        const id = "evento-scanner";
        containerRef.current.id = id;
        const scanner = new Html5Qrcode(id);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (text) => processar(text),
          () => null,
        );
      } catch {
        // ignora — câmera pode não estar disponível
      }
    }

    void setup();
    return () => {
      cancelado = true;
      const s = scannerRef.current as { stop?: () => Promise<void> } | null;
      if (s?.stop) void s.stop().catch(() => null);
    };
  }, [eventoId, router, pendente]);

  return (
    <section className="space-y-4">
      <div
        ref={containerRef}
        className="mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-black"
      />

      {ultimo && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            ultimo.ok
              ? ultimo.jaCheckin
                ? "bg-amber-500/15 text-amber-200"
                : "bg-emerald-500/15 text-emerald-200"
              : "bg-red-500/15 text-red-200"
          }`}
        >
          {ultimo.ok
            ? ultimo.jaCheckin
              ? `${ultimo.nome} já tinha feito check-in.`
              : `✓ ${ultimo.nome} entrou.`
            : `⚠ ${ultimo.erro}`}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (codigoManual.trim()) {
            void fetch(`/api/eventos/${eventoId}/checkin`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ qrCode: codigoManual.trim() }),
            })
              .then((r) => r.json())
              .then((j: ResultadoOk | ResultadoErr) => {
                setUltimo(j);
                if (j.ok) router.refresh();
              });
            setCodigoManual("");
          }
        }}
        className="flex gap-2"
      >
        <input
          value={codigoManual}
          onChange={(e) => setCodigoManual(e.target.value)}
          placeholder="Digite o código manualmente"
          className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <button className="rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground">
          Confirmar
        </button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Câmera funciona apenas em HTTPS e com permissão concedida. Use o campo manual como
        fallback.
      </p>
    </section>
  );
}
