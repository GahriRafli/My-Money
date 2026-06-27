"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

export default function HomePage() {
  const [session,     setSession]     = useState(undefined);
  const [inviteToken, setInviteToken] = useState(null);

  useEffect(() => {
    // Check for invite token in URL
    const params = new URLSearchParams(window.location.search);
    const token  = params.get("invite");
    if (token) {
      setInviteToken(token);
      // Clean URL without reload
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (!hasSupabaseConfig) { setSession(null); return; }
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div style={{ display:"grid", minHeight:"100dvh", placeItems:"center", background:"var(--bg)" }}>
        <div style={{ width:36, height:36, borderRadius:"50%",
          border:"3px solid var(--border)", borderTopColor:"var(--accent)",
          animation:"spin 0.7s linear infinite" }} />
      </div>
    );
  }

  return <AppShell session={session} inviteToken={inviteToken} />;
}
