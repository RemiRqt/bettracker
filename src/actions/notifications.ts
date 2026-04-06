"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface UserNotificationSettings {
  notifications_enabled: boolean;
  notification_lead_minutes: number;
}

export async function getNotificationSettings(): Promise<UserNotificationSettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { notifications_enabled: false, notification_lead_minutes: 60 };
  }

  const { data } = await supabase
    .from("user_settings")
    .select("notifications_enabled, notification_lead_minutes")
    .eq("user_id", user.id)
    .maybeSingle();

  return data ?? { notifications_enabled: false, notification_lead_minutes: 60 };
}

export async function saveNotificationSettings(
  enabled: boolean,
  leadMinutes: number
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Non connecte." };
  }

  if (leadMinutes < 5 || leadMinutes > 1440) {
    return { error: "Le delai doit etre entre 5 minutes et 24 heures." };
  }

  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      notifications_enabled: enabled,
      notification_lead_minutes: leadMinutes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return { error: `Erreur: ${error.message}` };
  }

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
