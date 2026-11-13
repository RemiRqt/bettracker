/**
 * Check if a series can be deleted.
 * Rule: only series with status "en_cours" that is either empty (no bets)
 * or contains exactly the bet #1 not yet validated can be deleted.
 */
export function canDeleteSeries(status: string, bets: { bet_number: number; result: string | null }[]): boolean {
  if (status !== "en_cours") return false;

  // Empty series (no bets placed yet)
  if (bets.length === 0) return true;

  // Only the first bet, still pending
  return bets.length === 1 && bets[0].bet_number === 1 && bets[0].result === null;
}
