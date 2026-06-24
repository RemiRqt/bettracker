"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Users,
  CircleDollarSign,
  Ticket,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", icon: BarChart3, label: "Dashboard", exact: true },
  { href: "/series", icon: Users, label: "Équipes", exact: true },
  { href: "/series/new", icon: CircleDollarSign, label: "Paris", exact: false },
  { href: "/freebets", icon: Ticket, label: "Freebets", exact: true },
  { href: "/calendar", icon: CalendarDays, label: "Calendrier", exact: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const activeIndex = LINKS.findIndex((l) =>
    l.exact ? pathname === l.href : pathname.startsWith(l.href)
  );

  return (
    <nav
      className="fixed inset-x-3 z-50 md:hidden rounded-2xl border border-slate-700/50 bg-[#1e293b]/90 backdrop-blur-md shadow-lg"
      style={{ bottom: "calc(0.6rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="relative flex">
        {/* Sliding active indicator */}
        {activeIndex >= 0 && (
          <div
            className="pointer-events-none absolute top-1 bottom-1 left-0 rounded-xl bg-emerald-500/15 transition-transform duration-300 ease-out"
            style={{
              width: `${100 / LINKS.length}%`,
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />
        )}

        {LINKS.map((l, i) => {
          const isActive = i === activeIndex;
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive ? "page" : undefined}
              className="relative z-10 flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-transform active:scale-95"
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-emerald-400" : "text-slate-500"
                )}
              />
              <span
                className={cn(
                  "text-[10px] leading-tight transition-colors",
                  isActive
                    ? "font-medium text-emerald-400"
                    : "text-slate-500"
                )}
              >
                {l.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
