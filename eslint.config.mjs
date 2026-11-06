import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Garde-fous de design (docs/regles/design.md), repris de finitopipo :
// ce que la machine peut vérifier l'est ici.

// Couleurs en dur : hexadécimal, rgb()/hsl()/oklch(), ou palette Tailwind brute (bg-blue-500…).
// Les tokens de l'app (indigo, plum…) n'ont pas de nuance : seule la palette Tailwind en a (-500).
const COULEUR_EN_DUR =
  "/#[0-9a-fA-F]{3,8}\\b|\\b(rgb|rgba|hsl|hsla|oklch)\\(|\\b(bg|text|border|ring|shadow|divide|outline|placeholder|decoration|accent|caret|fill|stroke|from|to|via)-((slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}|black|white)\\b/";
const MESSAGE_COULEUR = "Couleur en dur interdite : utiliser un token de globals.css (bg-primary, text-muted-foreground…) ou src/lib/theme.ts.";

const regleCouleur = (niveau) => [
  niveau,
  { selector: `Literal[value=${COULEUR_EN_DUR}]`, message: MESSAGE_COULEUR },
  { selector: `TemplateElement[value.raw=${COULEUR_EN_DUR}]`, message: MESSAGE_COULEUR },
];
const reglesTaille = (niveau) => ({
  // Fichier ≤ 300 lignes, composant ≤ 200 lignes : au-delà, découper.
  "max-lines": [niveau, { max: 300, skipBlankLines: true, skipComments: true }],
  "max-lines-per-function": [niveau, { max: 200, skipBlankLines: true, skipComments: true }],
});

// Les composants passent par les actions serveur (src/actions) ; jamais le client Supabase serveur.
const IMPORTS_SERVEUR = {
  patterns: [
    { group: ["@/lib/supabase/server", "@/lib/theme.server"], message: "Code serveur interdit dans un composant : passer par une route API ou une action serveur." },
  ],
};

const INTERFACE = ["src/components/**/*.{ts,tsx}", "src/app/**/*.tsx"];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Règles existantes du projet non visées par la migration : signalées, pas bloquantes.
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@next/next/no-img-element": "off",
      "@next/next/no-assign-module-variable": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      "react/no-unescaped-entities": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/use-memo": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
    },
  },
  { files: ["src/**/*.{ts,tsx}"], rules: { "no-restricted-syntax": regleCouleur("error") } },
  { files: INTERFACE, ignores: ["src/components/ui/**", "src/app/api/**"], rules: reglesTaille("error") },
  { files: ["src/components/**/*.{ts,tsx}"], rules: { "no-restricted-imports": ["error", IMPORTS_SERVEUR] } },
  // Seules exceptions aux couleurs en dur : src/lib/theme.ts et les tests.
  { files: ["src/lib/theme.ts", "src/**/*.test.ts", "src/components/styleguide/colors-section.tsx"], rules: { "no-restricted-syntax": "off" } },
  { files: ["src/**/*.test.ts"], rules: { "max-lines": "off", "max-lines-per-function": "off" } },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "public/**", "scripts/**", "supabase/**"]),
]);

export default eslintConfig;
