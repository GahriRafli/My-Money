"use client";

import { useState, useEffect, useCallback } from "react";
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

// Subscribe user ke semua household sekaligus
export async function subscribeAllHouseholds(user, householdIds) {
  if (!isPushSupported() || !user || !householdIds?.length || !VAPID_PUBLIC_KEY) return;
  if (Notification.permission === "denied") return;

  try {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return;

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    localStorage.setItem(ENDPOINT_KEY, sub.endpoint);
    const subJson = sub.toJSON();

    const rows = householdIds.map(id => ({
      user_id: user.id,
      household_id: id,
      subscription: subJson,
    }));

    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(rows, { onConflict: "user_id,household_id" });

    if (error) {
      console.error("[Push] subscribeAll upsert error:", error);
    } else {
      console.log(`[Push] subscribed to ${householdIds.length} household(s) ✓`);
      // Beri tahu hook untuk re-check status
      window.dispatchEvent(new CustomEvent("push-subscribed"));
    }
  } catch (err) {
    console.error("[Push] subscribeAll error:", err);
  }
}

export function usePushNotification(user, householdId) {
  const [permission, setPermission] = useState("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [supported, setSupported]   = useState(false);

  const checkSubscription = useCallback(async () => {
    if (!isPushSupported() || !user || !householdId) return;
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
  }, [user, householdId]);

  // Cek status saat mount / ganti household
  useEffect(() => {
    if (!isPushSupported()) return;
    setSupported(true);
    setPermission(Notification.permission);
    checkSubscription();
  }, [user?.id, householdId]);

  // Re-check saat subscribeAllHouseholds selesai
  useEffect(() => {
    window.addEventListener("push-subscribed", checkSubscription);
    return () => window.removeEventListener("push-subscribed", checkSubscription);
  }, [checkSubscription]);

  // Dengarkan SW saat subscription hilang (PWA uninstall / cache clear)
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

  // Subscribe manual via bell (untuk household aktif)
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

      const { error } = await supabase
        .from("push_subscriptions")
        .upsert({
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
      // Hapus semua subscription user (semua household)
      await supabase.from("push_subscriptions").delete().eq("user_id", user.id);
      localStorage.removeItem(ENDPOINT_KEY);
      setSubscribed(false);
    } catch (err) {
      console.error("Push unsubscribe error:", err);
    }
    setLoading(false);
  }

  return { supported, permission, subscribed, loading, subscribe, unsubscribe };
}
