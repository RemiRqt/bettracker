// Calculs purs du tableau de bord (sans accès base) : utilisés par l'action getDashboardStats.
import type { DashboardStats, Bet } from "@/lib/types";
import { computeMarketValue } from "@/lib/market-value";

export type StatsBet = Pick<
  Bet,
  "id" | "series_id" | "odds" | "stake" | "result" | "bet_number" | "potential_net" | "created_at" | "market_odds_best" | "market_odds_avg"
>;

export interface StatsInput {
  series: { status: string }[];
  bets: StatsBet[];
  transactions: { type: string; amount: number; created_at: string }[];
  freebets: { remaining_amount: number }[];
  freebetBets: { odds: number; stake: number; result: string | null; created_at: string }[];
}

type TimelineEntry =
  | { kind: "transaction"; created_at: string; type: string; amount: number }
  | { kind: "bet_settled"; created_at: string; result: string; stake: number; odds: number }
  | { kind: "freebet_settled"; created_at: string; result: string; stake: number; odds: number };

type Snapshot = {
  capital: number;
  deposits: number;
  valeur: number;
  encaisse: number;
};

const r2 = (n: number) => Math.round(n * 100) / 100;
const sumOf = <T>(items: T[], f: (item: T) => number) => items.reduce((sum, x) => sum + f(x), 0);

function transactionTotals(allTransactions: StatsInput["transactions"]) {
  const totalDeposits = allTransactions.filter((t) => t.type === "depot").reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = allTransactions.filter((t) => t.type === "retrait").reduce((sum, t) => sum + t.amount, 0);

  return { totalDeposits, totalWithdrawals };
}

function betTotals(allBets: StatsBet[]) {
  // --- Bets by category ---
  const settledBets = allBets.filter((b) => b.result !== null);
  const wonBets = allBets.filter((b) => b.result === "gagne");
  const pendingBets = allBets.filter((b) => b.result === null);

  // --- Capital en cours (net profit) ---
  const totalWon = sumOf(wonBets, (b) => b.stake * b.odds);
  const totalStakedSettled = sumOf(settledBets, (b) => b.stake);
  const bettingProfit = r2(totalWon - totalStakedSettled);
  // --- Total Mise (all stakes including pending) ---
  const totalStakes = r2(sumOf(allBets, (b) => b.stake));
  // --- Total Gains (sum of stake * odds for won bets) ---
  const totalGains = r2(totalWon);
  // --- Rendement = (total gains - total mise) / total mise * 100 ---
  const roi = totalStakes > 0 ? Math.round(((totalGains - totalStakes) / totalStakes) * 100000) / 1000 : 0;

  return {
    settledBets,
    pendingBets,
    bettingProfit,
    totalStakes,
    totalGains,
    roi,
    // --- Mise en cours (pending stakes) ---
    miseEnCours: r2(sumOf(pendingBets, (b) => b.stake)),
    // --- Gains potentiels (for pending bets: stake * odds) ---
    gainsPotentiels: r2(sumOf(pendingBets, (b) => b.stake * b.odds)),
    parisGagnes: wonBets.length,
    parisPerdu: allBets.filter((b) => b.result === "perdu").length,
  };
}

function betAverages(allBets: StatsBet[]) {
  const n = allBets.length;
  return {
    coteMoyenne: n > 0 ? r2(sumOf(allBets, (b) => b.odds) / n) : 0,
    miseMoyenne: n > 0 ? r2(sumOf(allBets, (b) => b.stake) / n) : 0,
  };
}

function freebetTotals(allFreebets: StatsInput["freebets"], allFreebetBets: StatsInput["freebetBets"]) {
  const wonFreebetBets = allFreebetBets.filter((b) => b.result === "gagne");
  const pendingFreebetBets = allFreebetBets.filter((b) => b.result === null);
  return {
    freebetBalance: r2(sumOf(allFreebets, (f) => f.remaining_amount)),
    freebetProfit: r2(sumOf(wonFreebetBets, (b) => b.stake * b.odds - b.stake)),
    freebetGainsPotentiels: r2(sumOf(pendingFreebetBets, (b) => b.stake * b.odds - b.stake)),
  };
}

