"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Users, CircleDollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", icon: BarChart3, label: "Dashboard" },
  { href: "/series", icon: Users, label: "Équipes" },
  { href: "/series/new", icon: CircleDollarSign, label: "Paris" },
];

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
              "transition-colors",
              isVertical
                ? cn(
                    "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5",
                    isActive
                      ? "text-[#10b981]"
                      : "text-slate-500 hover:text-slate-300"
                  )
                : cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-white/5",
                    isActive
                      ? "text-[#10b981]"
                      : "text-slate-400 hover:text-slate-200"
                  )
            )}
          >
            <Icon className={isVertical ? "h-5 w-5" : "h-4 w-4"} />
            <span
              className={
                isVertical ? "text-[10px] leading-tight" : undefined
              }
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
