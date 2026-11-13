"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
    // eslint-disable-next-line no-restricted-syntax -- déconnexion côté client (pas d'action serveur) : seul moyen de vider le cache routeur (staleTimes 30 s) des écrans de la session terminée
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="h-12 w-full rounded-xl border border-destructive/20 bg-destructive/10 font-medium text-destructive transition-colors hover:bg-destructive/20"
    >
      Se déconnecter
    </button>
  );
}
