"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Release, ReleaseSlide } from "@/lib/releases";
import { ReleaseVisualView } from "./release-visuals";

interface WhatsNewDialogProps {
  releases: Release[];
  open: boolean;
  onClose: () => void;
}

/** Carrousel des nouveautés : maquette visuelle, titre court, une ligne. */
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
  const go = (i: number) => setIndex(Math.min(Math.max(i, 0), slides.length - 1));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-sm overflow-hidden rounded-2xl border border-primary/30 bg-card p-0"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
          touchX.current = null;
        }}
      >
        <div className="relative bg-primary/10 px-5 pb-6 pt-8">
          <p className="absolute left-5 top-3 text-[10px] font-semibold uppercase tracking-wide text-primary">
            {slide.release}
          </p>
          <span className="absolute right-12 top-3 text-[10px] font-semibold text-muted-foreground">
            {index + 1}/{slides.length}
          </span>
          <div key={index} className="wn-slide-in flex min-h-[132px] items-center">
            <ReleaseVisualView visual={slide.visual} />
          </div>
        </div>

        <div className="space-y-1.5 px-5 pt-4 text-center">
          <DialogTitle className="text-lg font-bold text-foreground">{slide.title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">{slide.text}</DialogDescription>
          {slide.cta && (
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push(slide.cta!.href);
              }}
              className="pt-1 text-sm font-medium text-primary"
            >
              {slide.cta.label} →
            </button>
          )}
        </div>

        <div className="flex justify-center gap-1.5 pt-3">
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
            <button type="button" onClick={onClose} className="h-11 flex-1 rounded-xl text-sm font-medium text-muted-foreground">
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
