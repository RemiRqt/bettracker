"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "equipes", label: "Équipes", href: "/series" },
  { key: "paris", label: "Paris", href: "/series/new" },
] as const;

export function ParisEquipesSwitch({ active }: { active: "paris" | "equipes" }) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-card p-1">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={active === t.key ? "page" : undefined}
          className={cn(
            "flex h-9 items-center justify-center rounded-lg text-sm font-medium transition-colors",
            active === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-secondary-foreground",
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
