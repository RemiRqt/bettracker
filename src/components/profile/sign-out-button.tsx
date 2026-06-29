"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full h-12 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive font-medium hover:bg-destructive/20 transition-colors"
    >
      Se déconnecter
    </button>
  );
}
