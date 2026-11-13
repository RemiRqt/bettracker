"use client";

import { useCallback } from "react";

/**
 * Ref à poser sur un champ qui doit prendre le focus quand il apparaît (champ révélé par un clic :
 * recherche dépliée, saisie « autre », popup ouverte). Remplace `autoFocus` (jsx-a11y/no-autofocus) :
 * le focus ne suit qu'une action explicite de l'utilisateur, jamais le chargement de la page.
 * Callback stable : appelé une seule fois, au montage du champ.
 */
export function useFocusAuMontage<T extends HTMLElement = HTMLInputElement>() {
  return useCallback((el: T | null) => {
    el?.focus();
  }, []);
}
