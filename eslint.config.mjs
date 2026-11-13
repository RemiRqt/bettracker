import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tseslint from "typescript-eslint";

// Règles maison (docs/regles/), reprises de ~/projects/_app-template et adaptées à BetTracker (pas de modules ;
// les composants passent par les actions serveur de src/actions).
// Chacune est verrouillée par src/lint-regles.test.ts (une mise à jour d'ESLint ne peut pas en désactiver une en silence).
// Ne JAMAIS désactiver une règle pour faire passer : corriger le code (eslint-disable seulement avec « -- raison »).

// eslint-config-next enregistre déjà les plugins @typescript-eslint et jsx-a11y : on ne reprend que les RÈGLES des presets.
const regles = (configs) => Object.assign({}, ...[configs].flat().map((c) => c.rules ?? {}));

const COULEUR_EN_DUR =
  "/#[0-9a-fA-F]{3,8}\\b|\\b(rgb|rgba|hsl|hsla|oklch)\\(|\\b(bg|text|border|ring|shadow|divide|outline|placeholder|decoration|accent|caret|fill|stroke|from|to|via)-((slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}|black|white)\\b/";
const MESSAGE_COULEUR = "Couleur en dur interdite : token de globals.css (bg-primary, text-muted-foreground…) ou src/lib/theme.ts. Voir docs/regles/design.md.";
const CLASSE_DARK = '/(^|\\s|")dark:/';
const TEXTE_ARBITRAIRE = "/\\btext-\\[\\d+(\\.\\d+)?(px|rem|em)\\]/";
const SAISIE_NATIVE = "/^(date|time|datetime-local|month|week|number|checkbox|radio|range)$/";

const ZOD_CLIENT = "zod complet interdit côté client (≈ 23 Ko) : zod/mini (docs/regles/architecture.md).";

const syntaxeInterdite = ({ dark = true, rechargement = true } = {}) => [
  "error",
  { selector: `Literal[value=${COULEUR_EN_DUR}]`, message: MESSAGE_COULEUR },
  { selector: `TemplateElement[value.raw=${COULEUR_EN_DUR}]`, message: MESSAGE_COULEUR },
  ...(dark
    ? [
        { selector: `Literal[value=${CLASSE_DARK}]`, message: "Classe dark: interdite : le sombre vit dans les variables de globals.css." },
        { selector: `TemplateElement[value.raw=${CLASSE_DARK}]`, message: "Classe dark: interdite : le sombre vit dans les variables de globals.css." },
      ]
    : []),
  { selector: `Literal[value=${TEXTE_ARBITRAIRE}]`, message: "Taille de texte arbitraire interdite : text-xs (12 px plancher), text-sm, text-base…" },
  {
    selector: `TemplateElement[value.raw=${TEXTE_ARBITRAIRE}]`,
    message: "Taille de texte arbitraire interdite : text-xs (12 px plancher), text-sm, text-base…",
  },
  { selector: "JSXOpeningElement[name.name='select']", message: "<select> natif interdit : kit/saisies." },
  {
    selector: `JSXOpeningElement[name.name='input'] > JSXAttribute[name.name='type'][value.value=${SAISIE_NATIVE}]`,
    message: "Saisie native interdite : kit/saisies.",
  },
  { selector: "CallExpression[callee.name=/^(alert|confirm|prompt)$/]", message: "alert/confirm/prompt interdits : kit/Confirmation ou toast." },
  {
    selector: "CallExpression[callee.object.name='window'][callee.property.name=/^(alert|confirm|prompt)$/]",
    message: "alert/confirm/prompt interdits : kit/Confirmation ou toast.",
  },
  {
    selector: "CallExpression[callee.object.name='router'][callee.property.name='refresh']",
    message: "router.refresh() interdit : mettre à jour le store / le cache SWR (état optimiste).",
  },
  ...(rechargement
    ? [
        {
          selector: "CallExpression[callee.object.name='location'][callee.property.name=/^(reload|assign)$/]",
          message: "Rechargement complet interdit (perte de saisie). Seule exception : components/pwa/ServiceWorkerRegister.",
        },
        {
          selector: "CallExpression[callee.object.object.name='window'][callee.object.property.name='location'][callee.property.name=/^(reload|assign)$/]",
          message: "Rechargement complet interdit (perte de saisie). Seule exception : components/pwa/ServiceWorkerRegister.",
        },
      ]
    : []),
  { selector: "Property[key.name=/^(maximumScale|userScalable)$/]", message: "Le zoom doit rester possible (WCAG 1.4.4)." },
  { selector: "Program:has(> ExpressionStatement[directive='use client']) ImportDeclaration[source.value='zod']", message: ZOD_CLIENT },
];

