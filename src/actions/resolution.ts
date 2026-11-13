"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/supabase/server";
import { ADMIN_EMAILS } from "@/lib/constants";
import { runResolveBets, type ResolveReport } from "@/lib/resolve-bets-job";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Bouton admin « Vérifier les résultats maintenant » : lance la suggestion de
 * résultat sur les paris de l'utilisateur courant, sans attendre les 2h.
 */
export async function runResultCheckNow(): Promise<{ report?: ResolveReport; error?: string }> {
  const { user } = await getAuthUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    return { error: "Réservé aux admins." };
  }

  const service = createServiceClient();
  const report = await runResolveBets(service, { ignoreDelay: true, userId: user.id });

  revalidatePath("/");
  revalidatePath("/series");
  revalidatePath("/series/new");
  return { report };
}
