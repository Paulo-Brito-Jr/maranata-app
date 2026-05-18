"use client";

import { Field, Input, Select, Textarea, Button } from "@/components/ui/field";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function CelulaForm({
  action,
  igrejas,
  redes,
  celula,
  submitLabel = "Salvar",
}: {
  action: (formData: FormData) => Promise<void>;
  igrejas: { id: string; nome: string }[];
  redes: { id: string; nome: string }[];
  celula?: {
    igrejaId: string;
    redeId?: string | null;
    nome: string;
    descricao?: string | null;
    endereco?: string | null;
    cidade?: string | null;
    diaSemana?: number | null;
    horario?: string | null;
    status: string;
  };
  submitLabel?: string;
}) {
  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome da célula" required>
          <Input name="nome" defaultValue={celula?.nome ?? ""} required />
        </Field>
        <Field label="Igreja" required>
          <Select name="igrejaId" defaultValue={celula?.igrejaId ?? ""} required>
            <option value="">Selecione...</option>
            {igrejas.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Rede">
          <Select name="redeId" defaultValue={celula?.redeId ?? ""}>
            <option value="">Sem rede</option>
            {redes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue={celula?.status ?? "ATIVA"}>
            <option value="ATIVA">Ativa</option>
            <option value="INATIVA">Inativa</option>
            <option value="EM_MULTIPLICACAO">Em multiplicação</option>
            <option value="MULTIPLICADA">Multiplicada</option>
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Dia da semana">
          <Select name="diaSemana" defaultValue={String(celula?.diaSemana ?? "")}>
            <option value="">Não definido</option>
            {DIAS.map((d, i) => (
              <option key={i} value={i}>
                {d}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Horário" hint="ex: 19:30">
          <Input name="horario" defaultValue={celula?.horario ?? ""} placeholder="19:30" />
        </Field>
      </div>

      <Field label="Descrição">
        <Textarea name="descricao" rows={2} defaultValue={celula?.descricao ?? ""} />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Endereço">
          <Input name="endereco" defaultValue={celula?.endereco ?? ""} />
        </Field>
        <Field label="Cidade">
          <Input name="cidade" defaultValue={celula?.cidade ?? ""} />
        </Field>
      </div>

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
