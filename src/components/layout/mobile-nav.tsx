"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLinks } from "@/components/layout/nav-links";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-y-0 left-0 w-3/4 max-w-xs border-r bg-background p-6 shadow-lg">
            <div className="flex items-center justify-between mb-8">
              <span className="text-xl font-bold">BetTracker</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Fermer le menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex flex-col gap-1">
              <NavLinks
                className="flex-col items-stretch"
                onNavigate={() => setOpen(false)}
              />
            </div>
          </div>

          {/* Click outside to close */}
          <div
            className="fixed inset-0 z-[-1]"
            onClick={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
