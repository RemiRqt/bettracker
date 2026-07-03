"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Ticket, Plus, CalendarDays, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBetModal } from "@/components/paris/bet-modal-provider";

const LINKS = [
  { href: "/", icon: BarChart3, label: "Dashboard", match: (p: string) => p === "/" },
  {
    href: "/series",
    icon: Ticket,
    label: "Paris",
    match: (p: string) => p.startsWith("/series"),
  },
  {
    href: "/calendar",
    icon: CalendarDays,
    label: "Calendrier",
    match: (p: string) => p === "/calendar",
  },
  {
    href: "/profile",
    icon: User,
    label: "Profil",
    match: (p: string) => p === "/profile",
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { open } = useBetModal();

  const renderLink = (l: (typeof LINKS)[number]) => {
    const active = l.match(pathname);
    const Icon = l.icon;
    return (
      <Link
        key={l.href}
        href={l.href}
        aria-current={active ? "page" : undefined}
        className="relative z-10 flex flex-1 h-full flex-col items-center justify-center gap-0.5 transition-transform active:scale-95"
      >
        <Icon
          className={cn(
            "size-[1.1rem] transition-colors",
            active ? "text-primary" : "text-muted-foreground"
          )}
        />
        <span
          className={cn(
            "text-[0.65rem] leading-tight tracking-wide transition-colors",
            active ? "font-medium text-primary" : "text-muted-foreground"
          )}
        >
          {l.label}
        </span>
      </Link>
    );
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 md:hidden pointer-events-none"
      aria-label="Navigation principale"
    >
      <div className="pointer-events-auto mx-auto max-w-md px-3 pb-3">
        <div className="relative flex justify-around items-stretch h-14 rounded-full border border-border/50 bg-card/90 backdrop-blur-md shadow-lg px-2">
          {renderLink(LINKS[0])}
          {renderLink(LINKS[1])}

          {/* Bouton central : seule entrée de création */}
          <div className="relative z-10 flex items-center justify-center px-1">
            <button
              type="button"
              onClick={() => open()}
              aria-label="Nouveau pari"
              className="flex h-12 w-12 -translate-y-3 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>

          {renderLink(LINKS[2])}
          {renderLink(LINKS[3])}
        </div>
      </div>
    </nav>
  );
}
