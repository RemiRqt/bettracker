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
