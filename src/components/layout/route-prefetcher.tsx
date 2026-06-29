"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ROUTES = ["/", "/series", "/series/new", "/freebets", "/calendar", "/profile"];

export function RoutePrefetcher() {
  const router = useRouter();
  useEffect(() => {
    ROUTES.forEach((r) => router.prefetch(r));
  }, [router]);
  return null;
}
