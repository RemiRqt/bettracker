"use client";

import type { TeamMapping } from "@/actions/teams";
import { TeamLogo } from "@/components/ui/team-logo";
import { Star, Link2, X, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClubRowProps {
  club: TeamMapping;
  linked: TeamMapping[];
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleFollow: () => void;
  onDelete: () => void;
  onUnlink: (subject: string) => void;
  onOpenLink: () => void;
}

// Une équipe suivie : logo, nom, étoile favori, dépliage des joueurs/équipes liés, suppression.
export function ClubRow({
  club,
  linked,
  expanded,
  onToggleExpand,
  onToggleFollow,
  onDelete,
  onUnlink,
  onOpenLink,
}: ClubRowProps) {
  return (
    <div className="rounded-xl bg-background overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <TeamLogo logoUrl={club.logo_url} sport={club.sport} size="md" />
        <button onClick={onToggleExpand} aria-expanded={expanded} className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-foreground truncate">{club.subject}</p>
          <p className="text-xs text-muted-foreground">
            {linked.length} lie{linked.length !== 1 ? "s" : ""}
          </p>
        </button>
        <div className="-my-2 -mr-3 flex shrink-0 items-center">
          <button
            onClick={onToggleFollow}
            aria-pressed={club.is_followed}
            aria-label={`Mettre ${club.subject} en favori`}
            className="flex size-11 items-center justify-center"
          >
            <Star
              aria-hidden
              className={cn(
                "h-5 w-5 transition-colors",
                club.is_followed ? "text-warning fill-warning" : "text-muted-foreground hover:text-warning"
              )}
            />
          </button>
          <button
            onClick={onToggleExpand}
            aria-expanded={expanded}
            aria-label={`Joueurs et équipes liés à ${club.subject}`}
            className="flex size-11 items-center justify-center"
          >
            {expanded ? (
              <ChevronDown aria-hidden className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight aria-hidden className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={onDelete}
            aria-label={`Supprimer ${club.subject}`}
            className="flex size-11 items-center justify-center"
          >
            <Trash2 aria-hidden className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-border/50 px-3 pb-3 pt-2 space-y-1.5">
          {linked.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-card/50">
              <span className="text-xs text-secondary-foreground">{s.subject}</span>
              <button
                onClick={() => onUnlink(s.subject)}
                aria-label={`Délier ${s.subject}`}
                className="relative text-xs text-muted-foreground hover:text-destructive transition-colors before:absolute before:-inset-3 before:content-['']"
              >
                <X aria-hidden className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            onClick={onOpenLink}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Link2 aria-hidden className="h-3 w-3" />
            Lier un joueur/equipe
          </button>
        </div>
      )}
    </div>
  );
}
