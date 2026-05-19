"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Field, Input, Select, Textarea, Button } from "@/components/ui/field";
import type { PushAlvo } from "@prisma/client";

type Template = {
  id: string;
  nome: string;
  titulo: string;
  corpo: string;
  url: string | null;
  alvoPadrao: PushAlvo;
};

export function PushComposer({
  igrejas,
  celulas,
  templates,
}: {
  igrejas: { id: string; nome: string }[];
  celulas: { id: string; nome: string }[];
  templates: Template[];
}) {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [url, setUrl] = useState("");
  const [alvo, setAlvo] = useState<PushAlvo>("TODOS");
  const [igrejaId, setIgrejaId] = useState("");
  const [celulaId, setCelulaId] = useState("");
  const [papel, setPapel] = useState("");
  const [agendadoPara, setAgendadoPara] = useState("");
  const [enviarAgora, setEnviarAgora] = useState(true);
  const [resultado, setResultado] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function aplicarTemplate(id: string) {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setTitulo(t.titulo);
    setCorpo(t.corpo);
    setUrl(t.url ?? "");
    setAlvo(t.alvoPadrao);
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <header className="flex items-center justify-between">
        <h2 className="font-semibold">Compor mensagem</h2>
        {templates.length > 0 && (
          <Select
            className="max-w-xs"
            defaultValue=""
            onChange={(e) => aplicarTemplate(e.target.value)}
          >
            <option value="">Usar template…</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </Select>
        )}
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            setResultado(null);
            const filtroJson: Record<string, unknown> = {};
            if (papel) filtroJson.papel = papel;
            if (celulaId) filtroJson.celulaId = celulaId;

            const r = await fetch("/api/push/criar", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                titulo,
                corpo,
                url: url || undefined,
                alvo,
                igrejaId: igrejaId || undefined,
                filtroJson: Object.keys(filtroJson).length ? filtroJson : undefined,
                agendadoPara: agendadoPara || undefined,
                enviarAgora,
              }),
            });
            const j = await r.json().catch(() => ({}));
            if (!r.ok) {
              setResultado(`⚠ ${j?.erro ?? "Falhou"}`);
              return;
            }
            setResultado(
              enviarAgora
                ? `✓ enviado pra ${j.totalEnviado ?? 0} dispositivo(s)`
                : "✓ rascunho salvo",
            );
            setTitulo("");
            setCorpo("");
            setUrl("");
            setAgendadoPara("");
            router.refresh();
          });
        }}
        className="space-y-4"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Título" required>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              maxLength={120}
              placeholder="🙏 Bom dia, família Maranata!"
            />
          </Field>
          <Field label="Link de destino (opcional)">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/membro/eventos"
            />
          </Field>
        </div>

        <Field label="Mensagem" required>
          <Textarea
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
            required
            rows={3}
            maxLength={500}
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Público">
            <Select value={alvo} onChange={(e) => setAlvo(e.target.value as PushAlvo)}>
              <option value="TODOS">Todos os assinantes</option>
              <option value="MEMBROS">Só membros</option>
              <option value="USUARIOS_APP">Só usuários do app antigo</option>
              <option value="IGREJA">Filtrar por igreja</option>
              <option value="CELULA">Filtrar por célula</option>
              <option value="CUSTOM">Custom (papel/etc)</option>
            </Select>
          </Field>

          {alvo === "IGREJA" && (
            <Field label="Igreja" required>
              <Select value={igrejaId} onChange={(e) => setIgrejaId(e.target.value)} required>
                <option value="">Selecione</option>
                {igrejas.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nome}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {alvo === "CELULA" && (
            <Field label="Célula" required>
              <Select value={celulaId} onChange={(e) => setCelulaId(e.target.value)} required>
                <option value="">Selecione</option>
                {celulas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {alvo === "CUSTOM" && (
            <Field label="Papel">
              <Select value={papel} onChange={(e) => setPapel(e.target.value)}>
                <option value="">Qualquer</option>
                <option value="LIDER_CELULA">Líderes de célula</option>
                <option value="KIDS_RESPONSAVEL">Responsáveis Kids</option>
                <option value="SECRETARIA">Secretaria</option>
                <option value="FINANCEIRO">Financeiro</option>
                <option value="PASTOR_DIRETORIA">Diretoria</option>
              </Select>
            </Field>
          )}

          <Field label="Agendar (opcional)">
            <Input
              type="datetime-local"
              value={agendadoPara}
              onChange={(e) => setAgendadoPara(e.target.value)}
            />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={enviarAgora}
            onChange={(e) => setEnviarAgora(e.target.checked)}
          />
          Enviar imediatamente (desmarque para salvar rascunho)
        </label>

        {/* Pré-visualização */}
        <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Pré-visualização
          </p>
          <div className="mt-2 rounded-lg bg-black/40 p-3 text-sm text-white">
            <p className="font-bold">{titulo || "Título aparecerá aqui"}</p>
            <p className="mt-0.5 opacity-80">{corpo || "Texto da mensagem"}</p>
            <p className="mt-1 text-[10px] opacity-60">maranata.app</p>
          </div>
        </div>

        {resultado && (
          <p
            className={`rounded-xl px-3 py-2 text-sm ${
              resultado.startsWith("✓")
                ? "bg-emerald-500/15 text-emerald-200"
                : "bg-red-500/15 text-red-200"
            }`}
          >
            {resultado}
          </p>
        )}

        <Button type="submit" disabled={pending}>
          {pending
            ? "Processando…"
            : enviarAgora
              ? agendadoPara
                ? "Agendar"
                : "Enviar agora"
              : "Salvar rascunho"}
        </Button>
      </form>
    </section>
  );
}
