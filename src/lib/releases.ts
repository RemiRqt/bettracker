/**
 * Nouveautés affichées en onboarding à la 1re ouverture après une mise à jour.
 * RÈGLE : chaque mise à jour livrée ajoute une entrée EN TÊTE de RELEASES
 * (id = date AAAA-MM-JJ, croissant), avec un écran par nouveauté + comment l'utiliser.
 */

export type ReleaseIcon = "sparkles" | "calendar" | "trending" | "bookmaker" | "bell" | "target";

export interface ReleaseSlide {
  icon: ReleaseIcon;
  title: string;
  text: string;
  how: string;
  cta?: { label: string; href: string };
}

export interface Release {
  id: string;
  title: string;
  slides: ReleaseSlide[];
}

export const RELEASES: Release[] = [
  {
    id: "2026-10-08",
    title: "Fini la trêve, retour aux affaires !",
    slides: [
      {
        icon: "sparkles",
        title: "Le résultat se propose tout seul",
        text: "2h après le coup d'envoi, l'app récupère le score et te propose le résultat : « 2-1 · Gagné ? ». Une notif te prévient.",
        how: "Sur le dashboard (« À suivre »), touche Confirmer. Les boutons Gagné / Perdu restent là pour corriger.",
      },
      {
        icon: "target",
        title: "Choisis le match de ton pari",
        text: "À la création d'un pari foot, le prochain match de l'équipe est présélectionné. C'est lui qui sert à proposer le résultat.",
        how: "Touche + puis choisis ton équipe : le bloc « Match » apparaît. « Aucun match » si tu préfères valider toi-même.",
      },
      {
        icon: "trending",
        title: "Les cotes du marché en direct",
        text: "Pour un pari Victoire ou Défaite, l'app affiche les cotes de tes bookmakers, préremplit la meilleure et compare ta cote au marché.",
        how: "Touche un bookmaker pour reprendre sa cote. Après 3 paris, ta « Valeur vs marché » s'affiche sur le dashboard.",
      },
      {
        icon: "calendar",
        title: "Les cotes dans le Calendrier",
        text: "Sous chaque match de tes équipes : la meilleure cote 1 / N / 2 et le bookmaker qui la propose. Mise à jour chaque jour à midi.",
        how: "Ouvre l'onglet Calendrier.",
        cta: { label: "Voir le calendrier", href: "/calendar" },
      },
      {
        icon: "bookmaker",
        title: "Tes bookmakers, tes notifs",
        text: "Choisis les bookmakers dont tu veux voir les cotes, et active les notifs « Résultats de paris ».",
        how: "Profil → Mes bookmakers et Notifications.",
        cta: { label: "Aller au Profil", href: "/profile" },
      },
    ],
  },
];

export const LATEST_RELEASE_ID = RELEASES[0].id;

/** Versions plus récentes que `lastSeen` (toutes si null), de la plus récente à la plus ancienne. */
export function unseenReleases(lastSeen: string | null): Release[] {
  return RELEASES.filter((r) => !lastSeen || r.id > lastSeen);
}
