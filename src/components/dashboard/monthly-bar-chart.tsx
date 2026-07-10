"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { cn, formatEuros, formatPercent } from "@/lib/utils";

interface MonthlyBarChartProps {
  data: {
    month: string;
    profit: number;
    stake: number;
    roi: number;
    count: number;
  }[];
}

type Row = MonthlyBarChartProps["data"][number];

const MONTHS_SHORT = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];
const MONTHS_LONG = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function shortLabel(month: string) {
  const m = Number(month.slice(5, 7));
  return MONTHS_SHORT[m - 1] ?? month;
}

function fullLabel(month: string) {
  const y = month.slice(0, 4);
  const m = Number(month.slice(5, 7));
  return `${MONTHS_LONG[m - 1] ?? ""} ${y}`;
}

function BarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Row }[];
}) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  const positive = p.profit >= 0;

  return (
    <div className="rounded-lg bg-background border border-border px-3 py-2 shadow-lg space-y-0.5">
      <p className="text-xs text-muted-foreground">{fullLabel(p.month)}</p>
      <p
        className={cn(
          "text-sm font-bold",
          positive ? "text-primary" : "text-destructive"
        )}
      >
        ROI : {positive ? "+" : ""}
        {formatPercent(p.roi)}
      </p>
      <p className="text-xs text-foreground">
        Bénéf : {positive ? "+" : ""}
        {formatEuros(p.profit)}
      </p>
      <p className="text-[11px] text-muted-foreground">
        {p.count} pari{p.count > 1 ? "s" : ""}
      </p>
    </div>
  );
}

export function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Aucune donnée
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
          <XAxis
            dataKey="month"
            tickFormatter={shortLabel}
            tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis hide />
          <ReferenceLine y={0} stroke="var(--color-border)" />
          <Tooltip content={<BarTooltip />} cursor={{ fill: "var(--color-card)" }} />
          <Bar
            dataKey="profit"
            radius={[3, 3, 0, 0]}
            animationDuration={700}
            animationEasing="ease-out"
          >
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={
                  d.profit >= 0
                    ? "var(--color-primary)"
                    : "var(--color-destructive)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
