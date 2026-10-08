/** Textes des notifs push de suggestion de résultat. */

export function notificationText(input: {
  subject: string;
  betNumber: number;
  status: "suggested" | "postponed" | "expired";
  suggested: "gagne" | "perdu" | null;
  score: string | null;
}): { title: string; body: string } {
  const { subject, betNumber, status, suggested, score } = input;
  if (status === "postponed") return { title: `${subject} — match reporté`, body: "Valide ton pari à la main" };
  if (status === "expired") return { title: `${subject} — résultat introuvable`, body: "Valide ton pari à la main" };
  const title = `${subject} ${score ?? ""}`.trim();
  if (!suggested) return { title, body: `Match terminé — valide ton pari n°${betNumber}` };
  const word = suggested === "gagne" ? "gagné" : "perdu";
  return { title, body: `Pari n°${betNumber} ${word} ? Confirme en un tap` };
}
