import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Item, Section } from "./item";

export function ButtonsSection() {
  return (
    <Section
      anchor="buttons"
      n={3}
      title="Boutons"
      description="Button (shadcn) — variants, tailles, états. Press tactile global au clic."
    >
      <Item id={40} label="default" hint='variant="default"'>
        <Button>Ajouter un pari</Button>
      </Item>
      <Item id={41} label="secondary" hint='variant="secondary"'>
        <Button variant="secondary">Secondaire</Button>
      </Item>
      <Item id={42} label="outline" hint='variant="outline"'>
        <Button variant="outline">Contour</Button>
      </Item>
      <Item id={43} label="ghost" hint='variant="ghost"'>
        <Button variant="ghost">Fantôme</Button>
      </Item>
      <Item id={44} label="destructive" hint='variant="destructive"'>
        <Button variant="destructive">Supprimer</Button>
      </Item>
      <Item id={45} label="link" hint='variant="link"'>
        <Button variant="link">Lien</Button>
      </Item>

      <Item id={46} label="taille sm" hint='size="sm"'>
        <Button size="sm">Small</Button>
      </Item>
      <Item id={47} label="taille default" hint='size="default" — h-9'>
        <Button>Default</Button>
      </Item>
      <Item id={48} label="taille lg" hint='size="lg"'>
        <Button size="lg">Large</Button>
      </Item>
      <Item id={49} label="icône seule" hint='size="icon"'>
        <Button size="icon" aria-label="Ajouter">
          <Plus />
        </Button>
      </Item>

      <Item id={50} label="avec icône" hint="icône + texte">
        <Button>
          <Plus />
          Nouvelle série
        </Button>
      </Item>
      <Item id={51} label="désactivé" hint="disabled">
        <Button disabled>Indisponible</Button>
      </Item>
      <Item id={52} label="chargement" hint="spinner">
        <Button disabled>
          <Loader2 className="animate-spin" />
          Enregistrement…
        </Button>
      </Item>
      <Item id={53} label="pleine largeur" hint="w-full" className="block">
        <Button className="w-full">Valider</Button>
      </Item>
      <Item id={54} label="groupe d'actions" hint="row">
        <Button variant="outline">Annuler</Button>
        <Button>Confirmer</Button>
      </Item>
    </Section>
  );
}
