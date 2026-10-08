/**
 * Nouveautés affichées en onboarding à la 1re ouverture après une mise à jour.
 * RÈGLE : chaque mise à jour livrée ajoute une entrée EN TÊTE de RELEASES
 * (id = date AAAA-MM-JJ, croissant) : 3 écrans max, visuel d'abord, titre court + 1 ligne.
 */

export type ReleaseVisual = "odds" | "result" | "settings";

/** Un écran = une maquette visuelle + un titre court + une ligne. */
export interface ReleaseSlide {
  visual: ReleaseVisual;
  title: string;
  text: string;
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
        visual: "odds",
        title: "Les cotes en temps réel",
        text: "La meilleure cote de tes bookmakers, dans le Calendrier et à la création du pari.",
        cta: { label: "Voir le calendrier", href: "/calendar" },
      },
      {
        visual: "result",
        title: "Le résultat en fin de match",
        text: "2h après le match, on te propose le résultat. Un tap pour confirmer.",
      },
      {
        visual: "settings",
        title: "Tes bookmakers, tes notifs",
        text: "Choisis tes bookmakers et tes notifs dans le Profil.",
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
