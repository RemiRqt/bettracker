"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, List, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", icon: LayoutDashboard, label: "Tableau de bord" },
  { href: "/series", icon: List, label: "Séries" },
  { href: "/series/new", icon: PlusCircle, label: "Nouvelle série" },
];

interface NavLinksProps {
  onNavigate?: () => void;
  className?: string;
}

export function NavLinks({ onNavigate, className }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex items-center gap-1", className)}>
      {links.map(({ href, icon: Icon, label }) => {
        const isActive =
          href === "/"
            ? pathname === "/"
            : href === "/series"
              ? pathname === "/series"
              : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent/50",
              isActive && "bg-accent text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
