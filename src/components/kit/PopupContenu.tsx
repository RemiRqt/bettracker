"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useOrdinateur } from "./useOrdinateur";

export type PropsPopup = {
  ouvert: boolean;
  fermer: () => void;
  titre: string;
  description?: string;
  /** 1 = popup ouverte depuis une autre popup (sélecteur) : passe au-dessus. */
  niveau?: 0 | 1;
  children: React.ReactNode;
};

// Rendu réel de la Popup (Drawer vaul / Dialog Radix, ~34 Ko gzip) : chargé à la demande par Popup.tsx.
export default function PopupContenu({ ouvert, fermer, titre, description, niveau = 0, children }: PropsPopup) {
  const ordinateur = useOrdinateur();
  const surChangement = (o: boolean) => !o && fermer();
  const dessus = niveau === 1 ? "z-[60]" : "";
  const desc = description ?? titre;

  if (ordinateur) {
    return (
      <Dialog open={ouvert} onOpenChange={surChangement}>
        <DialogContent className={`max-h-[88dvh] overflow-y-auto sm:max-w-[440px] ${dessus}`}>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">{titre}</DialogTitle>
            <DialogDescription className={description ? undefined : "sr-only"}>{desc}</DialogDescription>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Drawer open={ouvert} onOpenChange={surChangement} repositionInputs={false}>
      <DrawerContent className={`mx-auto max-h-[88dvh] max-w-md ${dessus}`} style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-lg font-semibold">{titre}</DrawerTitle>
          <DrawerDescription className={description ? undefined : "sr-only"}>{desc}</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-5">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
