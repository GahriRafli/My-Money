"use client";

import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPermission(Notification.permission);

    // Check if already subscribed for this household
    async function checkSubscription() {
      if (!user || !householdId || !("serviceWorker" in navigator)) return;
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) { setSubscribed(false); return; }

      const { data } = await supabase
        .from("push_subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .eq("household_id", householdId)
        .maybeSingle();
      setSubscribed(!!data);
    }
    checkSubscription();
  }, [user, householdId]);

  async function subscribe() {
    if (!user || !householdId || !VAPID_PUBLIC_KEY) return;
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      if (permission !== "granted") { setLoading(false); return; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await supabase.from("push_subscriptions").upsert({
        user_id: user.id,
        household_id: householdId,
        subscription: sub.toJSON(),
      }, { onConflict: "user_id,household_id" });

      setSubscribed(true);
    } catch (err) {
      console.error("Push subscribe error:", err);
    }
    setLoading(false);
  }

  async function unsubscribe() {
    if (!user || !householdId) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();

      await supabase.from("push_subscriptions")
        .delete()
        .eq("user_id", user.id)
        .eq("household_id", householdId);

      setSubscribed(false);
    } catch (err) {
      console.error("Push unsubscribe error:", err);
    }
    setLoading(false);
  }

  return { permission, subscribed, loading, subscribe, unsubscribe };
}