export function computeDashboardStats({
  series,
  bets: allBets,
  transactions: allTransactions,
  freebets: allFreebets,
  freebetBets: allFreebetBets,
}: StatsInput): DashboardStats {
  const { totalDeposits, totalWithdrawals } = transactionTotals(allTransactions);
  const { settledBets, pendingBets, ...bets } = betTotals(allBets);
  const { freebetGainsPotentiels, ...freebets } = freebetTotals(allFreebets, allFreebetBets);

  // Capital including freebet profit
  const capitalWithFreebets = r2(totalDeposits - totalWithdrawals + bets.bettingProfit + freebets.freebetProfit);
  const capitalDisponible = r2(capitalWithFreebets - bets.miseEnCours);
  const objectifDeGain = r2(capitalDisponible + bets.gainsPotentiels + freebetGainsPotentiels);

  const timeline = buildTimeline(allTransactions, settledBets, allFreebetBets);

  return {
    ...bets,
    ...betAverages(allBets),
    ...freebets,
    capital: capitalWithFreebets,
    capitalDisponible,
    // --- Series en cours ---
    seriesEnCours: series.filter((s) => s.status === "en_cours").length,
    parisEnCours: pendingBets.length,
    totalDeposits,
    totalWithdrawals,
    objectifDeGain,
    capitalEvolution: computeCapitalEvolution(timeline),
    monthlyPnl: computeMonthlyPnl(timeline),
    marketValue: computeMarketValue(allBets),
  };
}

