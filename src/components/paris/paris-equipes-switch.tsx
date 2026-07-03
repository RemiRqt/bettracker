"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "paris", label: "Paris", href: "/series/new" },
  { key: "equipes", label: "Équipes", href: "/series" },
] as const;

export function ParisEquipesSwitch({ active }: { active: "paris" | "equipes" }) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-card border border-border p-1">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={active === t.key ? "page" : undefined}
          className={cn(
            "h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors",
            active === t.key
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-secondary-foreground"
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
