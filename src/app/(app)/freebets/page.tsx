import { getFreebets, getFreebetBets } from "@/actions/freebets";
import { FreebetForm } from "@/components/freebets/freebet-form";
import { FreebetList } from "@/components/freebets/freebet-list";
import { FreebetBetForm } from "@/components/freebets/freebet-bet-form";
import { FreebetBetsList } from "@/components/freebets/freebet-bets-list";
import { FreebetStatsCard } from "@/components/freebets/freebet-stats-card";

export default async function FreebetsPage() {
  const [freebets, freebetBets] = await Promise.all([
    getFreebets(),
    getFreebetBets(),
  ]);

  const totalBalance = freebets.reduce((s, f) => s + f.remaining_amount, 0);
  const totalUsed = freebetBets
    .filter((b) => b.result !== null)
    .reduce((s, b) => s + b.stake, 0);
  const realGains = freebetBets
    .filter((b) => b.result === "gagne")
    .reduce((s, b) => s + (b.stake * b.odds - b.stake), 0);

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-100">Freebets</h1>
          <p className="text-xs text-slate-400">
            Gérez vos crédits freebet et placez des paris
          </p>
        </div>
        <FreebetForm />
      </div>

      <FreebetStatsCard
        balance={Math.round(totalBalance * 100) / 100}
        used={Math.round(totalUsed * 100) / 100}
        realGains={Math.round(realGains * 100) / 100}
      />

      {freebets.length > 0 && <FreebetList freebets={freebets} />}

      {totalBalance > 0 && <FreebetBetForm totalBalance={totalBalance} />}

      {freebetBets.length > 0 && <FreebetBetsList bets={freebetBets} />}
    </div>
  );
}
