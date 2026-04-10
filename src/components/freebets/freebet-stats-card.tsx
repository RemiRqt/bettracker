import { formatEuros, formatPercent } from "@/lib/utils";
import { Ticket, TrendingUp, CircleDollarSign, BarChart3 } from "lucide-react";

interface FreebetStatsCardProps {
  balance: number;
  used: number;
  realGains: number;
}

export function FreebetStatsCard({ balance, used, realGains }: FreebetStatsCardProps) {
  const conversionRate = used > 0 ? (realGains / used) * 100 : 0;

  return (
    <div className="rounded-xl bg-[#1e293b] p-4 space-y-3">
      {/* Main: balance */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20">
          <Ticket className="h-4 w-4 text-amber-400" />
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wide text-slate-400">
            Freebets disponibles
          </span>
          <p className="text-xl font-bold text-amber-400">
            {formatEuros(balance)}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-[#0f172a] px-2.5 py-2">
          <div className="flex items-center gap-1 mb-0.5">
            <CircleDollarSign className="h-3 w-3 text-slate-400" />
            <span className="text-[10px] uppercase tracking-wide text-slate-400">
              Utilisé
            </span>
          </div>
          <p className="text-sm font-bold text-slate-100">
            {formatEuros(used)}
          </p>
        </div>
        <div className="rounded-lg bg-[#0f172a] px-2.5 py-2">
          <div className="flex items-center gap-1 mb-0.5">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] uppercase tracking-wide text-slate-400">
              Gagné
            </span>
          </div>
          <p className="text-sm font-bold text-emerald-400">
            {formatEuros(realGains)}
          </p>
        </div>
        <div className="rounded-lg bg-[#0f172a] px-2.5 py-2">
          <div className="flex items-center gap-1 mb-0.5">
            <BarChart3 className="h-3 w-3 text-blue-400" />
            <span className="text-[10px] uppercase tracking-wide text-slate-400">
              Conversion
            </span>
          </div>
          <p className="text-sm font-bold text-blue-400">
            {formatPercent(conversionRate)}
          </p>
        </div>
      </div>
    </div>
  );
}
