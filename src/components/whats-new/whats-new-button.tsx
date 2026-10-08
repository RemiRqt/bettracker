"use client";

import { useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import { RELEASES } from "@/lib/releases";
import { WhatsNewDialog } from "./whats-new-dialog";

/** Profil : revoir les nouveautés de la dernière version. */
export function WhatsNewButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-xl bg-card p-4 text-left transition-colors hover:bg-card/80"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Nouveautés</p>
          <p className="text-xs text-muted-foreground">Revoir les dernières fonctionnalités</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
      {open && <WhatsNewDialog releases={[RELEASES[0]]} open={open} onClose={() => setOpen(false)} />}
    </>
  );
}
