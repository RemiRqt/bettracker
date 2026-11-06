export type Theme = "actuel" | "turf" | "creme";

export const THEME_COOKIE = "bt-theme";
export const DEFAULT_THEME: Theme = "actuel";

export const THEMES: { id: Theme; label: string; hint: string }[] = [
  { id: "actuel", label: "Actuel", hint: "Ardoise sombre, accent emerald" },
  { id: "turf", label: "Vert tapis", hint: "Pelouse profonde, accent or" },
  { id: "creme", label: "Clair papier", hint: "Fond clair, accent vert" },
];

export function isTheme(v: string | undefined): v is Theme {
  return v === "actuel" || v === "turf" || v === "creme";
}

/**
 * Couleurs hors tokens CSS (seule exception à la règle ESLint des couleurs en dur) :
 * meta theme-color et particules de confettis (dessinées en JS).
 */
export const THEME_COLOR_META = "#0f172a";
export const CONFETTI_COLORS = [
  "#10b981", "#34d399", "#3b82f6", "#60a5fa",
  "#f59e0b", "#fbbf24", "#a78bfa", "#e2e8f0",
];
