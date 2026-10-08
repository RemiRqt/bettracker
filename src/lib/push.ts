/**
 * Envoi Web Push côté serveur (crons, jobs). Nécessite un client Supabase
 * service role pour lire / purger les abonnements de n'importe quel user.
 */

import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
  icon?: string;
}

let vapidReady = false;

/** Configure VAPID une fois. `false` si les clés manquent. */
export function ensureVapid(): boolean {
  if (vapidReady) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:contact@bettracker.app", pub, priv);
  vapidReady = true;
  return true;
}

/**
 * Envoie `payload` à tous les appareils d'un user. Les abonnements expirés
 * (404/410) sont supprimés. Retourne le nombre d'envois réussis + erreurs.
 */
export async function sendPushToUser(
  supabase: SupabaseClient,
  userId: string,
  payload: PushPayload,
): Promise<{ sent: number; errors: string[] }> {
  const errors: string[] = [];
  if (!ensureVapid()) return { sent: 0, errors: ["VAPID keys not configured"] };

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);
  if (!subs || subs.length === 0) return { sent: 0, errors };

  const body = JSON.stringify(payload);
  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body),
    ),
  );

  let sent = 0;
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === "fulfilled") {
      sent++;
      continue;
    }
    const err = r.reason as { statusCode?: number; message?: string };
    if (err?.statusCode === 410 || err?.statusCode === 404) {
      await supabase.from("push_subscriptions").delete().eq("user_id", userId).eq("endpoint", subs[i].endpoint);
    } else {
      errors.push(`User ${userId}: ${err?.message ?? "unknown"}`);
    }
  }
  return { sent, errors };
}
