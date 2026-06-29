"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Users, CircleDollarSign, CalendarDays, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", icon: BarChart3, label: "Dashboard" },
  { href: "/series", icon: Users, label: "Équipes" },
  { href: "/series/new", icon: CircleDollarSign, label: "Paris" },
  { href: "/freebets", icon: Ticket, label: "Freebets" },
  { href: "/calendar", icon: CalendarDays, label: "Calendrier" },
];

const EXACT_MATCHES = new Set(["/", "/series", "/calendar", "/freebets"]);

interface NavLinksProps {
  variant?: "horizontal" | "vertical";
  onNavigate?: () => void;
  className?: string;
}

export function NavLinks({
  variant = "horizontal",
  onNavigate,
  className,
}: NavLinksProps) {
  const pathname = usePathname();

  const isVertical = variant === "vertical";

  return (
    <nav
      className={cn(
        isVertical
          ? "flex w-full items-center justify-around"
          : "flex items-center gap-1",
        className
      )}
    >
      {links.map(({ href, icon: Icon, label }) => {
        const isActive = EXACT_MATCHES.has(href)
          ? pathname === href
          : pathname.startsWith(href);

        if (isVertical) {
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className="group relative flex flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 active:scale-95 transition-transform"
            >
              <span
                className={cn(
                  "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                  isActive
                    ? "bg-primary/15"
                    : "bg-transparent group-hover:bg-foreground/5"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-secondary-foreground"
                  )}
                />
              </span>
              <span
                className={cn(
                  "text-[10px] leading-tight transition-colors",
                  isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground group-hover:text-secondary-foreground"
                )}
              >
                {label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-secondary-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
