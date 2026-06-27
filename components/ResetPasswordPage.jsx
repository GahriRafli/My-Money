"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage({ onDone }) {
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showPw,      setShowPw]      = useState(false);
  const [busy,        setBusy]        = useState(false);
  const [msg,         setMsg]         = useState({ text:"", ok:false });

  async function submit(e) {
    e.preventDefault();
    if (password.length < 6) {
      setMsg({ text:"Password minimal 6 karakter.", ok:false }); return;
    }
    if (password !== confirm) {
      setMsg({ text:"Konfirmasi password tidak cocok.", ok:false }); return;
    }

    setBusy(true);
    setMsg({ text:"", ok:false });

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setBusy(false);
      setMsg({ text: error.message || "Gagal update password.", ok:false });
      return;
    }

    // Sign out agar user login manual dengan password baru
    await supabase.auth.signOut();
    setBusy(false);
    setMsg({ text:"Password berhasil diubah! Silakan login.", ok:true });

    setTimeout(() => onDone(), 1800);
  }

  return (
    <div style={{ display:"grid", minHeight:"100dvh", placeItems:"center",
      background:"var(--bg)", padding:"24px 16px" }}>
      <div style={{ width:"100%", maxWidth:400 }}>

        {/* Icon */}
        <div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}>
          <div style={{ width:64, height:64, borderRadius:20,
            background:"rgba(99,102,241,.15)", display:"flex",
            alignItems:"center", justifyContent:"center" }}>
            <KeyRound size={30} color="var(--brand, #6366F1)" />
          </div>
        </div>

        <h1 style={{ fontSize:22, fontWeight:800, textAlign:"center", marginBottom:8 }}>
          Buat Password Baru
        </h1>
        <p style={{ fontSize:13, color:"var(--sub)", textAlign:"center", marginBottom:28 }}>
          Masukkan password baru untuk akunmu.
        </p>

        <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Password */}
          <div>
            <p style={{ fontSize:12, fontWeight:600, color:"var(--sub)", marginBottom:6 }}>
              PASSWORD BARU
            </p>
            <div className="field-wrap">
              <Lock size={17} style={{ marginLeft:14, color:"var(--sub)", flexShrink:0 }} />
              <input
                className="field-input"
                type={showPw ? "text" : "password"}
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ marginRight:12, color:"var(--sub)" }}>
                {showPw ? <EyeOff size={17}/> : <Eye size={17}/>}
              </button>
            </div>
          </div>

          {/* Confirm */}
          <div>
            <p style={{ fontSize:12, fontWeight:600, color:"var(--sub)", marginBottom:6 }}>
              KONFIRMASI PASSWORD
            </p>
            <div className="field-wrap">
              <Lock size={17} style={{ marginLeft:14, color:"var(--sub)", flexShrink:0 }} />
              <input
                className="field-input"
                type={showPw ? "text" : "password"}
                placeholder="Ulangi password baru"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Message */}
          {msg.text && (
            <p style={{ fontSize:13, borderRadius:12, padding:"10px 14px",
              background: msg.ok ? "rgba(0,184,148,.15)" : "rgba(255,92,92,.15)",
              color: msg.ok ? "#00B894" : "var(--expense)" }}>
              {msg.text}
            </p>
          )}

          <button type="submit" disabled={busy}
            style={{ height:52, borderRadius:14, background:"var(--accent)", color:"#fff",
              fontWeight:800, fontSize:15, marginTop:4,
              boxShadow:"0 6px 20px rgba(255,109,78,.3)",
              opacity: busy ? 0.7 : 1 }}>
            {busy ? "Menyimpan…" : "Simpan Password Baru"}
          </button>
        </form>
      </div>
    </div>
  );
}
