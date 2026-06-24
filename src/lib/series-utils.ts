/**
 * Check if a series can be deleted.
 * Rule: only series with status "en_cours" that is either empty (no bets)
 * or contains exactly the bet #1 not yet validated can be deleted.
 */
export function canDeleteSeries(
  status: string,
  bets: { bet_number: number; result: string | null }[]
): boolean {
  if (status !== "en_cours") return false;

  // Empty series (no bets placed yet)
  if (bets.length === 0) return true;

  // Only the first bet, still pending
  return (
    bets.length === 1 &&
    bets[0].bet_number === 1 &&
    bets[0].result === null
  );
}

/**
 * Whether a series is empty (no bets yet). Used to surface the delete action
 * on the detail page where only empty series are deletable.
 */
export function isEmptySeries(
  bets: { bet_number: number; result: string | null }[]
): boolean {
  return bets.length === 0;
}
