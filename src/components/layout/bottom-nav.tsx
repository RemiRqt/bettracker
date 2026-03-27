"use client";

import { NavLinks } from "@/components/layout/nav-links";

export function BottomNav() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <nav className="border-t border-slate-700/50 bg-[#0f172a]/95 backdrop-blur-md shadow-[0_-2px_10px_rgba(0,0,0,0.3)]">
        <NavLinks variant="vertical" />
      </nav>
    </div>
  );
}
