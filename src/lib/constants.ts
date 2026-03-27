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
