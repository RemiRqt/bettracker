"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setHidden(true), 1300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
      style={{
        animation: hidden ? "splash-out .45s ease forwards" : undefined,
        pointerEvents: hidden ? "none" : "auto",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
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
