// Calculs de paris — fonctions pures, aucune I/O.
// La martingale : pour le pari #n d'une série visant un gain net T, avec S = somme
// des mises précédentes, on mise (n·T + S)/(cote−1). Un pari unique = cas n=1, S=0.

export const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Mise martingale pour le pari #n (cible T, somme mises précédentes S). */
export function computeStake(
  n: number,
  targetGain: number,
  sumPrevStakes: number,
  odds: number
): number {
  return round2((n * targetGain + sumPrevStakes) / (odds - 1));
}

/** Gain net si ce pari gagne : mise·cote − mise − S. */
export function computePotentialNet(
  stake: number,
  odds: number,
  sumPrevStakes: number
): number {
  return round2(stake * odds - stake - sumPrevStakes);
}

/** Pari unique : objectif (gain net) depuis la mise → mise·(cote−1). */
export function objectiveFromStake(stake: number, odds: number): number {
  return round2(stake * (odds - 1));
}

/** Pari unique : mise nécessaire pour un objectif → objectif/(cote−1). */
export function stakeFromObjective(objective: number, odds: number): number {
  return round2(objective / (odds - 1));
}
