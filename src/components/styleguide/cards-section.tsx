import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RollingNumber } from "@/components/ui/rolling-number";
import { TeamLogo } from "@/components/ui/team-logo";
import { SeriesStatusBadge } from "@/components/series/series-status-badge";
import { Item, Section } from "./item";

export function CardsSection() {
  return (
    <Section
      anchor="cards"
      n={5}
      title="Cards & médias"
      description="Card (shadcn) et variantes : ombre dure « sticker », stat, cliquable."
    >
      <Item id={80} label="Card basique" hint="header + content" className="block">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-base">Série Ligue 1</CardTitle>
            <CardDescription>3 paris en cours</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Contenu de la carte.
          </CardContent>
        </Card>
      </Item>

      <Item id={81} label="Card avec footer" hint="actions" className="block">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-base">Confirmer la mise</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Mise de 10 € sur la série en cours.
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button variant="outline" size="sm">
              Annuler
            </Button>
            <Button size="sm">Valider</Button>
          </CardFooter>
        </Card>
      </Item>

      <Item
        id={82}
        label="Card « sticker »"
        hint="shadow-hard (ombre dure décalée)"
        className="block"
      >
        <Card className="w-full border-primary/30 shadow-[var(--shadow-hard)]">
          <CardHeader>
            <CardTitle className="text-base">Pari gagné 🎉</CardTitle>
            <CardDescription>+24,00 € encaissés</CardDescription>
          </CardHeader>
        </Card>
      </Item>

      <Item
        id={83}
        label="Card sticker — sm"
        hint="shadow-hard-sm"
        className="block"
      >
        <Card className="w-full border-primary/20 shadow-[var(--shadow-hard-sm)]">
          <CardContent className="pt-6 text-sm">Ombre dure légère.</CardContent>
        </Card>
      </Item>

      <Item id={84} label="Stat card" hint="RollingNumber" className="block">
        <Card className="w-full">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Capital total</p>
            <p className="text-2xl font-bold tracking-tight text-primary">
              <RollingNumber value={1287.5} format="euros" />
            </p>
            <p className="text-xs text-primary">+12,4 % ce mois</p>
          </CardContent>
        </Card>
      </Item>

      <Item
        id={85}
        label="Card cliquable"
        hint="hover + état série"
        className="block"
      >
        <Card className="w-full cursor-pointer transition-colors hover:bg-card/60">
          <CardContent className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-3">
              <TeamLogo sport="football" />
              <div>
                <p className="text-sm font-medium">PSG — OM</p>
                <p className="text-xs text-muted-foreground">Cote 1.85</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SeriesStatusBadge status="en_cours" />
              <Badge variant="secondary">10 €</Badge>
            </div>
          </CardContent>
        </Card>
      </Item>

      <Item id={86} label="TeamLogo" hint="sm · md · lg + fallback emoji">
        <TeamLogo sport="football" size="sm" />
        <TeamLogo sport="tennis" size="md" />
        <TeamLogo sport="basket" size="lg" />
      </Item>
    </Section>
  );
}
