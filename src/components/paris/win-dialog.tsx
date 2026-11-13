"use client";

import { RollingNumber } from "@/components/ui/rolling-number";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Bet } from "./paris-types";

// Fête du pari gagné (après les confettis) : fenêtre centrée, gardée hors kit (célébration, pas une action).
export function WinDialog({ bet, fermer }: { bet: Bet | null; fermer: () => void }) {
  return (
    <Dialog
      open={bet !== null}
      onOpenChange={(open) => {
        if (!open) fermer();
      }}
    >
      <DialogContent className="mx-auto max-w-xs rounded-2xl border border-primary/30 bg-card">
        <DialogHeader className="items-center text-center">
          <div className="animate-bounce text-5xl" aria-hidden="true">
            🎉
          </div>
          <DialogTitle className="text-lg text-primary">Pari gagné !</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {bet?.series.subject} · Pari #{bet?.bet_number} · cote {bet?.odds.toFixed(2)}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-xl bg-primary/10 px-4 py-3 text-center">
          <p className="text-2xs tracking-wide text-muted-foreground uppercase">Bénéfice net</p>
          <p className="text-2xl font-bold text-primary">
            +<RollingNumber value={bet?.potential_net ?? 0} format="euros" />
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
