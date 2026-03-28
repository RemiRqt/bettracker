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
} from "recharts";
import { cn } from "@/lib/utils";

interface CapitalChartProps {
  data: { date: string; capital: number }[];
}

type Period = "1j" | "1s" | "1m" | "3m" | "tout";

const PERIODS: { key: Period; label: string }[] = [
  { key: "1j", label: "1J" },
  { key: "1s", label: "1S" },
  { key: "1m", label: "1M" },
  { key: "3m", label: "3M" },
  { key: "tout", label: "Tout" },
];

function getPeriodStart(period: Period): Date | null {
  const now = new Date();
  switch (period) {
    case "1j":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "1s":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
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
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; payload: { date: string; timestamp: number } }[];
}) {
  if (!active || !payload || !payload.length) return null;

  const item = payload[0];
  return (
    <div className="rounded-lg bg-[#1e293b] border border-slate-700 px-3 py-2 shadow-lg">
      <p className="text-xs text-slate-400">{formatDate(item.payload.date)}</p>
      <p className="text-sm font-bold text-emerald-400">
        {item.value.toFixed(2)} €
      </p>
    </div>
  );
}

export function CapitalChart({ data }: CapitalChartProps) {
  const [period, setPeriod] = useState<Period>("tout");

  const filteredData = useMemo(() => {
    const start = getPeriodStart(period);
    const withTimestamp = data.map((d) => ({
      ...d,
      timestamp: new Date(d.date).getTime(),
    }));

    if (!start) return withTimestamp;

    const startTs = start.getTime();
    const filtered = withTimestamp.filter((d) => d.timestamp >= startTs);

    // If filtering removes all data, find the last point before the cutoff
    // to show a starting value
    if (filtered.length === 0) {
      const before = withTimestamp.filter((d) => d.timestamp < startTs);
      if (before.length > 0) {
        return [before[before.length - 1]];
      }
    }

    return filtered;
  }, [data, period]);

  const domain = useMemo(() => {
    if (filteredData.length === 0) return [0, 1];
    const timestamps = filteredData.map((d) => d.timestamp);
    return [Math.min(...timestamps), Math.max(...timestamps)];
  }, [filteredData]);

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Period selector */}
      <div className="grid grid-cols-5 gap-1">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={cn(
              "py-1.5 rounded-lg text-xs font-semibold transition-colors",
              period === p.key
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-[#0f172a] text-slate-500 hover:text-slate-400"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      {filteredData.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
          Aucune donnée
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={filteredData}
              margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="capitalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={domain}
                hide
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="capital"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#capitalGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
