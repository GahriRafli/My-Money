"use client";

import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const ENDPOINT_KEY = "mymoney_push_endpoint";

// Check if push notifications are supported
const isPushSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotification(user, householdId) {
  const [permission, setPermission] = useState("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    setSupported(true);
    setPermission(Notification.permission);

    async function checkSubscription() {
      if (!user || !householdId) return;
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();

        if (!sub) {
          // Subscription hilang (PWA di-uninstall / browser clear data)
          // Hapus record lama dari DB berdasarkan endpoint yang tersimpan
          const savedEndpoint = localStorage.getItem(ENDPOINT_KEY);
          if (savedEndpoint) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("user_id", user.id)
              .filter("subscription->>endpoint", "eq", savedEndpoint);
            localStorage.removeItem(ENDPOINT_KEY);
            console.log("[Push] stale subscription cleaned from DB");
          }
          setSubscribed(false);
          return;
        }

        // Subscription masih aktif — simpan endpoint terbaru
        localStorage.setItem(ENDPOINT_KEY, sub.endpoint);

        const { data } = await supabase
          .from("push_subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .eq("household_id", householdId)
          .maybeSingle();
        setSubscribed(!!data);
      } catch { setSubscribed(false); }
    }
    checkSubscription();
  }, [user, householdId]);

  async function subscribe() {
    console.log("[Push] subscribe called", { supported: isPushSupported(), user: !!user, householdId, hasKey: !!VAPID_PUBLIC_KEY });
    if (!isPushSupported() || !user || !householdId || !VAPID_PUBLIC_KEY) {
      console.warn("[Push] early return — missing requirement");
      return;
    }
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      console.log("[Push] permission:", perm);
      setPermission(perm);
      if (perm !== "granted") { setLoading(false); return; }

      const reg = await navigator.serviceWorker.ready;
      console.log("[Push] SW ready, subscribing...");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      console.log("[Push] subscribed:", sub.endpoint);

      const { error } = await supabase.from("push_subscriptions").upsert({
        user_id: user.id,
        household_id: householdId,
        subscription: sub.toJSON(),
      }, { onConflict: "user_id,household_id" });

      if (error) console.error("[Push] upsert error:", error);
      else {
        localStorage.setItem(ENDPOINT_KEY, sub.endpoint);
        console.log("[Push] saved to DB ✓");
      }

      setSubscribed(!error);
    } catch (err) {
      console.error("[Push] subscribe error:", err);
    }
    setLoading(false);
  }

  async function unsubscribe() {
    if (!isPushSupported() || !user || !householdId) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await supabase.from("push_subscriptions")
        .delete()
        .eq("user_id", user.id)
        .eq("household_id", householdId);
      localStorage.removeItem(ENDPOINT_KEY);
      setSubscribed(false);
    } catch (err) {
      console.error("Push unsubscribe error:", err);
    }
    setLoading(false);
  }

  return { supported, permission, subscribed, loading, subscribe, unsubscribe };
}
