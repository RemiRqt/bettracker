#!/usr/bin/env node
// Garde-fous anti-erreurs vécues (docs/regles/qualite.md), repris de ~/projects/_app-template et adaptés
// (pas de modules ici ; bettracker vit dans le schéma public du projet partagé). `--staged` : fichiers indexés (pre-commit) ; sinon tous les fichiers suivis + non suivis non ignorés.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const INTERDITS = [
  [/^\.claude\/settings\.local\.json$/, "réglages locaux Claude"],
  [/(^|\/)\.env(?!\.example$)(\..+)?$/, "fichier d'environnement (secrets) — seul .env.example est suivi"],
  [/(^|\/)(bun\.lockb?|yarn\.lock|pnpm-lock\.yaml)$/, "second lockfile — npm seulement (package-lock.json)"],
  [/\.tsbuildinfo$/, "cache TypeScript"],
  [/^\.vercel\//, "lien local Vercel"],
  [/^\.(perf|a11y)-last\.json$/, "résultat de mesure local"],
  [/(^|\/)\.DS_Store$/, "fichier macOS"],
  [/^(test-results|playwright-report)\//, "sortie Playwright"],
  [/\.(pem|key|p12)$/, "clé privée"],
  [/^supabase\/\.temp\//, "lien local Supabase (ref de projet)"],
];
const DEBUG = /^src\/app\/(.*\/)?\(?(debug|test|tests|tmp|temp|essai|sandbox|playground|demo|_dev)\)?\//i;
const SYSTEME = /^(NODE_ENV|CI|TZ|NEXT_RUNTIME|NEXT_PHASE|VERCEL(_.*)?|PORT|LEFTHOOK|PERF_.*|A11Y_JSON|CHROMIUM_PATH|PLAYWRIGHT_BROWSERS_PATH)$/;
// Migrations historiques (avant le 2026-11-13) : numérotées, gardées telles quelles (déjà appliquées en prod).
const MIGRATION_HISTORIQUE = /^supabase\/migrations\/000(0[1-9]|1\d|2[0-7])_[a-z0-9_]+\.sql$/; // 00001 à 00027, figées (déjà en prod)
const MIGRATION = /^supabase\/migrations\/(\d{14})_([a-z0-9_]+)\.sql$/;

function fichiersInterdits(fichiers) {
  return fichiers.flatMap((f) => INTERDITS.filter(([re]) => re.test(f)).map(([, pourquoi]) => `fichier interdit : ${f} (${pourquoi})`));
}

function routesDebug(fichiers, lire) {
  return fichiers
    .filter((f) => DEBUG.test(f) && !lire(f).includes("garde-fou: route-autorisee"))
    .map((f) => `route de debug : ${f} (supprimer, ou commentaire « garde-fou: route-autorisee » + raison)`);
}

function variablesEnv(fichiers, lire) {
  const exemple = new Set([...lire(".env.example").matchAll(/^#?\s*([A-Z0-9_]+)=/gm)].map((m) => m[1]));
  const erreurs = [];
  for (const f of fichiers.filter((x) => /^src\/.*\.(ts|tsx|mjs)$/.test(x) && !/\.test\./.test(x))) {
    const src = lire(f);
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
    for (const [, cle] of code.matchAll(/process\.env\.([A-Z0-9_]+)/g))
      if (!SYSTEME.test(cle) && !exemple.has(cle)) erreurs.push(`variable non documentée : ${cle} (${f}) → l'ajouter à .env.example`);
    if (/^["']use client["']/m.test(src) && /SERVICE_ROLE|SECRET_KEY|_SECRET\b|PRIVATE_KEY/.test(code))
      erreurs.push(`secret serveur référencé dans un composant client : ${f}`);
  }
  return erreurs;
}

function paquet(lire) {
  const pkg = JSON.parse(lire("package.json") || "{}");
  const erreurs = Object.entries(pkg.scripts ?? {})
    .filter(([, cmd]) => /\bnext lint\b/.test(cmd))
    .map(([nom]) => `script « ${nom} » utilise next lint (supprimé en Next 16) → eslint`);
  if (!String(pkg.packageManager ?? "").startsWith("npm@")) erreurs.push("package.json : packageManager doit être npm@x.y.z");
  return erreurs;
}

function gitignore(lire) {
  const gi = lire(".gitignore");
  return [".env*.local", ".claude/settings.local.json", ".vercel", "*.tsbuildinfo", "test-results", "supabase/.temp"]
    .filter((l) => !gi.includes(l))
    .map((l) => `.gitignore : ligne manquante « ${l} »`);
}

function debris(fichiers, lire) {
  return fichiers.filter((f) => /^(src|scripts)\/.*\.(ts|tsx|mjs)$/.test(f) && /\b(test|describe|it)\.only\(/.test(lire(f))).map((f) => `.only oublié : ${f}`);
}

/** Nouvelles migrations : nom horodaté, transaction, pas de politique laxiste ni de droit anon. */
function migrations(fichiers, lire) {
  const erreurs = [];
  for (const f of fichiers.filter((x) => x.startsWith("supabase/migrations/") && x.endsWith(".sql"))) {
    if (MIGRATION_HISTORIQUE.test(f)) continue;
    if (!MIGRATION.test(f)) {
      erreurs.push(`migration mal nommée : ${f} (attendu YYYYMMDDHHMMSS_<sujet>.sql, date -u +%Y%m%d%H%M%S)`);
      continue;
    }
    const sql = lire(f);
    const code = sql.replace(/--.*$/gm, "");
    if (!/^begin;$/m.test(sql) || !/^commit;$/m.test(sql)) erreurs.push(`${f} : doit être encadrée par « begin; » … « commit; »`);
    if (/using\s*\(\s*true\s*\)|with check\s*\(\s*true\s*\)|auth\.uid\(\)\s*is not null/i.test(code))
      erreurs.push(`${f} : politique RLS trop large (true / auth.uid() is not null) → (select auth.uid()) = user_id`);
    if (/\bto\s+(anon|public)\b/i.test(code.replace(/from\s+public\s*,?\s*anon/gi, ""))) erreurs.push(`${f} : aucun droit pour anon/public`);
    if (/\b(create|alter|drop)\s+(table|view|function|policy)[^;]*\b(house|finitopipo|tahiti|tableronde|cocktapp)\./i.test(code))
      erreurs.push(`${f} : jamais d'objet dans le schéma d'une autre app`);
    if (/security\s+definer/i.test(code) && !/search_path\s*(=|to)\s*''/i.test(code)) erreurs.push(`${f} : security definer sans « set search_path = '' »`);
  }
  return erreurs;
}

/** Tous les contrôles, purs (testés dans scripts/garde-fous.test.mjs). */
export function controler(fichiers, lire) {
  return [
    ...fichiersInterdits(fichiers),
    ...routesDebug(fichiers, lire),
    ...variablesEnv(fichiers, lire),
    ...paquet(lire),
    ...gitignore(lire),
    ...debris(fichiers, lire),
    ...migrations(fichiers, lire),
  ];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const git = (...a) => execFileSync("git", a, { encoding: "utf8" }).split("\n").filter(Boolean);
  const fichiers = process.argv.includes("--staged")
    ? git("diff", "--cached", "--name-only", "--diff-filter=ACMR")
    : git("ls-files", "--cached", "--others", "--exclude-standard").filter((f) => existsSync(f));
  const lire = (f) => (existsSync(f) ? readFileSync(f, "utf8") : "");
  const erreurs = [...new Set(controler(fichiers, lire))];
  if (erreurs.length) {
    console.log(`❌ Garde-fous (${erreurs.length}) :\n  - ${erreurs.join("\n  - ")}`);
    process.exit(1);
  }
  console.log("✅ Garde-fous OK");
}
