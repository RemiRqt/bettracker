#!/usr/bin/env node
// Hook Claude Code (PreToolUse/Bash, .claude/settings.json) : refuse de contourner les hooks git
// (--no-verify, -n), l'ajout forcé de fichiers ignorés, et toute commande vers la base partagée de prod.
let entree = "";
process.stdin
  .on("data", (d) => (entree += d))
  .on("end", () => {
    const cmd = JSON.parse(entree || "{}").tool_input?.command ?? "";
    const refus = [
      [/\bgit\s+(commit|push)\b[^;&|]*(\s--no-verify\b|\s-(?!-)[a-zA-Z]*n[a-zA-Z]*\b)/, "ne pas contourner les hooks git (--no-verify) : corriger la cause."],
      [/\bgit\s+add\b[^;&|]*\s(-f|--force)\b/, "ne pas forcer l'ajout de fichiers ignorés."],
      [
        /\bsupabase\b[^;&|]*\bdb\s+push\b/,
        "jamais `db push` (base partagée, journal global) : migrations appliquées par la session principale (docs/regles/bdd.md).",
      ],
      [
        /\b(sperso|supabase)\b(?![^;&|]*\s--(linked|remote|local)\b)[^;&|]*\bdb\s+query\b(?![^;&|]*\s--(linked|remote|local)\b)/,
        "`db query` sans cible : préciser --linked (prod, CLI 2.x ; v3 : --remote --yes) ou --local. Par défaut la CLI 2.x vise la base LOCALE.",
      ],
      [/\bLEFTHOOK=0\b/, "ne pas désactiver lefthook en local."],
    ];
    for (const [re, raison] of refus)
      if (re.test(cmd)) {
        console.error(`Interdit : ${raison}`);
        process.exit(2);
      }
  });
