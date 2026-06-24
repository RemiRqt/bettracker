import { Badge } from "@/components/ui/badge";
import { SeriesStatusBadge } from "@/components/series/series-status-badge";
import { Item, Section } from "./item";

export function BadgesSection() {
  return (
    <Section
      anchor="badges"
      n={4}
      title="Badges & statuts"
      description="Badge (shadcn) + badges de statut série (couleurs dédiées)."
    >
      <Item id={70} label="default" hint='variant="default"'>
        <Badge>Nouveau</Badge>
      </Item>
      <Item id={71} label="secondary" hint='variant="secondary"'>
        <Badge variant="secondary">Brouillon</Badge>
      </Item>
      <Item id={72} label="destructive" hint='variant="destructive"'>
        <Badge variant="destructive">Perdu</Badge>
      </Item>
      <Item id={73} label="outline" hint='variant="outline"'>
        <Badge variant="outline">Neutre</Badge>
      </Item>

      <Item id={74} label="Statut — en cours" hint="SeriesStatusBadge">
        <SeriesStatusBadge status="en_cours" />
      </Item>
      <Item id={75} label="Statut — gagnée" hint="SeriesStatusBadge">
        <SeriesStatusBadge status="gagnee" />
      </Item>
      <Item id={76} label="Statut — abandonnée" hint="SeriesStatusBadge">
        <SeriesStatusBadge status="abandonnee" />
      </Item>
    </Section>
  );
}
