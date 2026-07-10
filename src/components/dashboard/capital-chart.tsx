"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from "recharts";
import { cn, formatEuros } from "@/lib/utils";

interface CapitalChartProps {
  data: {
    date: string;
    capital: number;
    deposits: number;
    valeur: number;
    encaisse: number;
  }[];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}`;
}

type Point = CapitalChartProps["data"][number] & {
  timestamp: number;
  profit: number;
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Point }[];
}) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  const profitPositive = p.profit >= 0;

  return (
    <div className="rounded-lg bg-background border border-border px-3 py-2 shadow-lg space-y-0.5">
      <p className="text-xs text-muted-foreground">{formatDate(p.date)}</p>
      <p className="text-sm font-bold text-foreground">
        Valeur : {formatEuros(p.valeur)}
      </p>
      <p className="text-[11px] text-muted-foreground">
        Capital : {formatEuros(p.capital)}
        {p.encaisse > 0 && ` · encaissé ${formatEuros(p.encaisse)}`}
      </p>
      <p
        className={cn(
          "text-xs font-semibold",
          profitPositive ? "text-primary" : "text-destructive"
        )}
      >
        Bénéfice : {profitPositive ? "+" : ""}
        {formatEuros(p.profit)}
      </p>
    </div>
  );
}

export function CapitalChart({ data }: CapitalChartProps) {
  const points = useMemo<Point[]>(
    () =>
      data.map((d) => ({
        ...d,
        timestamp: new Date(d.date).getTime(),
        profit: Math.round((d.valeur - d.deposits) * 100) / 100,
      })),
    [data]
  );

  const last = points[points.length - 1];
  const winning = (last?.profit ?? 0) >= 0;
  const gradId = winning ? "zoneUp" : "zoneDown";
  const zoneColor = winning ? "var(--color-primary)" : "var(--color-destructive)";

  // Deposit events only — withdrawals are now shown as the amber area.
  const depots = useMemo(() => {
    const out: { ts: number; y: number }[] = [];
    for (let i = 1; i < points.length; i++) {
      if (points[i].deposits > points[i - 1].deposits) {
        out.push({ ts: points[i].timestamp, y: points[i].valeur });
      }
    }
    return out;
  }, [points]);

  const domain = useMemo<[number, number]>(() => {
    if (points.length === 0) return [0, 1];
    const ts = points.map((d) => d.timestamp);
    return [Math.min(...ts), Math.max(...ts)];
  }, [points]);

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Header: bénéfice + encaissé */}
      <div className="flex items-center justify-between text-xs flex-shrink-0">
        <span
          className={cn(
            "font-bold",
            winning ? "text-primary" : "text-destructive"
          )}
        >
          Bénéfice {winning ? "+" : ""}
          {formatEuros(last?.profit ?? 0)}
        </span>
        {(last?.encaisse ?? 0) > 0 && (
          <span className="text-warning font-medium">
            Encaissé {formatEuros(last!.encaisse)}
          </span>
        )}
      </div>

      {/* Chart */}
      {points.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Aucune donnée
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={points}
              stackOffset="none"
              margin={{ top: 8, right: 6, left: -18, bottom: 0 }}
            >
              <defs>
                <linearGradient id="zoneUp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="zoneDown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-destructive)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-destructive)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="zoneRetrait" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-warning)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--color-warning)" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-card)" />
              <XAxis dataKey="timestamp" type="number" domain={domain} hide />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              {/* Hero curve: total value (capital + encaissé), filled, colored
                  green/red by current profit sign. */}
              <Area
                type="monotone"
                dataKey="valeur"
                stroke={zoneColor}
                strokeWidth={2.5}
                fill={`url(#${gradId})`}
                animationDuration={900}
                animationEasing="ease-out"
              />
              {/* Withdrawals band: cumulative encaissé (banked profit), amber,
                  drawn on top of the value area. Sits below the value curve
                  since valeur = capital + encaissé, capital ≥ 0. */}
              <Area
                type="monotone"
                dataKey="encaisse"
                stroke="var(--color-warning)"
                strokeWidth={1.5}
                fill="url(#zoneRetrait)"
                animationDuration={900}
                animationEasing="ease-out"
              />
              {/* Reference line: gross deposits (dashed, muted). The gap above
                  it reads as profit. */}
              <Area
                type="monotone"
                dataKey="deposits"
                stroke="var(--color-muted-foreground)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="transparent"
                isAnimationActive={false}
              />
              {depots.map((m, i) => (
                <ReferenceDot
                  key={i}
                  x={m.ts}
                  y={m.y}
                  r={3}
                  fill="var(--color-info)"
                  stroke="var(--color-background)"
                  strokeWidth={1.5}
                />
              ))}
              {last && (
                <ReferenceDot
                  x={last.timestamp}
                  y={last.valeur}
                  r={4}
                  fill={zoneColor}
                  stroke="var(--color-background)"
                  strokeWidth={2}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
