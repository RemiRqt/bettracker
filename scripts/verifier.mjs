#!/usr/bin/env node
// npm run verifier [-- --sans-build]   (ou VERIFIER_SANS_BUILD=1)   (repris de ~/projects/_app-template)
// Étapes rapides en parallèle, puis build (seulement si tout est vert).
// Sortie courte : 1 ligne par étape, fin du log seulement pour les échecs.
// Le build reçoit des valeurs FACTICES pour les variables publiques absentes (CI, worktree d'agent) : on vérifie
// que l'app se construit, pas l'accès réel. Jamais de secret ici.
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const args = new Set(process.argv.slice(2));
// Bac à sable de l'agent de nuit : next/font n'y joint pas Google Fonts, le build local échoue → VERIFIER_SANS_BUILD=1
// (le build Vercel de prévisualisation fait foi). Jamais LEFTHOOK=0 ni --no-verify.
if (process.env.VERIFIER_SANS_BUILD === "1") args.add("--sans-build");
const ETAPES = [
  ["garde-fous", "node scripts/garde-fous.mjs"],
  ["typecheck", "npm run -s typecheck"],
  ["lint", "npm run -s lint"],
  ["format", "npm run -s format:check"],
  ["tests", "npm run -s test"],
  ["knip", "npm run -s knip"],
];

// Seules les variables lues au BUILD (NEXT_PUBLIC_*, inlinées) ; les secrets serveur ne servent qu'à l'exécution.
const FACTICES = {
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "factice",
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: "factice",
};
/** Noms (jamais les valeurs) des variables déjà fournies par .env.local / .env.production.local. */
const nomsLocaux = new Set(
  [".env.production.local", ".env.local"]
    .filter((f) => existsSync(f))
    .flatMap((f) => [...readFileSync(f, "utf8").matchAll(/^([A-Z0-9_]+)=/gm)].map((m) => m[1])),
);
const factices = Object.fromEntries(Object.entries(FACTICES).filter(([k]) => !process.env[k] && !nomsLocaux.has(k)));

const lancer = ([nom, cmd], env = {}) =>
  new Promise((ok) => {
    const t0 = Date.now();
    let sortie = "";
    const p = spawn(cmd, { shell: true, env: { ...process.env, ...env, FORCE_COLOR: "0" } });
    p.stdout.on("data", (d) => (sortie += d));
    p.stderr.on("data", (d) => (sortie += d));
    p.on("close", (code) => {
      console.log(`${code === 0 ? "✅" : "❌"} ${nom.padEnd(11)} ${((Date.now() - t0) / 1000).toFixed(1)} s`);
      ok({ nom, code, sortie });
    });
  });

const rapport = (res) => {
  const ko = res.filter((r) => r.code !== 0);
  for (const r of ko) console.log(`\n── ${r.nom} ──\n${r.sortie.trim().split("\n").slice(-60).join("\n")}`);
  return ko.length;
};

const t0 = Date.now();
if (rapport(await Promise.all(ETAPES.map((e) => lancer(e))))) {
  console.log("\nVERIFIER KO — corriger puis relancer.");
  process.exit(1);
}
if (!args.has("--sans-build") && Object.keys(factices).length) console.log(`   (build avec valeurs factices pour : ${Object.keys(factices).join(", ")})`);
if (!args.has("--sans-build") && rapport([await lancer(["build", "npx next build --webpack"], factices)])) process.exit(1);
console.log(`\nVERIFIER OK en ${((Date.now() - t0) / 1000).toFixed(0)} s`);
