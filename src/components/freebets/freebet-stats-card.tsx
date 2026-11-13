import { RollingNumber } from "@/components/ui/rolling-number";
import { Ticket, TrendingUp, CircleDollarSign, BarChart3 } from "lucide-react";

interface FreebetStatsCardProps {
  balance: number;
  used: number;
  realGains: number;
}

export function FreebetStatsCard({ balance, used, realGains }: FreebetStatsCardProps) {
  const conversionRate = used > 0 ? (realGains / used) * 100 : 0;

  return (
    <div className="space-y-3 rounded-xl border border-warning/15 bg-card p-4">
      {/* Main: balance */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/20">
          <Ticket className="h-4 w-4 text-warning" />
        </div>
        <div>
          <span className="text-2xs tracking-wide text-muted-foreground uppercase">Freebets disponibles</span>
          <RollingNumber value={balance} format="euros" className="block text-xl font-bold text-warning" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-background px-2.5 py-2">
          <div className="mb-0.5 flex items-center gap-1">
            <CircleDollarSign className="h-3 w-3 text-muted-foreground" />
            <span className="text-2xs tracking-wide text-muted-foreground uppercase">Utilisé</span>
          </div>
          <RollingNumber value={used} format="euros" className="block text-sm font-bold text-foreground" />
        </div>
        <div className="rounded-lg bg-background px-2.5 py-2">
          <div className="mb-0.5 flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-primary" />
            <span className="text-2xs tracking-wide text-muted-foreground uppercase">Gagné</span>
          </div>
          <RollingNumber value={realGains} format="euros" className="block text-sm font-bold text-primary" />
        </div>
        <div className="rounded-lg bg-background px-2.5 py-2">
          <div className="mb-0.5 flex items-center gap-1">
            <BarChart3 className="h-3 w-3 text-info" />
            <span className="text-2xs tracking-wide text-muted-foreground uppercase">Conversion</span>
          </div>
          <RollingNumber value={conversionRate} format="percent" className="block text-sm font-bold text-info" />
        </div>
      </div>
    </div>
  );
}
