"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RollingNumber } from "@/components/ui/rolling-number";
import { fireConfetti } from "@/lib/confetti";
import { Item, Section } from "./item";

const EUROS = [124.5, 287.9, 512.3, 1024.75, 1850.4];
const PCTS = [4.2, 12.8, 23.5, 41.1, 58.6];
const INTS = [3, 7, 12, 21, 34];

export function MotionSection() {
  const [step, setStep] = useState(0);
  const next = () => setStep((s) => (s + 1) % EUROS.length);

  return (
    <Section
      anchor="motion"
      n={8}
      title="Mouvement & mécaniques"
      description="Animations fun de l'app. Tout respecte prefers-reduced-motion."
    >
      <Item id={140} label="RollingNumber — €" hint="count-up easeOutCubic 700ms">
        <span className="text-2xl font-bold text-emerald-400">
          <RollingNumber value={EUROS[step]} format="euros" />
        </span>
        <Button size="sm" variant="outline" onClick={next}>
          Rejouer
        </Button>
      </Item>

      <Item id={141} label="RollingNumber — %" hint="format percent">
        <span className="text-2xl font-bold">
          <RollingNumber value={PCTS[step]} format="percent" />
        </span>
        <Button size="sm" variant="outline" onClick={next}>
          Rejouer
        </Button>
      </Item>

      <Item id={142} label="RollingNumber — entier" hint="format int">
        <span className="text-2xl font-bold">
          <RollingNumber value={INTS[step]} format="int" />
        </span>
        <Button size="sm" variant="outline" onClick={next}>
          Rejouer
        </Button>
      </Item>

      <Item id={143} label="Press tactile" hint="scale(0.97) à l'appui — CSS global">
        <Button>Appuie-moi</Button>
        <Button variant="secondary">Et moi</Button>
      </Item>

      <Item id={144} label="Confetti" hint="fireConfetti() — validation pari gagné">
        <Button onClick={() => fireConfetti()}>Pari gagné 🎉</Button>
      </Item>

      <Item id={145} label="Ombre dure au survol" hint="hover → shadow-hard" className="block">
        <div className="w-fit rounded-lg border border-emerald-500/30 bg-card px-5 py-4 text-sm transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-hard)]">
          Survole-moi
        </div>
      </Item>

      <Item id={146} label="Transition couleur" hint="hover, 150ms ease" className="block">
        <div className="w-fit cursor-pointer rounded-lg bg-slate-800 px-5 py-4 text-sm transition-colors hover:bg-emerald-500 hover:text-emerald-950">
          Survole pour la transition
        </div>
      </Item>
    </Section>
  );
}
