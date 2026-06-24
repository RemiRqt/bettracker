import Link from "next/link";
import { formatEuros } from "@/lib/utils";
import { RollingNumber } from "@/components/ui/rolling-number";
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
  Target,
  Ticket,
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
  value: React.ReactNode;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-[#1e293b] px-3 py-2 h-full">
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
  const capitalDispoPositive = stats.capitalDisponible >= 0;
  const roiPositive = stats.roi >= 0;

  return (
    <div className="space-y-1.5">
      {/* Capital disponible + Objectif de gain - hero card */}
      <div className="rounded-xl bg-[#1e293b] px-4 py-3 shadow-hard border border-emerald-500/15">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full ${
                  capitalDispoPositive ? "bg-emerald-500/20" : "bg-red-500/20"
                }`}
              >
                <Wallet
                  className={`h-3.5 w-3.5 ${
                    capitalDispoPositive ? "text-emerald-400" : "text-red-400"
                  }`}
                />
              </div>
              <span className="text-[10px] uppercase tracking-wide text-slate-400">
                Capital disponible
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <RollingNumber
                value={stats.capitalDisponible}
                format="euros"
                className={`text-xl font-bold ${
                  capitalDispoPositive ? "text-emerald-400" : "text-red-400"
                }`}
              />
              <span
                className={`text-xs font-semibold ${
                  stats.bettingProfit >= 0 ? "text-emerald-400/70" : "text-red-400/70"
                }`}
              >
                ({stats.bettingProfit >= 0 ? "+" : ""}{formatEuros(stats.bettingProfit)})
              </span>
            </div>
          </div>
          {stats.miseEnCours > 0 && (
            <div className="text-right">
              <div className="flex items-center gap-1 mb-1 justify-end">
                <Target className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-[10px] uppercase tracking-wide text-slate-400">
                  Objectif
                </span>
              </div>
              <RollingNumber
                value={stats.objectifDeGain}
                format="euros"
                className="text-lg font-bold text-blue-400"
              />
              <p className="text-[10px] text-slate-500">si tout gagné</p>
            </div>
          )}
        </div>
        {stats.freebetBalance > 0 && (
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-700/50">
            <Ticket className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs text-amber-400 font-medium">
              Freebets : {formatEuros(stats.freebetBalance)}
            </span>
            {stats.freebetProfit > 0 && (
              <span className="text-[10px] text-emerald-400/70 ml-auto">
                +{formatEuros(stats.freebetProfit)} gagné
              </span>
            )}
          </div>
        )}
      </div>

      {/* Row 1: Total Mise / Total Gains / Rendement */}
      <div className="grid grid-cols-3 gap-1.5">
        <StatCard
          label="Total Mise"
          value={<RollingNumber value={stats.totalStakes} format="euros" />}
          icon={<Banknote className="h-3.5 w-3.5 text-slate-400" />}
        />
        <StatCard
          label="Total Gains"
          value={<RollingNumber value={stats.totalGains} format="euros" />}
          color="text-emerald-400"
          icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-400" />}
        />
        <StatCard
          label="Rendement"
          value={
            <RollingNumber value={stats.roi} format="percent" digits={3} />
          }
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
          value={<RollingNumber value={stats.miseEnCours} format="euros" />}
          icon={<Clock className="h-3.5 w-3.5 text-amber-400" />}
          color="text-amber-400"
        />
        <StatCard
          label="Gains potentiels"
          value={<RollingNumber value={stats.gainsPotentiels} format="euros" />}
          icon={<Sparkles className="h-3.5 w-3.5 text-emerald-400" />}
          color="text-emerald-400"
        />
      </div>

      {/* Row 3: En cours / Gagné / Perdu */}
      <div className="grid grid-cols-3 gap-1.5">
        <Link
          href="/series/new?filter=en_cours"
          className="block transition-transform active:scale-95"
        >
          <StatCard
            label="En cours"
            value={<RollingNumber value={stats.parisEnCours} format="int" />}
            icon={<Activity className="h-3.5 w-3.5 text-blue-400" />}
            color="text-blue-400"
          />
        </Link>
        <Link
          href="/series/new?filter=gagne"
          className="block transition-transform active:scale-95"
        >
          <StatCard
            label="Gagné"
            value={<RollingNumber value={stats.parisGagnes} format="int" />}
            icon={<CheckCircle className="h-3.5 w-3.5 text-emerald-400" />}
            color="text-emerald-400"
          />
        </Link>
        <Link
          href="/series/new?filter=perdu"
          className="block transition-transform active:scale-95"
        >
          <StatCard
            label="Perdu"
            value={<RollingNumber value={stats.parisPerdu} format="int" />}
            icon={<XCircle className="h-3.5 w-3.5 text-red-400" />}
            color="text-red-400"
          />
        </Link>
      </div>

      {/* Row 4: Cote moyenne / Mise moyenne */}
      <div className="grid grid-cols-2 gap-1.5">
        <StatCard
          label="Cote moyenne"
          value={
            <RollingNumber
              value={stats.coteMoyenne}
              format="decimal"
              digits={2}
            />
          }
          icon={<BarChart3 className="h-3.5 w-3.5 text-slate-400" />}
        />
        <StatCard
          label="Mise moyenne"
          value={<RollingNumber value={stats.miseMoyenne} format="euros" />}
          icon={<Coins className="h-3.5 w-3.5 text-slate-400" />}
        />
      </div>
    </div>
  );
}
