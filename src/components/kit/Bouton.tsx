import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = React.ComponentProps<typeof Button> & { enCours?: boolean };

// Bouton d'action : le Button shadcn + un état « en cours » (désactivé, roue qui tourne).
// Variantes : default (action principale), outline, secondary, ghost, destructive, link.
export function Bouton({ enCours, disabled, children, ...reste }: Props) {
  return (
    <Button type="button" {...reste} disabled={disabled || enCours} aria-busy={enCours || undefined}>
      {enCours && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
      {children}
    </Button>
  );
}
