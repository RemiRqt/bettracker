"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAILS } from "@/lib/constants";
import { runResolveBets, type ResolveReport } from "@/lib/resolve-bets-job";

/**
 * Bouton admin « Vérifier les résultats maintenant » : lance la suggestion de
 * résultat sur les paris de l'utilisateur courant, sans attendre les 2h.
 */
export async function runResultCheckNow(): Promise<{ report?: ResolveReport; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    return { error: "Réservé aux admins." };
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const report = await runResolveBets(service, { ignoreDelay: true, userId: user.id });

  revalidatePath("/");
  revalidatePath("/series");
  revalidatePath("/series/new");
  return { report };
}
