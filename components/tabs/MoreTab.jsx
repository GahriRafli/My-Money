"use client";
import { useState } from "react";
import { ArrowRight, BadgeCheck, ChevronRight, Eye, EyeOff, Lock, LogIn, LogOut, Mail, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { hasSupabaseConfig } from "@/lib/supabase";

const MENU = [
  { id:"budget",    icon:"🎯", label:"Anggaran",            sub:"Kelola budget bulanan"         },
  { id:"goals",     icon:"🏆", label:"Target Tabungan",     sub:"Lacak progress tabunganmu"     },
  { id:"recurring", icon:"🔁", label:"Transaksi Berulang",  sub:"Atur tagihan & income rutin"   },
  { id:"household", icon:"👨‍👩‍👧‍👦", label:"Household",         sub:"Keuangan bersama keluarga/teman"},
  { id:"theme",     icon:"🎨", label:"Tema Aplikasi",       sub:"Dark, Light, AMOLED, Forest…" },
];

export default function MoreTab({ user, profile, isGuest, onNavigate }) {
  const [mode,   setMode]   = useState("login");
  const [form,   setForm]   = useState({ name:"", email:"", password:"" });
  const [showPw, setShowPw] = useState(false);
  const [msg,    setMsg]    = useState({ text:"", ok:false });
  const [busy,   setBusy]   = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!hasSupabaseConfig) { setMsg({ text:"Konfigurasi Supabase belum ada.", ok:false }); return; }
    setBusy(true); setMsg({ text:"", ok:false });

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: `${window.location.origin}/?reset=1`,
      });
      setBusy(false);
      if (error) { setMsg({ text: error.message, ok:false }); return; }
      setMsg({ text:"Link reset password sudah dikirim ke email kamu. Cek inbox / spam.", ok:true });
      return;
    }

    const res = mode === "login"
      ? await supabase.auth.signInWithPassword({ email:form.email, password:form.password })
      : await supabase.auth.signUp({ email:form.email, password:form.password, options:{ data:{ full_name:form.name } } });
    setBusy(false);
    if (res.error) {
      const errText = res.error.message || res.error.error_description || res.error.status || "Terjadi kesalahan, coba lagi.";
      setMsg({ text: String(errText), ok:false });
      return;
    }
    if (mode === "register") setMsg({ text:"Akun dibuat! Cek email konfirmasi, lalu masuk.", ok:true });
  }

  return (
    <div>
      <div className="topbar">
        <p style={{ fontSize:16, fontWeight:700 }}>More</p>
      </div>

      <div style={{ padding:"16px 16px", maxWidth:480, margin:"0 auto" }}>
        {/* Profile / Login section */}
        {!isGuest ? (
          <div className="card" style={{ padding:16, marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:52, height:52, borderRadius:16, background:"rgba(255,109,78,.15)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:22, fontWeight:800, color:"var(--accent)", flexShrink:0 }}>
                {(profile?.full_name || user.email)?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:15, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {profile?.full_name || "Pengguna"}
                </p>
                <p style={{ fontSize:12, color:"var(--sub)", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {user.email}
                </p>
                <div style={{ marginTop:6, display:"inline-flex", alignItems:"center", gap:4,
                  background:"rgba(0,184,148,.15)", color:"#00B894", fontSize:11, fontWeight:700,
                  padding:"3px 8px", borderRadius:99 }}>
                  <BadgeCheck size={11} /> Akun aktif
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div style={{ background:"rgba(255,109,78,.1)", border:"1px solid rgba(255,109,78,.2)",
              borderRadius:14, padding:"12px 16px", marginBottom:16, display:"flex", gap:10 }}>
              <LogIn size={18} style={{ color:"var(--accent)", flexShrink:0, marginTop:1 }} />
              <div>
                <p style={{ fontSize:13, fontWeight:700, color:"var(--accent)" }}>Login untuk sinkron data</p>
                <p style={{ fontSize:12, color:"var(--sub)", marginTop:2 }}>Mode tamu aktif. Data hilang saat reload.</p>
              </div>
            </div>
            {mode !== "forgot" && (
              <div className="pill-toggle" style={{ marginBottom:16 }}>
                <button className={`pill-btn${mode==="login"?" active":""}`} onClick={() => { setMode("login"); setMsg({text:"",ok:false}); }}>Masuk</button>
                <button className={`pill-btn${mode==="register"?" active":""}`} onClick={() => { setMode("register"); setMsg({text:"",ok:false}); }}>Daftar</button>
              </div>
            )}
            {mode === "forgot" && (
              <div style={{ background:"rgba(99,102,241,.1)", border:"1px solid rgba(99,102,241,.2)",
                borderRadius:12, padding:"12px 14px", marginBottom:14 }}>
                <p style={{ fontSize:13, fontWeight:700, color:"var(--brand)" }}>Reset Password</p>
                <p style={{ fontSize:12, color:"var(--sub)", marginTop:3 }}>
                  Masukkan email akunmu, kami akan kirim link reset password.
                </p>
              </div>
            )}
            <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
              {mode === "register" && (
                <DField label="Nama" icon={<UserRound size={17} />}>
                  <input className="field-input" placeholder="Nama kamu" required
                    value={form.name} onChange={e => setForm({...form,name:e.target.value})} />
                </DField>
              )}
              <DField label="Email" icon={<Mail size={17} />}>
                <input className="field-input" type="email" placeholder="nama@email.com" required
                  value={form.email} onChange={e => setForm({...form,email:e.target.value})} />
              </DField>
              {mode !== "forgot" && (
                <DField label="Password" icon={<Lock size={17} />}>
                  <input className="field-input" type={showPw?"text":"password"} placeholder="Min. 6 karakter" required
                    value={form.password} onChange={e => setForm({...form,password:e.target.value})} />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ marginRight:12, color:"var(--sub)" }}>
                    {showPw ? <EyeOff size={17}/> : <Eye size={17}/>}
                  </button>
                </DField>
              )}
              {mode === "login" && (
                <div style={{ textAlign:"right", marginTop:-4 }}>
                  <button type="button" onClick={() => { setMode("forgot"); setMsg({text:"",ok:false}); }}
                    style={{ fontSize:12, color:"var(--brand)", fontWeight:600 }}>
                    Lupa password?
                  </button>
                </div>
              )}
              {msg.text && (
                <p style={{ fontSize:13, borderRadius:12, padding:"10px 14px",
                  background: msg.ok?"rgba(0,184,148,.15)":"rgba(255,92,92,.15)",
                  color: msg.ok?"#00B894":"var(--expense)" }}>{msg.text}</p>
              )}
              <button type="submit" disabled={busy}
                style={{ height:50, borderRadius:14, background:"var(--accent)", color:"#fff",
                  fontWeight:800, fontSize:15, display:"flex", alignItems:"center",
                  justifyContent:"center", gap:8, boxShadow:"0 6px 20px rgba(255,109,78,.35)" }}>
                {busy ? "Memproses..." : mode==="login" ? "Masuk" : mode==="register" ? "Buat Akun" : "Kirim Link Reset"}
                {!busy && <ArrowRight size={17}/>}
              </button>
              {mode === "forgot" && (
                <button type="button" onClick={() => { setMode("login"); setMsg({text:"",ok:false}); }}
                  style={{ fontSize:13, color:"var(--sub)", textAlign:"center", marginTop:4 }}>
                  ← Kembali ke login
                </button>
              )}
            </form>
          </>
        )}

        {/* Feature menu */}
        <div className="card" style={{ overflow:"hidden", marginBottom:16 }}>
          {MENU.map(({ id, icon, label, sub }, i) => (
            <button key={id} onClick={() => onNavigate(id)}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"14px 16px",
                borderBottom: i < MENU.length-1 ? "1px solid var(--border)" : "none", textAlign:"left" }}>
              <div style={{ width:36, height:36, borderRadius:10, background:"var(--surface2)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                {icon}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:700 }}>{label}</p>
                <p style={{ fontSize:11, color:"var(--sub)", marginTop:2 }}>{sub}</p>
              </div>
              <ChevronRight size={16} style={{ color:"var(--sub)", flexShrink:0 }} />
            </button>
          ))}
        </div>

        {/* Sign out */}
        {!isGuest && (
          <button onClick={() => supabase.auth.signOut()}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"14px 16px",
              background:"rgba(255,92,92,.1)", border:"1px solid rgba(255,92,92,.2)",
              borderRadius:14, color:"var(--expense)" }}>
            <LogOut size={18} /> <span style={{ fontSize:13, fontWeight:700 }}>Keluar dari Akun</span>
          </button>
        )}

        <p style={{ textAlign:"center", fontSize:11, color:"var(--sub)", marginTop:20 }}>
          My Money v1.0.0
        </p>
      </div>
    </div>
  );
}

function DField({ label, icon, children }) {
  return (
    <div>
      <span className="field-label">{label}</span>
      <div className="field-wrap">
        <span style={{ marginLeft:14, color:"var(--sub)", flexShrink:0 }}>{icon}</span>
        {children}
      </div>
    </div>
  );
}
