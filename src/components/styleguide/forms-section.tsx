import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Item, Section } from "./item";

export function FormsSection() {
  return (
    <Section
      anchor="forms"
      n={6}
      title="Formulaires & données"
      description="Champs, sélecteurs, onglets et tableaux."
    >
      <Item id={100} label="Input" hint="texte" className="block">
        <Input placeholder="Nom de la série" />
      </Item>
      <Item id={101} label="Input — nombre" hint="type number" className="block">
        <Input type="number" placeholder="Mise (€)" />
      </Item>
      <Item id={102} label="Input — désactivé" hint="disabled" className="block">
        <Input placeholder="Verrouillé" disabled />
      </Item>
      <Item id={103} label="Label + champ" hint="Label" className="block">
        <div className="w-full space-y-1.5">
          <Label htmlFor="sg-cote">Cote</Label>
          <Input id="sg-cote" type="number" placeholder="1.85" />
        </div>
      </Item>

      <Item id={104} label="Select" hint="Radix select" className="block">
        <Select defaultValue="football">
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sport" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="football">Football</SelectItem>
            <SelectItem value="tennis">Tennis</SelectItem>
            <SelectItem value="rugby">Rugby</SelectItem>
            <SelectItem value="basket">Basket</SelectItem>
          </SelectContent>
        </Select>
      </Item>

      <Item id={105} label="Separator" hint="horizontal" className="block">
        <div className="w-full">
          <p className="text-sm">Section A</p>
          <Separator className="my-2" />
          <p className="text-sm">Section B</p>
        </div>
      </Item>

      <Item id={106} label="Tabs" hint="onglets" className="block">
        <Tabs defaultValue="1m" className="w-full">
          <TabsList>
            <TabsTrigger value="1m">1M</TabsTrigger>
            <TabsTrigger value="3m">3M</TabsTrigger>
            <TabsTrigger value="all">Tout</TabsTrigger>
          </TabsList>
          <TabsContent value="1m" className="text-sm text-muted-foreground">
            Données du dernier mois.
          </TabsContent>
          <TabsContent value="3m" className="text-sm text-muted-foreground">
            Données des 3 derniers mois.
          </TabsContent>
          <TabsContent value="all" className="text-sm text-muted-foreground">
            Tout l&apos;historique.
          </TabsContent>
        </Tabs>
      </Item>

      <Item id={107} label="Table" hint="tableau de paris" className="block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Match</TableHead>
              <TableHead>Cote</TableHead>
              <TableHead className="text-right">Gain</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>PSG — OM</TableCell>
              <TableCell>1.85</TableCell>
              <TableCell className="text-right text-primary">+8,50 €</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>OL — RC Lens</TableCell>
              <TableCell>2.10</TableCell>
              <TableCell className="text-right text-destructive">−10,00 €</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Item>
    </Section>
  );
}
