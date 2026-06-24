"use client";

import { useEffect, useRef, useState } from "react";
import { formatEuros, formatPercent } from "@/lib/utils";

type Fmt = "euros" | "percent" | "int" | "decimal";

interface RollingNumberProps {
  value: number;
  format: Fmt;
  digits?: number;
  durationMs?: number;
  className?: string;
}

function render(value: number, format: Fmt, digits?: number): string {
  switch (format) {
    case "euros":
      return formatEuros(value);
    case "percent":
      return formatPercent(value, digits ?? 1);
    case "int":
      return String(Math.round(value));
    case "decimal":
      return value.toFixed(digits ?? 2);
  }
}

/**
 * Count-up number that rolls from its previous value to the new one
 * (easeOutCubic). Honors prefers-reduced-motion. Formatting happens inside so
 * no function prop crosses the server→client boundary.
 */
export function RollingNumber({
  value,
  format,
  digits,
  durationMs = 700,
  className,
}: RollingNumberProps) {
  // Start from 0 so the count-up replays on every mount (page load / nav),
  // not only when the value changes.
  const [shown, setShown] = useState(0);
  const prev = useRef(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced || prev.current === value) {
      prev.current = value;
      setShown(value);
      return;
    }
    const from = prev.current;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(from + (value - from) * eased);
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    prev.current = value;
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, durationMs]);

  return <span className={className}>{render(shown, format, digits)}</span>;
}
