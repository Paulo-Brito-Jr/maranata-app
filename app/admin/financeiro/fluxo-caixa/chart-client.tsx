"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

export type FluxoCaixaPoint = {
  data: string; // ISO date
  label: string; // dd/MM
  entradas: number;
  saidas: number;
  liquidoDia: number;
  saldoAcumulado: number;
};

function brl(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function FluxoCaixaChart({ data }: { data: FluxoCaixaPoint[] }) {
  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="gradSaldo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.685 0.193 39)" stopOpacity={0.6} />
              <stop offset="95%" stopColor="oklch(0.685 0.193 39)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="oklch(0.5 0 0 / 0.15)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            stroke="oklch(0.7 0 0)"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            stroke="oklch(0.7 0 0)"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={80}
            tickFormatter={(v: number) =>
              v.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
                maximumFractionDigits: 0,
                notation: Math.abs(v) >= 10000 ? "compact" : "standard",
              })
            }
          />
          <Tooltip
            contentStyle={{
              background: "oklch(0.18 0 0)",
              border: "1px solid oklch(0.3 0 0)",
              borderRadius: 12,
              fontSize: 12,
            }}
            labelStyle={{ color: "oklch(0.85 0 0)" }}
            formatter={(value: number, name: string) => {
              const labels: Record<string, string> = {
                saldoAcumulado: "Saldo acumulado",
                entradas: "Entradas no dia",
                saidas: "Saídas no dia",
                liquidoDia: "Líquido no dia",
              };
              return [brl(value), labels[name] ?? name];
            }}
          />
          <ReferenceLine y={0} stroke="oklch(0.5 0 0 / 0.3)" />
          <Area
            type="monotone"
            dataKey="saldoAcumulado"
            stroke="oklch(0.685 0.193 39)"
            strokeWidth={2}
            fill="url(#gradSaldo)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
