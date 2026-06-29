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
      className="fixed inset-x-0 bottom-0 z-50 md:hidden pointer-events-none"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Navigation principale"
    >
      <div className="pointer-events-auto mx-auto max-w-md px-3 pb-3">
        <div className="relative flex justify-around items-stretch h-14 rounded-full border border-slate-700/50 bg-[#1e293b]/90 backdrop-blur-md shadow-lg px-2">
          {/* Sliding active indicator */}
          {activeIndex >= 0 && (
            <div
              className="pointer-events-none absolute top-1 bottom-1 rounded-full bg-emerald-500/15 transition-transform duration-300 ease-out"
              style={{
                left: "0.5rem",
                width: "calc((100% - 1rem) / 5)",
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
                className="relative z-10 flex flex-1 h-full flex-col items-center justify-center gap-0.5 transition-transform active:scale-95"
              >
                <Icon
                  className={cn(
                    "size-[1.1rem] transition-colors",
                    isActive ? "text-emerald-400" : "text-slate-500"
                  )}
                />
                <span
                  className={cn(
                    "text-[0.65rem] leading-tight tracking-wide transition-colors",
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
      </div>
    </nav>
  );
}
