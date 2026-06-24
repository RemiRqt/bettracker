"use client";

import { ColorsSection } from "./colors-section";
import { TypographySection } from "./typography-section";
import { ButtonsSection } from "./buttons-section";
import { BadgesSection } from "./badges-section";
import { CardsSection } from "./cards-section";
import { FormsSection } from "./forms-section";
import { FeedbackSection } from "./feedback-section";
import { MotionSection } from "./motion-section";

const NAV = [
  { href: "#colors", label: "1 · Couleurs" },
  { href: "#typo", label: "2 · Typo" },
  { href: "#buttons", label: "3 · Boutons" },
  { href: "#badges", label: "4 · Badges" },
  { href: "#cards", label: "5 · Cards" },
  { href: "#forms", label: "6 · Forms" },
  { href: "#feedback", label: "7 · Feedback" },
  { href: "#motion", label: "8 · Mouvement" },
];

export function StyleguideClient() {
  return (
    <div className="pb-6">
      <header className="py-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Styleguide
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Charte graphique vivante de BetTracker. Chaque élément porte un numéro{" "}
          <span className="font-mono text-emerald-400">#NN</span> — réfère-toi à
          lui pour tes demandes (ex. « modifie 42 »).
        </p>
      </header>

      <nav className="sticky top-14 z-10 -mx-3 mb-6 border-y border-slate-800 bg-[#0f172a]/90 px-3 py-2 backdrop-blur md:-mx-4 md:px-4">
        <div className="flex flex-wrap gap-1.5">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:border-emerald-500/50 hover:text-emerald-400"
            >
              {n.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="space-y-10">
        <ColorsSection />
        <TypographySection />
        <ButtonsSection />
        <BadgesSection />
        <CardsSection />
        <FormsSection />
        <FeedbackSection />
        <MotionSection />
      </div>
    </div>
  );
}
