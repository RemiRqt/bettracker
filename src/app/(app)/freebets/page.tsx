import { getFreebets, getFreebetBets } from "@/actions/freebets";
import { FreebetForm } from "@/components/freebets/freebet-form";
import { FreebetList } from "@/components/freebets/freebet-list";
import { FreebetBetForm } from "@/components/freebets/freebet-bet-form";
import { FreebetBetsList } from "@/components/freebets/freebet-bets-list";

export default async function FreebetsPage() {
  const [freebets, freebetBets] = await Promise.all([
    getFreebets(),
    getFreebetBets(),
  ]);

  const availableFreebets = freebets.filter((f) => f.remaining_amount > 0);

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-lg font-bold text-slate-100">Freebets</h1>
        <p className="text-xs text-slate-400">
          Gérez vos crédits freebet et placez des paris
        </p>
      </div>

      <FreebetForm />

      {freebets.length > 0 && <FreebetList freebets={freebets} />}

      {availableFreebets.length > 0 && (
        <FreebetBetForm freebets={availableFreebets} />
      )}

      {freebetBets.length > 0 && <FreebetBetsList bets={freebetBets} />}
    </div>
  );
}
