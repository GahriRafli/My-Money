"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const ENDPOINT_KEY = "mymoney_push_endpoint";

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

async function cleanStaleEndpoint(userId) {
  const savedEndpoint = localStorage.getItem(ENDPOINT_KEY);
  if (!savedEndpoint) return;
  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", userId)
    .filter("subscription->>endpoint", "eq", savedEndpoint);
  localStorage.removeItem(ENDPOINT_KEY);
  console.log("[Push] stale subscription cleaned from DB");
}

export function usePushNotification(user, householdId) {
  const [permission, setPermission] = useState("default");
  const [subscribed, setSubscribed]   = useState(false);
  const [loading, setLoading]         = useState(false);
  const [supported, setSupported]     = useState(false);
  const autoTriggered = useRef(false);

  // Cek subscription saat mount / ganti household
  useEffect(() => {
    if (!isPushSupported()) return;
    setSupported(true);
    setPermission(Notification.permission);
    autoTriggered.current = false;

    async function checkSubscription() {
      if (!user || !householdId) return;
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();

        if (!sub) {
          await cleanStaleEndpoint(user.id);
          setSubscribed(false);
          return;
        }

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

  // Auto-subscribe saat masuk household (bukan personal)
  useEffect(() => {
    if (!supported || !user || !householdId || subscribed || loading) return;
    if (autoTriggered.current) return;
    if (Notification.permission === "denied") return;
    if (!VAPID_PUBLIC_KEY) return;

    autoTriggered.current = true;
    subscribe();
  }, [supported, user, householdId, subscribed, loading]);

  // Dengarkan pesan dari service worker saat subscription hilang
  useEffect(() => {
    if (!isPushSupported() || !user) return;

    async function handleSWMessage(event) {
      if (event.data?.type === "PUSH_SUBSCRIPTION_LOST") {
        console.log("[Push] SW reported subscription lost, cleaning DB...");
        await cleanStaleEndpoint(user.id);
        setSubscribed(false);
      }
    }

    navigator.serviceWorker.addEventListener("message", handleSWMessage);
    return () => navigator.serviceWorker.removeEventListener("message", handleSWMessage);
  }, [user]);

  async function subscribe() {
    if (!isPushSupported() || !user || !householdId || !VAPID_PUBLIC_KEY) return;
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") { setLoading(false); return; }

      const reg = await navigator.serviceWorker.ready;
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
