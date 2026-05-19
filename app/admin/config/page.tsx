import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { Field, Input, Button } from "@/components/ui/field";
import {
  toggleFlagAction,
  criarFlagAction,
  excluirFlagAction,
} from "./actions";

export const metadata = { title: "Configurações" };
export const dynamic = "force-dynamic";

const FLAGS_SUGERIDAS = [
  { chave: "DOACAO_AVULSA_LIVRE", desc: "Permite doação sem login" },
  { chave: "EVENTOS_INSCRICAO_PUBLICA", desc: "Permite inscrição em evento sem login" },
  { chave: "TESTEMUNHOS_REVISAO_AUTOMATICA", desc: "Auto-publicar testemunhos sem moderação" },
  { chave: "KIDS_CHECKIN_QR", desc: "Habilita checkin Kids via QR code" },
  { chave: "PUSH_AUTO_DOMINGO", desc: "Cron de push do domingo manhã ativo" },
];

export default async function ConfigPage() {
  const [flags, igrejas] = await Promise.all([
    prisma.featureFlag.findMany({ orderBy: { chave: "asc" } }),
    prisma.igreja.findMany({ orderBy: [{ ehSede: "desc" }, { nome: "asc" }] }),
  ]);

  const flagsMap = new Map(flags.map((f) => [f.chave, f]));

  return (
    <ModuloShell
      titulo="Configurações"
      descricao="Feature flags, papéis e RBAC, integrações, igrejas cadastradas."
      stats={[
        { label: "Igrejas", valor: igrejas.length, ref: "Sede + congregações" },
        {
          label: "Feature flags",
          valor: flags.length,
          ref: `${flags.filter((f) => f.habilitada).length} ativas`,
        },
        { label: "Papéis", valor: 8, ref: "SUPER_ADMIN até MEMBRO" },
        { label: "Integrações", valor: 3, ref: "Safe2Pay · Push · MK" },
      ]}
    >
      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Feature flags
        </h2>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold">Flags do sistema</h3>
          <div className="space-y-2">
            {FLAGS_SUGERIDAS.map((s) => {
              const flag = flagsMap.get(s.chave);
              const habilitada = flag?.habilitada ?? false;
              return (
                <div
                  key={s.chave}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-secondary/20 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs">{s.chave}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                  <form
                    action={toggleFlagAction.bind(null, s.chave, !habilitada)}
                  >
                    <button
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        habilitada
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-secondary/60 text-muted-foreground"
                      }`}
                      type="submit"
                    >
                      {habilitada ? "✓ Ativa" : "Desativada"}
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </div>

        {flags.filter(
          (f) => !FLAGS_SUGERIDAS.some((s) => s.chave === f.chave),
        ).length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold">Flags customizadas</h3>
            <div className="space-y-2">
              {flags
                .filter(
                  (f) => !FLAGS_SUGERIDAS.some((s) => s.chave === f.chave),
                )
                .map((f) => (
                  <div
                    key={f.chave}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-secondary/20 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs">{f.chave}</p>
                      {f.descricao && (
                        <p className="text-xs text-muted-foreground">
                          {f.descricao}
                        </p>
                      )}
                    </div>
                    <form
                      action={toggleFlagAction.bind(null, f.chave, !f.habilitada)}
                    >
                      <button
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          f.habilitada
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-secondary/60 text-muted-foreground"
                        }`}
                        type="submit"
                      >
                        {f.habilitada ? "✓ Ativa" : "Desativada"}
                      </button>
                    </form>
                    <form action={excluirFlagAction.bind(null, f.chave)}>
                      <button
                        className="rounded-full bg-destructive/15 px-3 py-1 text-xs text-destructive"
                        type="submit"
                      >
                        ✕
                      </button>
                    </form>
                  </div>
                ))}
            </div>
          </div>
        )}

        <details className="rounded-2xl border border-border bg-card p-5">
          <summary className="cursor-pointer text-sm font-semibold">
            Criar flag customizada
          </summary>
          <form action={criarFlagAction} className="mt-3 space-y-3">
            <Field label="Chave (SCREAMING_SNAKE_CASE)" required>
              <Input name="chave" placeholder="MINHA_FLAG_CUSTOM" required />
            </Field>
            <Field label="Descrição">
              <Input name="descricao" placeholder="O que essa flag controla?" />
            </Field>
            <Button type="submit">Criar</Button>
          </form>
        </details>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Igrejas ({igrejas.length})
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {igrejas.map((i) => (
            <div
              key={i.id}
              className={`rounded-2xl border bg-card p-4 ${
                i.ehSede ? "border-brand-orange/40" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{i.nome}</h3>
                {i.ehSede && (
                  <span className="rounded-full bg-brand-orange/15 px-2 py-0.5 text-xs uppercase tracking-widest text-brand-orange">
                    Sede
                  </span>
                )}
              </div>
              {i.apelido && (
                <p className="text-xs text-muted-foreground">{i.apelido}</p>
              )}
              {i.endereco && (
                <p className="mt-2 text-xs text-muted-foreground">
                  📍 {i.endereco}
                </p>
              )}
              {i.cidade && (
                <p className="text-xs text-muted-foreground">
                  {i.cidade}
                  {i.estado && ` · ${i.estado}`}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </ModuloShell>
  );
}
