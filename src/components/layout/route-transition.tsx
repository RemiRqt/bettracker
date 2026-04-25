"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function RouteTransition() {
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;
    setActive(true);
    const t = setTimeout(() => setActive(false), 350);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <div
      aria-hidden
      className="fixed left-0 right-0 z-[60] h-0.5 pointer-events-none"
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 3rem)" }}
    >
      <div
        className={`h-full bg-emerald-400 origin-left transition-transform duration-300 ease-out ${
          active ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
        }`}
      />
    </div>
  );
}
