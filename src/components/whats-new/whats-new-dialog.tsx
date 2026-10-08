"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, CalendarDays, Crosshair, Sparkles, Store, TrendingUp, type LucideIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Release, ReleaseIcon, ReleaseSlide } from "@/lib/releases";

const ICONS: Record<ReleaseIcon, LucideIcon> = {
  sparkles: Sparkles,
  calendar: CalendarDays,
  trending: TrendingUp,
  bookmaker: Store,
  bell: BellRing,
  target: Crosshair,
};

interface WhatsNewDialogProps {
  releases: Release[];
  open: boolean;
  onClose: () => void;
}

/** Carrousel des nouveautés (toutes les versions non vues, à la suite). */
export function WhatsNewDialog({ releases, open, onClose }: WhatsNewDialogProps) {
  const slides: (ReleaseSlide & { release: string })[] = releases.flatMap((r) =>
    r.slides.map((s) => ({ ...s, release: r.title })),
  );
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);
  const router = useRouter();

  if (slides.length === 0) return null;
  const slide = slides[index];
  const last = index === slides.length - 1;
  const Icon = ICONS[slide.icon];
  const go = (i: number) => setIndex(Math.min(Math.max(i, 0), slides.length - 1));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-sm rounded-2xl border border-primary/30 bg-card p-0 overflow-hidden"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
          touchX.current = null;
        }}
      >
        <div className="bg-primary/10 px-5 pb-5 pt-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">{slide.release}</p>
          <div className="mx-auto mt-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Icon className="h-7 w-7" />
          </div>
        </div>

        <div className="space-y-3 px-5 pt-4">
          <DialogTitle className="text-center text-lg font-bold text-foreground">{slide.title}</DialogTitle>
          <DialogDescription className="text-center text-sm text-secondary-foreground">{slide.text}</DialogDescription>
          <div className="rounded-xl bg-background p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Comment faire</p>
            <p className="mt-1 text-sm text-foreground">{slide.how}</p>
          </div>
          {slide.cta && (
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push(slide.cta!.href);
              }}
              className="w-full text-sm font-medium text-primary"
            >
              {slide.cta.label} →
            </button>
          )}
        </div>

        <div className="flex justify-center gap-1.5 pt-4">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Nouveauté ${i + 1}`}
              onClick={() => go(i)}
              className={cn("h-1.5 rounded-full transition-all", i === index ? "w-5 bg-primary" : "w-1.5 bg-muted")}
            />
          ))}
        </div>

        <div className="flex gap-2 p-5">
          {!last && (
            <button
              type="button"
              onClick={onClose}
              className="h-11 flex-1 rounded-xl text-sm font-medium text-muted-foreground"
            >
              Passer
            </button>
          )}
          <button
            type="button"
            onClick={() => (last ? onClose() : go(index + 1))}
            className="h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
          >
            {last ? "C'est parti" : "Suivant"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
