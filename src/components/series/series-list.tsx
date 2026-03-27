"use client";

import Link from "next/link";
import type { Series } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { SeriesCard } from "@/components/series/series-card";

interface SeriesListProps {
  series: Series[];
}

function SeriesGrid({ items }: { items: Series[] }) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-12">
        Aucune serie.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((s) => (
        <SeriesCard key={s.id} series={s} />
      ))}
    </div>
  );
}

export function SeriesList({ series }: SeriesListProps) {
  const enCours = series.filter((s) => s.status === "en_cours");
  const gagnees = series.filter((s) => s.status === "gagnee");
  const abandonnees = series.filter((s) => s.status === "abandonnee");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mes series</h1>
        <Button asChild>
          <Link href="/series/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle serie
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="en_cours">
        <TabsList>
          <TabsTrigger value="en_cours">
            En cours ({enCours.length})
          </TabsTrigger>
          <TabsTrigger value="gagnees">
            Gagnees ({gagnees.length})
          </TabsTrigger>
          <TabsTrigger value="abandonnees">
            Abandonnees ({abandonnees.length})
          </TabsTrigger>
          <TabsTrigger value="toutes">
            Toutes ({series.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="en_cours" className="mt-6">
          <SeriesGrid items={enCours} />
        </TabsContent>

        <TabsContent value="gagnees" className="mt-6">
          <SeriesGrid items={gagnees} />
        </TabsContent>

        <TabsContent value="abandonnees" className="mt-6">
          <SeriesGrid items={abandonnees} />
        </TabsContent>

        <TabsContent value="toutes" className="mt-6">
          <SeriesGrid items={series} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
