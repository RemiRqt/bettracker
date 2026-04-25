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
                    ? "bg-emerald-500/15"
                    : "bg-transparent group-hover:bg-white/5"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive
                      ? "text-emerald-400"
                      : "text-slate-500 group-hover:text-slate-300"
                  )}
                />
              </span>
              <span
                className={cn(
                  "text-[10px] leading-tight transition-colors",
                  isActive
                    ? "text-emerald-400 font-medium"
                    : "text-slate-500 group-hover:text-slate-300"
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
                ? "bg-emerald-500/10 text-emerald-400"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
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
