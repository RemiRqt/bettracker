"use client";

import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Item, Section } from "./item";

export function FeedbackSection() {
  const { toast } = useToast();
  const confirm = useConfirm();

  return (
    <Section
      anchor="feedback"
      n={7}
      title="Feedback & overlays"
      description="Dialogs, confirmations, toasts, menus, skeletons."
    >
      <Item id={120} label="Dialog" hint="modale">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Ouvrir le dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle série</DialogTitle>
              <DialogDescription>
                Configure ta série de paris.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Fermer</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button>Créer</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Item>

      <Item id={121} label="Confirm — default" hint="useConfirm">
        <Button
          variant="outline"
          onClick={async () => {
            const ok = await confirm({
              title: "Valider ce pari ?",
              description: "Le résultat sera enregistré.",
            });
            toast({ title: ok ? "Confirmé" : "Annulé" });
          }}
        >
          Confirmer une action
        </Button>
      </Item>

      <Item id={122} label="Confirm — destructive" hint="variant destructive">
        <Button
          variant="destructive"
          onClick={async () => {
            const ok = await confirm({
              title: "Supprimer la série ?",
              description: "Cette action est irréversible.",
              confirmLabel: "Supprimer",
              variant: "destructive",
            });
            toast({
              title: ok ? "Série supprimée" : "Annulé",
              variant: ok ? "destructive" : "default",
            });
          }}
        >
          Supprimer
        </Button>
      </Item>

      <Item id={123} label="Toast — succès" hint="toast()">
        <Button
          onClick={() =>
            toast({
              title: "Pari enregistré",
              description: "Mise de 10 € ajoutée.",
            })
          }
        >
          Afficher un toast
        </Button>
      </Item>

      <Item id={124} label="Toast — erreur" hint='variant="destructive"'>
        <Button
          variant="destructive"
          onClick={() =>
            toast({
              variant: "destructive",
              title: "Échec",
              description: "Impossible d'enregistrer.",
            })
          }
        >
          Toast erreur
        </Button>
      </Item>

      <Item id={125} label="DropdownMenu" hint="menu contextuel">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Actions">
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Modifier</DropdownMenuItem>
            <DropdownMenuItem>Dupliquer</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Item>

      <Item id={126} label="Skeleton — lignes" hint="chargement" className="block">
        <div className="w-full space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </Item>

      <Item id={127} label="Skeleton — card" hint="placeholder carte" className="block">
        <div className="w-full rounded-lg border p-4">
          <Skeleton className="mb-3 h-5 w-1/3" />
          <Skeleton className="h-20 w-full" />
        </div>
      </Item>
    </Section>
  );
}
