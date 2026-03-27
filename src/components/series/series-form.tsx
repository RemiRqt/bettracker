"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createSeries } from "@/actions/series";
import { BET_TYPES } from "@/lib/constants";
import type { BetType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Création en cours..." : "Créer la série"}
    </Button>
  );
}

async function createSeriesAction(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const result = await createSeries(formData);
  return result ?? null;
}

export function SeriesForm() {
  const [state, formAction] = useActionState(createSeriesAction, null);

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Nouvelle série</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="subject">Sujet</Label>
            <Input
              id="subject"
              name="subject"
              placeholder="Ex : PSG - Marseille"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bet_type">Type de pari</Label>
            <Select name="bet_type" required>
              <SelectTrigger id="bet_type">
                <SelectValue placeholder="Choisir un type" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(BET_TYPES) as [BetType, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_gain">Objectif de gain (€)</Label>
            <Input
              id="target_gain"
              name="target_gain"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="10.00"
              required
            />
          </div>

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
