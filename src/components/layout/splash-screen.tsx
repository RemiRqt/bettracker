"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
  const [hidden, setHidden] = useState(false);
  // Masqué dès l'hydratation (300 ms mini pour éviter le flash) au lieu d'une attente fixe.
  useEffect(() => {
    const t = setTimeout(() => setHidden(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
      style={{
        animation: hidden ? "splash-out .25s ease forwards" : undefined,
        pointerEvents: "none",
      }}
    >
      <img
        src="/icons/icon-512.png"
        alt=""
        width={112}
        height={112}
        className="splash-logo-anim rounded-3xl shadow-2xl"
        style={{ animation: "splash-logo .7s cubic-bezier(.2,.7,.2,1) both" }}
      />
    </div>
  );
}
