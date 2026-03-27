"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface CapitalChartProps {
  data: { date: string; capital: number }[];
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
  payload?: { value: number; payload: { date: string } }[];
}) {
  if (!active || !payload || !payload.length) return null;

  const item = payload[0];
  return (
    <div className="rounded-lg bg-[#1e293b] border border-slate-700 px-3 py-2 shadow-lg">
      <p className="text-xs text-slate-400">{formatDate(item.payload.date)}</p>
      <p className="text-sm font-bold text-emerald-400">
        {item.value.toFixed(2)} &euro;
      </p>
    </div>
  );
}

export function CapitalChart({ data }: CapitalChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-slate-500">
        Aucune donn&eacute;e
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="capitalGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${v}\u00A0\u20AC`}
        />
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
  );
}
