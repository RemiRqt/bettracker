import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

// ESLint typé démarre à froid : > 5 s sur un runner GitHub au premier test.
const LENT = 30_000;

// Les règles maison d'eslint.config.mjs (reprises de ~/projects/_app-template), vérifiées sur des extraits : une mise à jour d'ESLint ou
// d'eslint-config-next ne peut pas en désactiver une en silence.
// Extraits virtuels (hors tsconfig) : sans information de type, donc règles typées coupées ici.
const TYPEES = ["no-floating-promises", "no-misused-promises", "await-thenable", "switch-exhaustiveness-check"];
const eslint = new ESLint({
  cwd: process.cwd(),
  overrideConfig: {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parserOptions: { projectService: false } },
    rules: Object.fromEntries(TYPEES.map((r) => [`@typescript-eslint/${r}`, "off"])),
  },
});
const erreurs = async (code: string, fichier = "src/components/essai/Essai.tsx", regle = "no-restricted-syntax") => {
  const [res] = await eslint.lintText(code, { filePath: fichier });
  return res!.messages.filter((m) => m.severity === 2 && m.ruleId === regle).length;
};

describe("couleurs et sombre", { timeout: LENT }, () => {
  it("refuse hex, rgb(), oklch(), palette Tailwind brute, text-white", async () => {
    for (const c of ["#ff0000", "rgba(0,0,0,.4)", "oklch(50% .1 200)", "bg-blue-500 p-2", "text-white", "divide-gray-200"])
      expect(await erreurs(`export const a = "${c}";`), c).toBe(1);
  });
  it("accepte les tokens", async () => {
    expect(await erreurs(`export const a = "bg-primary text-primary-foreground border-input bg-secondary text-destructive";`)).toBe(0);
  });
  it("refuse la palette brute sur shadow, outline, placeholder, decoration", async () => {
    for (const c of ["shadow-black", "outline-white", "placeholder-gray-400", "decoration-red-500"])
      expect(await erreurs(`export const a = "${c}";`), c).toBe(1);
  });
  it("refuse dark: hors ui/ (le sombre vit dans theme.css)", async () => {
    expect(await erreurs(`export const a = "bg-card dark:bg-muted";`)).toBe(1);
    expect(await erreurs(`export const a = "bg-card dark:bg-muted";`, "src/components/ui/x.tsx")).toBe(0);
  });
  it("autorise src/lib/theme.ts", async () => {
    expect(await erreurs(`export const a = "#0f172a";`, "src/lib/theme.ts")).toBe(0);
  });
});

describe("accessibilité et UX", { timeout: LENT }, () => {
  it("refuse les tailles de texte arbitraires", async () => {
    expect(await erreurs(`export const a = "text-[11px]";`)).toBe(1);
  });
  it("refuse <select> et les saisies natives date/number/checkbox", async () => {
    expect(await erreurs(`export const A = () => <select />;`)).toBe(1);
    expect(await erreurs(`export const A = () => <input type="date" />;`)).toBe(1);
    expect(await erreurs(`export const A = () => <input type="checkbox" />;`)).toBe(1);
    expect(await erreurs(`export const A = () => <input type="email" />;`)).toBe(0);
  });
  it("refuse alert/confirm et le blocage du zoom", async () => {
    expect(await erreurs(`export const f = () => window.confirm("x");`)).toBe(1);
    expect(await erreurs(`export const f = () => alert("x");`)).toBe(1);
    expect(await erreurs(`export const viewport = { maximumScale: 1 };`)).toBe(1);
  });
});

describe("architecture", { timeout: LENT }, () => {
  it("refuse zod complet dans un composant client (zod/mini)", async () => {
    const zod = `import { z } from "zod"; export const s = z.string();`;
    expect(await erreurs(`"use client";\n${zod}`, "src/components/essai/Formulaire.tsx")).toBe(1);
    expect(await erreurs(`"use client";\nimport { z } from "zod/mini"; export const s = z.string();`, "src/components/essai/Formulaire.tsx")).toBe(0);
    expect(await erreurs(zod, "src/app/api/essai/route.ts")).toBe(0);
  });
  it("refuse router.refresh() et location.reload()", async () => {
    expect(await erreurs(`declare const router: { refresh(): void }; router.refresh();`, "src/components/essai/a.ts")).toBe(1);
    expect(await erreurs(`window.location.reload();`, "src/components/essai/a.ts")).toBe(1);
  });
  it("refuse les paquets interdits (cn, sonner, react-hook-form)", async () => {
    for (const p of ["cn", "sonner", "react-hook-form", "tailwind-merge"])
      expect(await erreurs(`import x from "${p}";\nexport { x };`, "src/app/a.ts", "no-restricted-imports"), p).toBe(1);
  });
  it("un composant n'importe pas de code serveur", async () => {
    expect(await erreurs(`import { x } from "@/lib/supabase/server";\nexport { x };`, "src/components/essai/a.ts", "no-restricted-imports")).toBe(1);
    expect(await erreurs(`import { x } from "@/lib/supabase/server";\nexport { x };`, "src/app/api/essai/route.ts", "no-restricted-imports")).toBe(0);
  });
  it("refuse await dans une boucle (N+1)", async () => {
    expect(
      await erreurs(
        `export async function f(ids: string[], g: (i: string) => Promise<void>) { for (const i of ids) await g(i); }`,
        "src/lib/a.ts",
        "no-await-in-loop",
      ),
    ).toBe(1);
  });
});

describe("tailles", { timeout: LENT }, () => {
  it("fichier > 300 lignes refusé", async () => {
    const code = Array.from({ length: 310 }, (_, i) => `export const v${i} = ${i};`).join("\n");
    expect(await erreurs(code, "src/components/essai/Long.tsx", "max-lines")).toBe(1);
  });
  it("composant > 200 lignes refusé", async () => {
    const corps = Array.from({ length: 205 }, (_, i) => `  const v${i} = ${i};`).join("\n");
    expect(await erreurs(`export function Gros() {\n${corps}\n  return null;\n}`, "src/components/essai/Gros.tsx", "max-lines-per-function")).toBe(1);
  });
  it("fonction de logique .ts > 40 lignes refusée", async () => {
    const corps = Array.from({ length: 45 }, (_, i) => `  const v${i} = ${i};`).join("\n");
    expect(await erreurs(`export function calcul() {\n${corps}\n  return 0;\n}`, "src/lib/essai.ts", "max-lines-per-function")).toBe(1);
  });
});
