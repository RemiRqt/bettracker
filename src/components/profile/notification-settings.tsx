"use client";

import { useState, useEffect, useSyncExternalStore, useTransition } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { saveNotificationSettings, savePushSubscription, deletePushSubscription } from "@/actions/notifications";
import { NotificationPrefs } from "./notification-prefs";

interface Props {
  initialEnabled: boolean;
  initialResults: boolean;
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    view[i] = rawData.charCodeAt(i);
  }
  return buffer;
}

// Capacités du navigateur, lues après l'hydratation (le rendu serveur suppose « supporté, installé »).
const sansAbonnement = () => () => {};
const pushSupporte = () => "serviceWorker" in navigator && "PushManager" in window;
const appInstallee = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  // @ts-expect-error iOS Safari proprietary
  window.navigator.standalone === true;

function useCapacitesPush() {
  const supported = useSyncExternalStore(sansAbonnement, pushSupporte, () => true);
  const installed = useSyncExternalStore(sansAbonnement, appInstallee, () => true);
  const permissionNavigateur = useSyncExternalStore<NotificationPermission>(
    sansAbonnement,
    () => (pushSupporte() ? Notification.permission : "default"),
    () => "default",
  );
  return { supported, installed, permissionNavigateur };
}

export function NotificationSettings({ initialEnabled, initialResults }: Props) {
  // `enabled` = cet appareil est abonné aux push (les préférences fines sont dessous).
  const [enabled, setEnabled] = useState(initialEnabled);
  const [permissionChoisie, setPermission] = useState<NotificationPermission | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const { supported, installed, permissionNavigateur } = useCapacitesPush();
  const permission = permissionChoisie ?? permissionNavigateur;

  // Abonnement push réel de cet appareil (peut différer de la préférence serveur).
  useEffect(() => {
    if (!pushSupporte()) return;
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => setEnabled(Boolean(sub)))
      .catch(() => {});
  }, []);

  async function handleEnable() {
    setError("");
    if (!supported) {
      setError("Les notifications ne sont pas supportees par ce navigateur.");
      return;
    }
    if (!installed) {
      setError("Sur iPhone, ajoute d'abord l'app a ton ecran d'accueil.");
      return;
    }
    if (!VAPID_PUBLIC_KEY) {
      setError("Configuration manquante: VAPID public key.");
      return;
    }

    try {
      // iOS: requestPermission() MUST be the first await (user-gesture chain)
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setError("Permission refusee. Active les notifications dans les reglages iOS.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJson = sub.toJSON();
      const endpoint = subJson.endpoint;
      const p256dh = subJson.keys?.p256dh;
      const auth = subJson.keys?.auth;
      if (!endpoint || !p256dh || !auth) {
        setError("Subscription invalide.");
        return;
      }

      startTransition(async () => {
        const subResult = await savePushSubscription({
          endpoint,
          keys: { p256dh, auth },
          userAgent: navigator.userAgent,
        });
        if (subResult.error) {
          setError(subResult.error);
          return;
        }
        const settingsResult = await saveNotificationSettings(true);
        if (settingsResult.error) {
          setError(settingsResult.error);
          return;
        }
        setEnabled(true);
      });
    } catch (e) {
      console.error("[push] enable error:", e);
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    }
  }

  async function handleDisable() {
    setError("");
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const sub = await registration?.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        startTransition(async () => {
          await deletePushSubscription(sub.endpoint);
        });
      }
      startTransition(async () => {
        await saveNotificationSettings(false);
        setEnabled(false);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    }
  }

  return (
    <div className="space-y-3 rounded-xl bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {enabled ? <Bell className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
          <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
        </div>
        <button
          onClick={enabled ? handleDisable : handleEnable}
          disabled={isPending || !supported}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
            enabled ? "bg-muted text-secondary-foreground hover:bg-muted/80" : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {isPending ? (
            <>
              <Loader2 aria-hidden className="h-3 w-3 motion-safe:animate-spin" />
              <span className="sr-only">Chargement…</span>
            </>
          ) : enabled ? (
            "Desactiver"
          ) : (
            "Activer"
          )}
        </button>
      </div>

      {enabled && <NotificationPrefs initialMatches={initialEnabled} initialResults={initialResults} />}

      {!installed && <p className="text-xs text-warning">Sur iPhone : ajoute l&apos;app a ton ecran d&apos;accueil pour activer les notifications.</p>}

      {!supported && <p className="text-xs text-destructive">Les notifications ne sont pas supportees par ce navigateur.</p>}

      {permission === "denied" && <p className="text-xs text-destructive">Permission refusee. Va dans Reglages iOS &gt; Notifications &gt; BetTracker.</p>}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
