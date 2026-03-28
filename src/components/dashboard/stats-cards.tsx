import Link from "next/link";
import { formatEuros, formatPercent } from "@/lib/utils";
import type { DashboardStats } from "@/lib/types";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Banknote,
  Clock,
  Sparkles,
  Activity,
  CheckCircle,
  XCircle,
  BarChart3,
  Coins,
} from "lucide-react";

interface StatsCardsProps {
  stats: DashboardStats;
}

function StatCard({
  label,
  value,
  color = "text-slate-100",
  icon,
}: {
  label: string;
  value: string | number;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-[#1e293b] px-3 py-2">
      <div className="flex items-center gap-1.5 mb-0.5">
        {icon}
        <span className="text-[10px] uppercase tracking-wide text-slate-400 leading-tight">
          {label}
        </span>
      </div>
      <div className={`text-sm font-bold ${color}`}>{value}</div>
    </div>
  );
}

export function StatsCards({ stats }: StatsCardsProps) {
  const capitalPositive = stats.capital >= 0;
  const roiPositive = stats.roi >= 0;

  return (
    <div className="space-y-1.5">
      {/* Capital en cours - hero card */}
      <div className="rounded-xl bg-[#1e293b] px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full ${
              capitalPositive ? "bg-emerald-500/20" : "bg-red-500/20"
            }`}
          >
            <Wallet
              className={`h-3.5 w-3.5 ${
                capitalPositive ? "text-emerald-400" : "text-red-400"
              }`}
            />
          </div>
          <span className="text-[10px] uppercase tracking-wide text-slate-400">
            Capital en cours
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className={`text-xl font-bold ${
              capitalPositive ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {formatEuros(stats.capital)}
          </span>
          <span
            className={`text-xs font-semibold ${
              stats.bettingProfit >= 0 ? "text-emerald-400/70" : "text-red-400/70"
            }`}
          >
            ({stats.bettingProfit >= 0 ? "+" : ""}{formatEuros(stats.bettingProfit)})
          </span>
        </div>
      </div>

      {/* Row 1: Total Mise / Total Gains / Rendement */}
      <div className="grid grid-cols-3 gap-1.5">
        <StatCard
          label="Total Mise"
          value={formatEuros(stats.totalStakes)}
          icon={<Banknote className="h-3.5 w-3.5 text-slate-400" />}
        />
        <StatCard
          label="Total Gains"
          value={formatEuros(stats.totalGains)}
          color="text-emerald-400"
          icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-400" />}
        />
        <StatCard
          label="Rendement"
          value={formatPercent(stats.roi)}
          color={roiPositive ? "text-emerald-400" : "text-red-400"}
          icon={
            roiPositive ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-400" />
            )
          }
        />
      </div>

      {/* Row 2: Mise en cours / Gains potentiels */}
      <div className="grid grid-cols-2 gap-1.5">
        <StatCard
          label="Mise en cours"
          value={formatEuros(stats.miseEnCours)}
          icon={<Clock className="h-3.5 w-3.5 text-amber-400" />}
          color="text-amber-400"
        />
        <StatCard
          label="Gains potentiels"
          value={formatEuros(stats.gainsPotentiels)}
          icon={<Sparkles className="h-3.5 w-3.5 text-emerald-400" />}
          color="text-emerald-400"
        />
      </div>

      {/* Row 3: En cours / Gagné / Perdu */}
      <div className="grid grid-cols-3 gap-1.5">
        <Link href="/series/new?filter=en_cours">
          <StatCard
            label="En cours"
            value={stats.parisEnCours}
            icon={<Activity className="h-3.5 w-3.5 text-blue-400" />}
            color="text-blue-400"
          />
        </Link>
        <Link href="/series/new?filter=gagne">
          <StatCard
            label="Gagné"
            value={stats.parisGagnes}
            icon={<CheckCircle className="h-3.5 w-3.5 text-emerald-400" />}
            color="text-emerald-400"
          />
        </Link>
        <Link href="/series/new?filter=perdu">
          <StatCard
            label="Perdu"
            value={stats.parisPerdu}
            icon={<XCircle className="h-3.5 w-3.5 text-red-400" />}
            color="text-red-400"
          />
        </Link>
      </div>

      {/* Row 4: Cote moyenne / Mise moyenne */}
      <div className="grid grid-cols-2 gap-1.5">
        <StatCard
          label="Cote moyenne"
          value={stats.coteMoyenne.toFixed(2)}
          icon={<BarChart3 className="h-3.5 w-3.5 text-slate-400" />}
        />
        <StatCard
          label="Mise moyenne"
          value={formatEuros(stats.miseMoyenne)}
          icon={<Coins className="h-3.5 w-3.5 text-slate-400" />}
        />
      </div>
    </div>
  );
}
