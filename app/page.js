"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import ResetPasswordPage from "@/components/ResetPasswordPage";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

export default function HomePage() {
  const [session,           setSession]           = useState(undefined);
  const [inviteToken,       setInviteToken]       = useState(null);
  const [isRecovery,        setIsRecovery]        = useState(false);
  const [initialWorkspaceId, setInitialWorkspaceId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get("invite");
    const ws     = params.get("workspace");
    if (token) setInviteToken(token);
    if (ws)    setInitialWorkspaceId(ws);
    if (token || ws) window.history.replaceState({}, "", window.location.pathname);

    if (!hasSupabaseConfig) { setSession(null); return; }

    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
        setSession(s ?? null);
      } else {
        setIsRecovery(false);
        setSession(s ?? null);
      }
    });
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

  if (isRecovery) {
    return <ResetPasswordPage onDone={() => { setIsRecovery(false); setSession(null); }} />;
  }

  return <AppShell session={session} inviteToken={inviteToken} initialWorkspaceId={initialWorkspaceId} />;
}
