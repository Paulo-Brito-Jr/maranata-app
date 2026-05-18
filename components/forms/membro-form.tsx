"use client";

import { Field, Input, Select, Textarea, Button } from "@/components/ui/field";

type Igreja = { id: string; nome: string };

type MembroPayload = {
  id?: string;
  igrejaId: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  cpf?: string | null;
  profissao?: string | null;
  estadoCivil?: string | null;
  dataNascimento?: Date | string | null;
  dataBatismo?: Date | string | null;
  dataConversao?: Date | string | null;
  status: string;
  endereco?: string | null;
  cidade?: string | null;
  observacoes?: string | null;
};

function toDate(v: Date | string | null | undefined): string {
  if (!v) return "";
  const d = typeof v === "string" ? new Date(v) : v;
  return d.toISOString().slice(0, 10);
}

export function MembroForm({
  action,
  igrejas,
  membro,
  submitLabel = "Salvar",
}: {
  action: (formData: FormData) => Promise<void>;
  igrejas: Igreja[];
  membro?: MembroPayload;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome completo" required>
          <Input name="nome" defaultValue={membro?.nome ?? ""} required />
        </Field>
        <Field label="Igreja" required>
          <Select name="igrejaId" defaultValue={membro?.igrejaId ?? ""} required>
            <option value="">Selecione...</option>
            {igrejas.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="E-mail">
          <Input type="email" name="email" defaultValue={membro?.email ?? ""} />
        </Field>
        <Field label="Telefone">
          <Input type="tel" name="telefone" defaultValue={membro?.telefone ?? ""} />
        </Field>
        <Field label="CPF">
          <Input name="cpf" defaultValue={membro?.cpf ?? ""} />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Data de nascimento">
          <Input type="date" name="dataNascimento" defaultValue={toDate(membro?.dataNascimento)} />
        </Field>
        <Field label="Data de conversão">
          <Input type="date" name="dataConversao" defaultValue={toDate(membro?.dataConversao)} />
        </Field>
        <Field label="Data de batismo">
          <Input type="date" name="dataBatismo" defaultValue={toDate(membro?.dataBatismo)} />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Profissão">
          <Input name="profissao" defaultValue={membro?.profissao ?? ""} />
        </Field>
        <Field label="Estado civil">
          <Select name="estadoCivil" defaultValue={membro?.estadoCivil ?? ""}>
            <option value="">Não informar</option>
            <option value="SOLTEIRO">Solteiro(a)</option>
            <option value="CASADO">Casado(a)</option>
            <option value="DIVORCIADO">Divorciado(a)</option>
            <option value="VIUVO">Viúvo(a)</option>
            <option value="UNIAO_ESTAVEL">União estável</option>
          </Select>
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue={membro?.status ?? "ATIVO"}>
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
            <option value="TRANSFERIDO">Transferido</option>
            <option value="AFASTADO">Afastado</option>
            <option value="FALECIDO">Falecido</option>
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Endereço">
          <Input name="endereco" defaultValue={membro?.endereco ?? ""} />
        </Field>
        <Field label="Cidade">
          <Input name="cidade" defaultValue={membro?.cidade ?? ""} />
        </Field>
      </div>

      <Field label="Observações">
        <Textarea name="observacoes" rows={3} defaultValue={membro?.observacoes ?? ""} />
      </Field>

      <div className="flex gap-3">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
