/**
 * Check if a series can be deleted.
 * Rule: only series with status "en_cours" containing exactly the bet #1
 * not yet validated can be deleted.
 */
export function canDeleteSeries(
  status: string,
  bets: { bet_number: number; result: string | null }[]
): boolean {
  return (
    status === "en_cours" &&
    bets.length === 1 &&
    bets[0].bet_number === 1 &&
    bets[0].result === null
  );
}
