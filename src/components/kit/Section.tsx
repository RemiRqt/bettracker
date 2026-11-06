"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card } from "@/components/ui/card";

type Props = { titre: string; indice?: string; children: React.ReactNode };

// Carte repliable (Réglages) : titre + résumé, le contenu s'ouvre au tap. Fermée au départ.
export function Section({ titre, indice, children }: Props) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <Collapsible open={ouvert} onOpenChange={setOuvert} asChild>
      <Card className="gap-0 py-0">
        <CollapsibleTrigger className="flex min-h-11 w-full items-center gap-3 p-4 text-left">
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold">{titre}</span>
            {indice && <span className={`block text-xs text-muted-foreground ${ouvert ? "" : "truncate"}`}>{indice}</span>}
          </span>
          <ChevronDown size={18} className={`shrink-0 text-muted-foreground transition ${ouvert ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t px-4 pt-3 pb-4">{children}</CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