// --- Capital evolution + Invested evolution ---
// Capital = bankroll (deposits - withdrawals + winnings - losses)
// Invested = net deposits (deposits - withdrawals only) — the money the user put in
function buildTimeline(allTransactions: StatsInput["transactions"], settledBets: StatsBet[], allFreebetBets: StatsInput["freebetBets"]): TimelineEntry[] {
  const settledFreebetBets = allFreebetBets.filter((b) => b.result !== null);

  return [
    ...allTransactions.map((t) => ({
      kind: "transaction" as const,
      created_at: t.created_at,
      type: t.type,
      amount: t.amount,
    })),
    ...settledBets.map((b) => ({
      kind: "bet_settled" as const,
      created_at: b.created_at,
      result: b.result as string,
      stake: b.stake,
      odds: b.odds,
    })),
    ...settledFreebetBets.map((b) => ({
      kind: "freebet_settled" as const,
      created_at: b.created_at,
      result: b.result as string,
      stake: b.stake,
      odds: b.odds,
    })),
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

type Running = { capital: number; deposits: number; withdrawals: number };

/** Applique un évènement de la timeline au capital courant. */
function applyEntry(run: Running, entry: TimelineEntry) {
  if (entry.kind === "transaction") {
    if (entry.type === "depot") {
      run.capital += entry.amount;
      run.deposits += entry.amount;
    } else if (entry.type === "retrait") {
      run.capital -= entry.amount;
      run.withdrawals += entry.amount;
    }
  } else if (entry.kind === "bet_settled") {
    if (entry.result === "gagne") {
      run.capital += entry.stake * entry.odds - entry.stake;
    } else {
      run.capital -= entry.stake;
    }
  } else if (entry.kind === "freebet_settled") {
    // Freebet wins add profit to capital (not deposits)
    if (entry.result === "gagne") {
      run.capital += entry.stake * entry.odds - entry.stake;
    }
    // Freebet losses don't affect real capital
  }
}

/** Fill every day from first event to today */
function fillDays(dailySnapshot: Map<string, Snapshot>): ({ date: string } & Snapshot)[] {
  const capitalEvolution: ({ date: string } & Snapshot)[] = [];
  if (dailySnapshot.size === 0) return capitalEvolution;

  const sortedDays = [...dailySnapshot.keys()].sort();
  const startDate = new Date(sortedDays[0]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let prev: Snapshot = { capital: 0, deposits: 0, valeur: 0, encaisse: 0 };
  const current = new Date(startDate);

  while (current <= today) {
    const key = current.toISOString().slice(0, 10);
    const snap = dailySnapshot.get(key);
    if (snap) {
      prev = snap;
    }
    capitalEvolution.push({ date: `${key}T12:00:00`, ...prev });
    current.setDate(current.getDate() + 1);
  }
  return capitalEvolution;
}

function computeCapitalEvolution(timeline: TimelineEntry[]): DashboardStats["capitalEvolution"] {
  // Build daily snapshots from timeline events.
  // capital  = bankroll currently in the account
  // deposits = gross cumulative deposits (only grows)
  // encaisse = cumulative withdrawals (banked profit)
  // valeur   = capital + encaisse → unaffected by a withdrawal (money just
  //            moves from the account to "banked"), so the gap valeur - deposits
  //            reads as total lifetime winnings.
  const run: Running = { capital: 0, deposits: 0, withdrawals: 0 };
  const dailySnapshot = new Map<string, Snapshot>();

  for (const entry of timeline) {
    applyEntry(run, entry);
    const dayKey = entry.created_at.slice(0, 10);
    dailySnapshot.set(dayKey, {
      capital: r2(run.capital),
      deposits: r2(run.deposits),
      valeur: r2(run.capital + run.withdrawals),
      encaisse: r2(run.withdrawals),
    });
  }

  return fillDays(dailySnapshot);
}

type MonthAgg = { profit: number; stake: number; count: number };

/**
 * Aggregated from settled bets and freebets. profit = realized winnings
 * minus losses; freebet losses cost nothing. stake feeds the ROI denominator.
 */
function aggregateByMonth(timeline: TimelineEntry[]): Map<string, MonthAgg> {
  const monthAgg = new Map<string, MonthAgg>();
  for (const entry of timeline) {
    if (entry.kind === "transaction") continue;
    const key = entry.created_at.slice(0, 7); // YYYY-MM
    const cur = monthAgg.get(key) ?? { profit: 0, stake: 0, count: 0 };
    const won = entry.result === "gagne";
    if (entry.kind === "bet_settled") {
      cur.profit += won ? entry.stake * entry.odds - entry.stake : -entry.stake;
    } else {
      // freebet: win adds profit, loss costs nothing
      cur.profit += won ? entry.stake * entry.odds - entry.stake : 0;
    }
    cur.stake += entry.stake;
    cur.count += 1;
    monthAgg.set(key, cur);
  }
  return monthAgg;
}

// --- Monthly P/L + ROI (calendar months) ---
function computeMonthlyPnl(timeline: TimelineEntry[]): DashboardStats["monthlyPnl"] {
  const monthAgg = aggregateByMonth(timeline);
  const monthlyPnl: DashboardStats["monthlyPnl"] = [];
  if (monthAgg.size === 0) return monthlyPnl;

  const keys = [...monthAgg.keys()].sort();
  const [minY, minM] = keys[0].split("-").map(Number);
  const [maxY, maxM] = keys[keys.length - 1].split("-").map(Number);
  let y = minY;
  let m = minM;
  while (y < maxY || (y === maxY && m <= maxM)) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    const agg = monthAgg.get(key) ?? { profit: 0, stake: 0, count: 0 };
    monthlyPnl.push({
      month: key,
      profit: r2(agg.profit),
      stake: r2(agg.stake),
      roi: agg.stake > 0 ? Math.round((agg.profit / agg.stake) * 1000) / 10 : 0,
      count: agg.count,
    });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return monthlyPnl;
}
