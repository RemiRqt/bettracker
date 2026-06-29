"use client";

import { useState, useMemo } from "react";
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

type Period = "1m" | "3m" | "tout";

const PERIODS: { key: Period; label: string }[] = [
  { key: "1m", label: "1M" },
  { key: "3m", label: "3M" },
  { key: "tout", label: "Tout" },
];

function getPeriodStart(period: Period): Date | null {
  const now = new Date();
  switch (period) {
    case "1m":
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case "3m":
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case "tout":
      return null;
  }
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
  const [period, setPeriod] = useState<Period>("tout");

  const points = useMemo<Point[]>(() => {
    const start = getPeriodStart(period);
    const startTs = start?.getTime() ?? -Infinity;
    const withMeta = data.map((d) => ({
      ...d,
      timestamp: new Date(d.date).getTime(),
      profit: Math.round((d.valeur - d.deposits) * 100) / 100,
    }));
    const filtered = withMeta.filter((d) => d.timestamp >= startTs);
    // Keep at least the last known point so the chart is never empty
    if (filtered.length === 0 && withMeta.length > 0) {
      return [withMeta[withMeta.length - 1]];
    }
    return filtered;
  }, [data, period]);

  const last = points[points.length - 1];
  const winning = (last?.profit ?? 0) >= 0;
  const gradId = winning ? "zoneUp" : "zoneDown";
  const zoneColor = winning ? "var(--color-primary)" : "var(--color-destructive)";

  const markers = useMemo(() => {
    const out: { ts: number; y: number; type: "depot" | "retrait" }[] = [];
    for (let i = 1; i < points.length; i++) {
      if (points[i].deposits > points[i - 1].deposits) {
        out.push({ ts: points[i].timestamp, y: points[i].valeur, type: "depot" });
      }
      if (points[i].encaisse > points[i - 1].encaisse) {
        out.push({ ts: points[i].timestamp, y: points[i].valeur, type: "retrait" });
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

      {/* Period selector */}
      <div className="grid grid-cols-3 gap-1 flex-shrink-0">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={cn(
              "py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95",
              period === p.key
                ? "bg-primary/20 text-primary"
                : "bg-background text-muted-foreground hover:text-secondary-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
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
              key={period}
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
              {markers.map((m, i) => (
                <ReferenceDot
                  key={i}
                  x={m.ts}
                  y={m.y}
                  r={3}
                  fill={m.type === "depot" ? "var(--color-info)" : "var(--color-warning)"}
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
