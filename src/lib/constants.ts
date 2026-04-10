export const BET_TYPES = {
  victoire: "Victoire",
  defaite: "Défaite",
  buteur: "Buteur",
} as const;

export const SERIES_STATUSES = {
  en_cours: "En cours",
  gagnee: "Gagnée",
  abandonnee: "Abandonnée",
} as const;

export const BET_RESULTS = {
  gagne: "Gagné",
  perdu: "Perdu",
} as const;

export const STATUS_COLORS = {
  en_cours: "bg-blue-100 text-blue-800",
  gagnee: "bg-green-100 text-green-800",
  abandonnee: "bg-red-100 text-red-800",
} as const;

export const SPORT_EMOJIS: Record<string, string> = {
  football: "\u26BD",
  tennis: "\uD83C\uDFBE",
  basketball: "\uD83C\uDFC0",
  basket: "\uD83C\uDFC0",
  rugby: "\uD83C\uDFC9",
  handball: "\uD83E\uDD3E",
  default: "\uD83C\uDFC6",
};

export const SPORTS = {
  football: "Football",
  tennis: "Tennis",
  rugby: "Rugby",
  basket: "Basket",
} as const;

export const FOOTBALL_DATA_COMPETITIONS = [
  { code: "FL1", name: "Ligue 1", flag: "\uD83C\uDDEB\uD83C\uDDF7" },
  { code: "PL", name: "Premier League", flag: "\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67\uDB40\uDC7F" },
  { code: "PD", name: "La Liga", flag: "\uD83C\uDDEA\uD83C\uDDF8" },
  { code: "SA", name: "Serie A", flag: "\uD83C\uDDEE\uD83C\uDDF9" },
  { code: "BL1", name: "Bundesliga", flag: "\uD83C\uDDE9\uD83C\uDDEA" },
  { code: "DED", name: "Eredivisie", flag: "\uD83C\uDDF3\uD83C\uDDF1" },
  { code: "PPL", name: "Primeira Liga", flag: "\uD83C\uDDF5\uD83C\uDDF9" },
  { code: "ELC", name: "Championship", flag: "\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67\uDB40\uDC7F" },
  { code: "CL", name: "Champions League", flag: "\uD83C\uDFC6" },
] as const;
