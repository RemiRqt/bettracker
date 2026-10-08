"use client";

import { useEffect, useState } from "react";
import { getUnseenReleases, markReleasesSeen } from "@/actions/releases";
import type { Release } from "@/lib/releases";
import { WhatsNewDialog } from "./whats-new-dialog";

/** Monté dans le layout : ouvre les nouveautés non vues après le chargement (sans bloquer le rendu). */
export function WhatsNewLauncher() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getUnseenReleases()
      .then((list) => {
        if (list.length === 0) return;
        setReleases(list);
        setOpen(true);
      })
      .catch(() => {});
  }, []);

  function close() {
    setOpen(false);
    markReleasesSeen().catch(() => {});
  }

  return <WhatsNewDialog releases={releases} open={open} onClose={close} />;
}
