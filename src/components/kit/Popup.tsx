"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { PropsPopup } from "./PopupContenu";
import { apresOuverture } from "@/lib/idle";

// Popup de l'app : feuille qui monte du bas sur téléphone (se ferme en glissant), fenêtre
// centrée sur ordinateur. Toutes les actions (ajout, modification, confirmation) passent ici.
// Le contenu est démonté à la fermeture : un formulaire enfant repart de zéro à chaque ouverture.
//
// Perf : Drawer + Dialog pèsent ~34 Ko gzip. Ils ne sont pas dans le chargement de l'écran ;
// leur code est téléchargé au premier moment libre après l'ouverture, au premier contact du
// doigt, ou à défaut à la première ouverture.
const charger = () => import("./PopupContenu");
const PopupContenu = dynamic(charger, { ssr: false });

let precharge = false;
/** Lance le téléchargement du code des popups (à appeler au contact du doigt sur un déclencheur). */
export function precharger() {
  if (precharge) return;
  precharge = true;
  void charger();
}

export function Popup(props: PropsPopup) {
  const [monte, setMonte] = useState(props.ouvert);
  if (props.ouvert && !monte) setMonte(true);

  useEffect(() => {
    if (precharge) return;
    // Au premier contact du doigt, ou de toute façon au premier moment libre après
    // l'ouverture : le premier popup ne télécharge plus rien au moment du tap.
    document.addEventListener("pointerdown", precharger, { once: true, capture: true });
    const annuler = apresOuverture(precharger);
    return () => {
      annuler();
      document.removeEventListener("pointerdown", precharger, { capture: true });
    };
  }, []);

  return monte ? <PopupContenu {...props} /> : null;
}
