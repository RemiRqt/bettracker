import { Item, Section } from "./item";

export function TypographySection() {
  return (
    <Section
      anchor="typo"
      n={2}
      title="Typographie"
      description="Police Poppins (var --font-poppins). Échelle resserrée mobile-first."
    >
      <Item id={30} label="Police" hint="Poppins / system-ui fallback">
        <span className="text-2xl">Poppins — Aa Bb Cc 0123 €%</span>
      </Item>

      <Item id={31} label="Titre — 2xl semibold" hint="CardTitle">
        <span className="text-2xl font-semibold tracking-tight">
          Capital en cours
        </span>
      </Item>

      <Item id={32} label="Titre — lg semibold" hint="DialogTitle">
        <span className="text-lg font-semibold tracking-tight">
          Valider le résultat
        </span>
      </Item>

      <Item id={33} label="Corps — base" hint="--text-base 1rem">
        <span className="text-base">
          Texte courant de l&apos;application, line-height 1.6.
        </span>
      </Item>

      <Item id={34} label="Petit — sm" hint="--text-sm 0.9375rem">
        <span className="text-sm">Libellés secondaires et descriptions.</span>
      </Item>

      <Item id={35} label="Très petit — xs" hint="--text-xs 0.8125rem">
        <span className="text-xs">Méta, captions, badges.</span>
      </Item>

      <Item id={36} label="Muted foreground" hint="text-muted-foreground">
        <span className="text-sm text-muted-foreground">
          Texte atténué pour infos secondaires.
        </span>
      </Item>

      <Item id={37} label="Graisses" hint="normal · medium · semibold · bold">
        <div className="flex flex-col gap-0.5">
          <span className="font-normal">Regular 400</span>
          <span className="font-medium">Medium 500</span>
          <span className="font-semibold">Semibold 600</span>
          <span className="font-bold">Bold 700</span>
        </div>
      </Item>
    </Section>
  );
}
