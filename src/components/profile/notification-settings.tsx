"use client";

import { useState, useEffect, useTransition } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import {
  saveNotificationSettings,
  savePushSubscription,
  deletePushSubscription,
} from "@/actions/notifications";

interface Props {
  initialEnabled: boolean;
  initialLeadMinutes: number;
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

export function NotificationSettings({ initialEnabled, initialLeadMinutes }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [leadMinutes, setLeadMinutes] = useState(initialLeadMinutes);
  const [permission, setPermission] = useState<NotificationPermission | "default">("default");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [supported, setSupported] = useState(true);
  const [installed, setInstalled] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isSupported = "serviceWorker" in navigator && "PushManager" in window;
    setSupported(isSupported);
    if (isSupported) {
      setPermission(Notification.permission);
    }
    // Detect if running as installed PWA (standalone)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari proprietary
      window.navigator.standalone === true;
    setInstalled(isStandalone);
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
      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setError("Permission refusee. Active les notifications dans les reglages iOS.");
        return;
      }

      // Register SW and subscribe
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJson = sub.toJSON();
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        setError("Subscription invalide.");
        return;
      }

      startTransition(async () => {
        const subResult = await savePushSubscription({
          endpoint: subJson.endpoint!,
          keys: { p256dh: subJson.keys!.p256dh, auth: subJson.keys!.auth },
          userAgent: navigator.userAgent,
        });
        if (subResult.error) {
          setError(subResult.error);
          return;
        }
        const settingsResult = await saveNotificationSettings(true, leadMinutes);
        if (settingsResult.error) {
          setError(settingsResult.error);
          return;
        }
        setEnabled(true);
      });
    } catch (e) {
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
        await saveNotificationSettings(false, leadMinutes);
        setEnabled(false);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    }
  }

  function handleSaveDelay(value: number) {
    setLeadMinutes(value);
    if (enabled) {
      startTransition(async () => {
        const result = await saveNotificationSettings(true, value);
        if (result.error) setError(result.error);
      });
    }
  }

  return (
    <div className="rounded-xl bg-[#1e293b] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {enabled ? (
            <Bell className="h-4 w-4 text-emerald-400" />
          ) : (
            <BellOff className="h-4 w-4 text-slate-500" />
          )}
          <h2 className="text-sm font-semibold text-white">Notifications matchs</h2>
        </div>
        <button
          onClick={enabled ? handleDisable : handleEnable}
          disabled={isPending || !supported}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
            enabled
              ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
              : "bg-emerald-500 text-white hover:bg-emerald-600"
          }`}
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : enabled ? (
            "Desactiver"
          ) : (
            "Activer"
          )}
        </button>
      </div>

      <p className="text-xs text-slate-400">
        Recevoir une notification avant les matchs des equipes avec une serie en cours.
      </p>

      {!installed && (
        <p className="text-xs text-amber-400">
          Sur iPhone : ajoute l&apos;app a ton ecran d&apos;accueil pour activer les notifications.
        </p>
      )}

      {!supported && (
        <p className="text-xs text-red-400">
          Les notifications ne sont pas supportees par ce navigateur.
        </p>
      )}

      {permission === "denied" && (
        <p className="text-xs text-red-400">
          Permission refusee. Va dans Reglages iOS &gt; Notifications &gt; BetTracker.
        </p>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="space-y-1.5">
        <label className="text-xs text-slate-400">
          Delai avant le match : <span className="text-white font-medium">
            {leadMinutes >= 60
              ? `${Math.floor(leadMinutes / 60)}h${leadMinutes % 60 > 0 ? ` ${leadMinutes % 60}min` : ""}`
              : `${leadMinutes} min`}
          </span>
        </label>
        <input
          type="range"
          min="5"
          max="240"
          step="5"
          value={leadMinutes}
          onChange={(e) => handleSaveDelay(parseInt(e.target.value, 10))}
          disabled={isPending}
          className="w-full accent-emerald-500"
        />
        <div className="flex justify-between text-[10px] text-slate-600">
          <span>5 min</span>
          <span>4h</span>
        </div>
      </div>
    </div>
  );
}
