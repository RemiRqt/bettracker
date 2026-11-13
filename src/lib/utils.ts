import { clsx, type ClassValue } from "clsx";

// cn maison : clsx + résolution des conflits Tailwind utilisés par l'app (la dernière classe
// d'un même groupe gagne). Remplace tailwind-merge (8 Ko gzip sur chaque écran, au-delà du
// budget de perf). Les groupes couverts sont ceux du kit et des composants shadcn ; un conflit
// non couvert laisse les deux classes (comme sans cn).

const TAILLES_TEXTE = /^text-(xs|sm|base|lg|xl|\dxl|\[[\d.]+(px|rem|em)\])$/;
const GRAISSES = /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/;
const AFFICHAGE = /^(block|inline-block|inline|flex|inline-flex|grid|inline-grid|hidden|contents)$/;
const LARGEURS_BORDURE = /^border(-[trblxy])?(-\d+)?$/;
const STYLES_BORDURE = /^border-(solid|dashed|dotted|double|hidden|none)$/;
const LARGEURS_ANNEAU = /^ring(-\d+|-\[[^\]]+\])?$/;
const TAILLES_OMBRE = /^shadow(-(2xs|xs|sm|md|lg|xl|2xl|none|inner|card))?$/;
// Couleurs : tokens de globals.css, mots-clés, valeurs arbitraires.
const COULEUR =
  /^(inherit|current|transparent|black|white|background|foreground|card|popover|primary|secondary|muted|accent|destructive|info|warning|border|input|ring|overlay|chart-\d|sidebar-(background|foreground|primary|accent|border|ring))(-foreground)?(\/\d+)?$|^\[/;
// Propriétés à valeur unique (la plus longue d'abord : inset-x avant inset).
const PROPRIETES = [
  "min-h",
  "min-w",
  "max-h",
  "max-w",
  "size",
  "h",
  "w",
  "px",
  "py",
  "pt",
  "pr",
  "pb",
  "pl",
  "p",
  "mx",
  "my",
  "mt",
  "mr",
  "mb",
  "ml",
  "m",
  "gap-x",
  "gap-y",
  "gap",
  "opacity",
  "z",
  "inset-x",
  "inset-y",
  "inset",
  "top",
  "bottom",
  "left",
  "right",
  "items",
  "justify",
  "leading",
  "tracking",
  "field-sizing",
];
/** Préfixes dont la valeur est soit une couleur, soit autre chose (taille, style, alignement…). */
const A_COULEUR = ["text", "bg", "border", "ring", "shadow", "outline", "fill", "stroke"];

/** Groupe d'une classe à préfixe coloré : couleur, ou largeur/taille/style connus, sinon aucun. */
function groupeColore(prefixe: string, base: string): string | null {
  const valeur = base.slice(prefixe.length + 1);
  if (prefixe === "text" && TAILLES_TEXTE.test(base)) return "text-taille";
  if (prefixe === "border" && LARGEURS_BORDURE.test(base)) return `${base.replace(/-\d+$/, "")}-largeur`;
  if (prefixe === "border" && STYLES_BORDURE.test(base)) return "border-style";
  if (prefixe === "ring" && LARGEURS_ANNEAU.test(base)) return "ring-largeur";
  if (prefixe === "shadow" && TAILLES_OMBRE.test(base)) return "shadow-taille";
  return valeur && COULEUR.test(valeur) ? `${prefixe}-couleur` : null;
}

/** Groupe de conflit d'une classe (variantes comprises), ou null si inconnu. */
function groupe(classe: string): string | null {
  const i = classe.lastIndexOf(":");
  const variantes = classe.slice(0, i + 1);
  const base = classe.slice(i + 1).replace(/^-/, "");
  const prefixe = A_COULEUR.find((p) => base === p || base.startsWith(`${p}-`));
  if (prefixe) {
    const g = groupeColore(prefixe, base);
    return g && variantes + g;
  }
  if (GRAISSES.test(base)) return `${variantes}font-graisse`;
  if (base.startsWith("font-")) return `${variantes}font-famille`;
  if (AFFICHAGE.test(base)) return `${variantes}affichage`;
  if (base.startsWith("rounded")) return `${variantes}${base.match(/^rounded(-(tl|tr|bl|br|ss|se|es|ee|t|r|b|l|s|e)(?=-|$))?/)?.[0] ?? "rounded"}`;
  const p = PROPRIETES.find((prop) => base === prop || base.startsWith(`${prop}-`));
  return p ? `${variantes}${p}` : null;
}

const COTES_ARRONDI = ["t", "r", "b", "l", "tl", "tr", "bl", "br", "s", "e", "ss", "se", "es", "ee"].map((c) => `rounded-${c}`);
/** Un raccourci posé après une valeur plus précise la remplace (p-4 après py-6). */
const RACCOURCIS: Record<string, string[]> = {
  p: ["px", "py", "pt", "pr", "pb", "pl"],
  px: ["pr", "pl"],
  py: ["pt", "pb"],
  m: ["mx", "my", "mt", "mr", "mb", "ml"],
  mx: ["mr", "ml"],
  my: ["mt", "mb"],
  size: ["h", "w"],
  gap: ["gap-x", "gap-y"],
  inset: ["inset-x", "inset-y", "top", "right", "bottom", "left"],
  "inset-x": ["left", "right"],
  "inset-y": ["top", "bottom"],
  rounded: COTES_ARRONDI,
};

/** Fusionne des classes Tailwind (les dernières l'emportent en cas de conflit). */
export function cn(...classes: ClassValue[]): string {
  const liste = clsx(classes).split(" ").filter(Boolean);
  const vus = new Set<string>();
  const garde: string[] = [];
  for (let k = liste.length - 1; k >= 0; k--) {
    const g = groupe(liste[k]);
    if (g && vus.has(g)) continue;
    if (g) {
      vus.add(g);
      const variantes = g.slice(0, g.lastIndexOf(":") + 1);
      for (const couvert of RACCOURCIS[g.slice(variantes.length)] ?? []) vus.add(variantes + couvert);
    }
    garde.push(liste[k]);
  }
  return garde.reverse().join(" ");
}

export function formatEuros(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatPercent(value: number, digits: number = 1): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value / 100);
}
