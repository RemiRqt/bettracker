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
    <div aria-hidden className="pointer-events-none fixed right-0 left-0 z-[60] h-0.5" style={{ top: "calc(env(safe-area-inset-top, 0px) + 3rem)" }}>
      <div
        className={`h-full origin-left bg-primary transition-transform duration-300 ease-out ${active ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"}`}
      />
    </div>
  );
}