const IMPORTS_INTERDITS = {
  paths: [
    { name: "cn", message: "Paquet npm « cn » interdit : cn vient de @/lib/utils (piège shadcn add)." },
    { name: "tailwind-merge", message: "Interdit (8 Ko/écran) : cn de @/lib/utils." },
    { name: "sonner", message: "Interdit : toasts du kit (@/components/kit)." },
    { name: "react-hook-form", message: "Interdit : état local + zod/mini." },
    { name: "next/router", message: "Pages Router : utiliser next/navigation." },
  ],
};

// Les composants utilisent le client Supabase du navigateur (RLS) ; jamais le serveur.
const IMPORTS_COMPOSANTS = {
  ...IMPORTS_INTERDITS,
  patterns: [
    {
      group: ["@/lib/supabase/server", "@/lib/theme.server"],
      message: "Code serveur interdit dans un composant : passer par une route API ou une action serveur.",
    },
  ],
};

const TAILLE_FICHIER = ["error", { max: 300, skipBlankLines: true, skipComments: true }];

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    rules: {
      ...regles(tseslint.configs.strict),
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: { attributes: false } }],
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },

  {
    files: ["src/**/*.tsx"],
    rules: {
      ...regles(jsxA11y.flatConfigs.recommended),
      "jsx-a11y/label-has-associated-control": ["error", { controlComponents: ["Input", "Textarea"], assert: "either" }],
      "jsx-a11y/no-autofocus": ["error", { ignoreNonDOM: true }],
      // Logos d'équipes servis par des API tierces (crest football-data) : next/image demanderait de lister leurs domaines.
      "@next/next/no-img-element": "off",
    },
  },

  {
    rules: {
      "no-console": ["error", { allow: ["warn", "error", "info"] }],
      "no-debugger": "error",
      "no-await-in-loop": "error",
      "no-restricted-imports": ["error", IMPORTS_INTERDITS],
      eqeqeq: ["error", "smart"],
    },
  },

  { files: ["src/**/*.{ts,tsx}"], rules: { "no-restricted-syntax": syntaxeInterdite(), "max-lines": TAILLE_FICHIER } },
  { files: ["src/**/*.tsx"], rules: { "max-lines-per-function": ["error", { max: 200, skipBlankLines: true, skipComments: true }] } },
  { files: ["src/**/*.ts"], rules: { "max-lines-per-function": ["error", { max: 40, skipBlankLines: true, skipComments: true }] } },
  { files: ["src/components/**/*.{ts,tsx}"], rules: { "no-restricted-imports": ["error", IMPORTS_COMPOSANTS] } },

  // Exceptions (chacune justifiée).
  {
    files: ["src/components/ui/**"],
    rules: {
      "no-restricted-syntax": syntaxeInterdite({ dark: false }),
      "max-lines": "off",
      "max-lines-per-function": "off",
      "jsx-a11y/label-has-associated-control": "off", // Label générique : le contrôle est associé à l'usage (htmlFor)
    },
  }, // shadcn généré
  { files: ["src/lib/theme.ts", "src/components/styleguide/colors-section.tsx"], rules: { "no-restricted-syntax": "off" } }, // hex du manifeste, des graphiques et du nuancier
  { files: ["src/components/pwa/ServiceWorkerRegister.tsx"], rules: { "no-restricted-syntax": syntaxeInterdite({ rechargement: false }) } }, // rechargement maîtrisé
  {
    files: ["**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": "off",
      "max-lines": "off",
      "max-lines-per-function": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-await-in-loop": "off",
    },
  },
  { files: ["scripts/**", "*.config.{js,mjs,ts}"], rules: { "no-console": "off" } },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/**",
    "scripts/**",
    "src/lib/types/database.ts",
    "docs/**",
    "test-results/**",
    "node_modules/**",
    "supabase/**",
  ]),
]);
