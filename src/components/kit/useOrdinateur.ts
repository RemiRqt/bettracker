"use client";

import { useSyncExternalStore } from "react";

const REQUETE = "(min-width: 1024px)";

/** Écran large (`lg` de Tailwind) : les popups deviennent des fenêtres centrées. */
export function useOrdinateur(): boolean {
  return useSyncExternalStore(
    (rappel) => {
      const mq = matchMedia(REQUETE);
      mq.addEventListener("change", rappel);
      return () => mq.removeEventListener("change", rappel);
    },
    () => matchMedia(REQUETE).matches,
    () => false,
  );
}
