import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { formatEuros, formatPercent } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
} from "lucide-react";

interface StatsCardsProps {
  stats: {
    netGain: number;
    roi: number;
    totalStakes: number;
    activeSeriesCount: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const isPositive = stats.netGain >= 0;
  const roiPositive = stats.roi >= 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {/* Gain net */}
      <Card className="border-0 bg-[#1e293b] shadow-lg">
        <CardContent className="p-3 md:p-5">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full ${
                isPositive ? "bg-emerald-500/20" : "bg-red-500/20"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-emerald-400" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 md:h-4 md:w-4 text-red-400" />
              )}
            </div>
            <span className="text-xs md:text-sm text-slate-400 font-medium">
              Gain net
            </span>
          </div>
          <div
            className={`text-xl md:text-2xl font-bold ${
              isPositive ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {formatEuros(stats.netGain)}
          </div>
        </CardContent>
      </Card>

      {/* ROI */}
      <Card className="border-0 bg-[#1e293b] shadow-lg">
        <CardContent className="p-3 md:p-5">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full ${
                roiPositive ? "bg-emerald-500/20" : "bg-red-500/20"
              }`}
            >
              <Target
                className={`h-3.5 w-3.5 md:h-4 md:w-4 ${
                  roiPositive ? "text-emerald-400" : "text-red-400"
                }`}
              />
            </div>
            <span className="text-xs md:text-sm text-slate-400 font-medium">
              ROI
            </span>
          </div>
          <div
            className={`text-xl md:text-2xl font-bold ${
              roiPositive ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {formatPercent(stats.roi)}
          </div>
        </CardContent>
      </Card>

      {/* Mise totale */}
      <Card className="border-0 bg-[#1e293b] shadow-lg">
        <CardContent className="p-3 md:p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-blue-500/20">
              <Activity className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-400" />
            </div>
            <span className="text-xs md:text-sm text-slate-400 font-medium">
              Mise totale
            </span>
          </div>
          <div className="text-xl md:text-2xl font-bold text-slate-100">
            {formatEuros(stats.totalStakes)}
          </div>
        </CardContent>
      </Card>

      {/* Séries en cours */}
      <Card className="border-0 bg-[#1e293b] shadow-lg">
        <CardContent className="p-3 md:p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-purple-500/20">
              <Activity className="h-3.5 w-3.5 md:h-4 md:w-4 text-purple-400" />
            </div>
            <span className="text-xs md:text-sm text-slate-400 font-medium">
              Séries actives
            </span>
          </div>
          <div className="text-xl md:text-2xl font-bold text-slate-100">
            {stats.activeSeriesCount}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
