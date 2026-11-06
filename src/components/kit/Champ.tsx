import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Commun = { libelle: string; indice?: string };

function Entete({ id, libelle, indice }: Commun & { id: string }) {
  return (
    <>
      <Label htmlFor={id} className="text-[15px] font-semibold">
        {libelle}
      </Label>
      {indice && <p className="-mt-1 text-sm text-muted-foreground">{indice}</p>}
    </>
  );
}

// Champ texte d'une ligne, avec son libellé (16 px minimum : pas de zoom iOS).
export function Champ({ libelle, indice, className, ...reste }: Commun & React.ComponentProps<typeof Input>) {
  const id = useId();
  return (
    <div className="grid gap-2">
      <Entete id={id} libelle={libelle} indice={indice} />
      <Input id={id} className={`h-11 rounded-xl bg-background px-3 ${className ?? ""}`} {...reste} />
    </div>
  );
}

// Zone de texte multiligne, avec son libellé.
export function ZoneTexte({ libelle, indice, className, ...reste }: Commun & React.ComponentProps<typeof Textarea>) {
  const id = useId();
  return (
    <div className="grid gap-2">
      <Entete id={id} libelle={libelle} indice={indice} />
      <Textarea id={id} rows={4} className={`min-h-24 rounded-xl bg-background px-3 py-2.5 ${className ?? ""}`} {...reste} />
    </div>
  );
}
