"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { BOOKMAKER_KEYS } from "@/lib/odds-api";

export interface UserNotificationSettings {
  notifications_enabled: boolean;
  result_notifications_enabled: boolean;
  bookmakers: string[];
}

const DEFAULT_SETTINGS: UserNotificationSettings = {
  notifications_enabled: false,
  result_notifications_enabled: true,
  bookmakers: BOOKMAKER_KEYS,
};

export async function getNotificationSettings(): Promise<UserNotificationSettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return DEFAULT_SETTINGS;
  }

  const { data } = await supabase
    .from("user_settings")
    .select("notifications_enabled, result_notifications_enabled, bookmakers")
    .eq("user_id", user.id)
    .maybeSingle();

  return data ?? DEFAULT_SETTINGS;
}

export async function saveNotificationSettings(enabled: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Non connecte." };
  }

  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      notifications_enabled: enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return { error: `Erreur: ${error.message}` };
  }

  revalidatePath("/profile");
  return { success: true };
}

/** Toggle « Résultats de paris » (notifs de suggestion de résultat). */
export async function saveResultNotifications(enabled: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Non connecte." };
  }

  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      result_notifications_enabled: enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return { error: `Erreur: ${error.message}` };
  }

  revalidatePath("/profile");
  return { success: true };
}

/** Bookmakers affichés (cotes du marché). Au moins un, parmi les 5 FR. */
export async function saveBookmakers(keys: string[]) {
  const valid = keys.filter((k) => BOOKMAKER_KEYS.includes(k));
  if (valid.length === 0) return { error: "Garde au moins un bookmaker." };

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Non connecte." };

  const { error } = await supabase.from("user_settings").upsert(
    { user_id: user.id, bookmakers: valid, updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
  if (error) return { error: `Erreur: ${error.message}` };

  revalidatePath("/profile");
  return { success: true };
}

export async function savePushSubscription(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Non connecte." };
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_agent: subscription.userAgent ?? null,
    },
    { onConflict: "user_id,endpoint" }
  );

  if (error) {
    return { error: `Erreur: ${error.message}` };
  }

  return { success: true };
}

export async function deletePushSubscription(endpoint: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Non connecte." };
  }

  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  return { success: true };
}
