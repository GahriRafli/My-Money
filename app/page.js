"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import ResetPasswordPage from "@/components/ResetPasswordPage";
import PasscodeLock, { hasPasscode, removePasscode, PasscodeSetup } from "@/components/PasscodeLock";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

export default function HomePage() {
  const [session,            setSession]            = useState(undefined);
  const [inviteToken,        setInviteToken]        = useState(null);
  const [isRecovery,         setIsRecovery]         = useState(false);
  const [initialWorkspaceId, setInitialWorkspaceId] = useState(null);
  const [locked,             setLocked]             = useState(false);
  const [resetPasscode,      setResetPasscode]      = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get("invite");
    const ws     = params.get("workspace");
    const rp     = params.get("reset_passcode");
    if (token) setInviteToken(token);
    if (ws)    setInitialWorkspaceId(ws);
    if (rp) {
      window.history.replaceState({}, "", window.location.pathname);
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      fetch(`${supabaseUrl}/functions/v1/passcode-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
        body: JSON.stringify({ action: "verify", token: rp }),
      }).then(r => r.json()).then(data => {
        if (data.ok) { removePasscode(); setResetPasscode(true); }
        else alert("Link reset tidak valid atau sudah kadaluarsa.");
      }).catch(() => alert("Gagal validasi token. Coba lagi."));
    }
    if (token || ws) window.history.replaceState({}, "", window.location.pathname);

    // Show lock screen if passcode is set
    if (hasPasscode()) setLocked(true);

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

  if (locked) {
    return <PasscodeLock onUnlock={() => setLocked(false)} />;
  }

  if (resetPasscode) {
    return (
      <>
        <AppShell session={session} inviteToken={inviteToken} initialWorkspaceId={initialWorkspaceId} />
        <PasscodeSetup
          mode="set"
          onDone={() => setResetPasscode(false)}
          onClose={() => setResetPasscode(false)}
        />
      </>
    );
  }

  if (isRecovery) {
    return <ResetPasswordPage onDone={() => { setIsRecovery(false); setSession(null); }} />;
  }

  return <AppShell session={session} inviteToken={inviteToken} initialWorkspaceId={initialWorkspaceId} />;
}
