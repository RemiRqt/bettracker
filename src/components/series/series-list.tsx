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
import { Plus, Inbox } from "lucide-react";
import { SeriesCard } from "@/components/series/series-card";

interface SeriesListProps {
  series: Series[];
}

function SeriesGrid({ items }: { items: Series[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <Inbox className="h-10 w-10 mb-3 text-slate-600" />
        <p className="text-sm">Aucune série trouvée.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold text-slate-100">
          Mes Séries
        </h1>
        <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm h-8 md:h-9 px-3 md:px-4">
          <Link href="/series/new">
            <Plus className="mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4" />
            Nouvelle série
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="en_cours">
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList className="bg-[#1e293b] w-max min-w-full md:w-auto">
            <TabsTrigger value="en_cours" className="text-xs md:text-sm">
              En cours ({enCours.length})
            </TabsTrigger>
            <TabsTrigger value="gagnees" className="text-xs md:text-sm">
              Gagnées ({gagnees.length})
            </TabsTrigger>
            <TabsTrigger value="abandonnees" className="text-xs md:text-sm">
              Abandonnées ({abandonnees.length})
            </TabsTrigger>
            <TabsTrigger value="toutes" className="text-xs md:text-sm">
              Toutes ({series.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="en_cours" className="mt-4 md:mt-6">
          <SeriesGrid items={enCours} />
        </TabsContent>

        <TabsContent value="gagnees" className="mt-4 md:mt-6">
          <SeriesGrid items={gagnees} />
        </TabsContent>

        <TabsContent value="abandonnees" className="mt-4 md:mt-6">
          <SeriesGrid items={abandonnees} />
        </TabsContent>

        <TabsContent value="toutes" className="mt-4 md:mt-6">
          <SeriesGrid items={series} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
