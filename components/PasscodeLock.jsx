"use client";
import { useState, useEffect } from "react";
import { Delete, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";

const STORAGE_KEY = "mymoney_passcode";

export function hasPasscode() {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(STORAGE_KEY);
}

export function savePasscode(code) {
  localStorage.setItem(STORAGE_KEY, btoa(code));
}

export function removePasscode() {
  localStorage.removeItem(STORAGE_KEY);
}

export function checkPasscode(code) {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return false;
  return atob(stored) === code;
}

const KEYS = ["1","2","3","4","5","6","7","8","9","","0","del"];

export default function PasscodeLock({ onUnlock }) {
  const [digits, setDigits] = useState([]);
  const [shake, setShake]   = useState(false);

  useEffect(() => {
    if (digits.length === 4) {
      if (checkPasscode(digits.join(""))) {
        onUnlock();
      } else {
        setShake(true);
        setTimeout(() => { setShake(false); setDigits([]); }, 600);
      }
    }
  }, [digits]);

  function press(key) {
    if (key === "del") { setDigits(d => d.slice(0,-1)); return; }
    if (key === "") return;
    if (digits.length >= 4) return;
    setDigits(d => [...d, key]);
  }

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9999,
      background:"var(--bg)",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:"40px 24px",
      paddingTop:"env(safe-area-inset-top, 40px)",
    }}>
      {/* Icon */}
      <div style={{ width:72, height:72, borderRadius:22,
        background:"rgba(99,102,241,.15)",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:34, marginBottom:24 }}>
        🔒
      </div>

      <p style={{ fontSize:20, fontWeight:800, marginBottom:6 }}>My Money</p>
      <p style={{ fontSize:13, color:"var(--sub)", marginBottom:36 }}>Masukkan passcode untuk melanjutkan</p>

      {/* Dots */}
      <div style={{
        display:"flex", gap:18, marginBottom:48,
        animation: shake ? "shake 0.5s ease" : "none",
      }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width:16, height:16, borderRadius:"50%",
            background: i < digits.length ? "var(--brand)" : "var(--border)",
            transition:"background 0.15s",
            transform: i < digits.length ? "scale(1.15)" : "scale(1)",
          }}/>
        ))}
      </div>

      {/* Numpad */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, width:"100%", maxWidth:280 }}>
        {KEYS.map((key, i) => (
          <button key={i} onClick={() => press(key)}
            disabled={key === ""}
            style={{
              height:70, borderRadius:18,
              background: key === "" ? "transparent" : key === "del" ? "var(--surface2)" : "var(--surface)",
              border: key === "" ? "none" : "1px solid var(--border)",
              fontSize: key === "del" ? 14 : 26,
              fontWeight: 700,
              color: key === "del" ? "var(--sub)" : "var(--text)",
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow: key && key !== "" ? "0 2px 8px rgba(0,0,0,.08)" : "none",
              transition:"transform 0.08s, opacity 0.08s",
              cursor: key === "" ? "default" : "pointer",
            }}
            onMouseDown={e => e.currentTarget.style.transform = "scale(0.93)"}
            onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
            onTouchStart={e => e.currentTarget.style.transform = "scale(0.93)"}
            onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}
          >
            {key === "del" ? <Delete size={20}/> : key}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-10px)}
          40%{transform:translateX(10px)}
          60%{transform:translateX(-8px)}
          80%{transform:translateX(8px)}
        }
      `}</style>
    </div>
  );
}

/* ── Setup / Change passcode modal ── */
export function PasscodeSetup({ mode = "set", onDone, onClose }) {
  const [step,        setStep]        = useState(mode === "disable" ? "confirm" : "enter");
  const [first,       setFirst]       = useState("");
  const [digits,      setDigits]      = useState([]);
  const [shake,       setShake]       = useState(false);
  const [msg,         setMsg]         = useState("");
  const [showForgot,  setShowForgot]  = useState(false);
  const [email,       setEmail]       = useState("");
  const [forgotBusy,  setForgotBusy]  = useState(false);
  const [forgotMsg,   setForgotMsg]   = useState({ text:"", ok:false });

  const title = {
    enter:   mode === "change" ? "Masukkan passcode lama" : "Buat passcode baru",
    confirm: step === "confirm" && mode === "disable" ? "Konfirmasi passcode" : "Ulangi passcode baru",
  }[step] || "";

  useEffect(() => {
    if (digits.length < 4) return;
    const code = digits.join("");

    if (step === "enter") {
      setFirst(code);
      setDigits([]);
      setStep("confirm");
    } else if (step === "confirm") {
      if (mode === "disable") {
        if (checkPasscode(code)) { removePasscode(); onDone("Passcode dinonaktifkan."); }
        else { bad("Passcode salah!"); }
      } else if (mode === "change") {
        if (checkPasscode(code)) { setFirst(""); setDigits([]); setStep("new"); }
        else { bad("Passcode lama salah!"); }
      } else {
        if (code === first) { savePasscode(code); onDone("Passcode berhasil diaktifkan!"); }
        else { bad("Passcode tidak cocok, coba lagi."); setStep("enter"); setFirst(""); }
      }
    } else if (step === "new") {
      setFirst(code); setDigits([]); setStep("confirm-new");
    } else if (step === "confirm-new") {
      if (code === first) { savePasscode(code); onDone("Passcode berhasil diubah!"); }
      else { bad("Passcode tidak cocok."); setStep("new"); setFirst(""); }
    }
  }, [digits]);

  function bad(m) { setMsg(m); setShake(true); setTimeout(() => { setShake(false); setDigits([]); setMsg(""); }, 700); }

  async function sendForgotEmail(e) {
    e.preventDefault();
    setForgotBusy(true);
    setForgotMsg({ text:"", ok:false });
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/?reset_passcode=1` },
    });
    setForgotBusy(false);
    if (error) setForgotMsg({ text: error.message, ok:false });
    else setForgotMsg({ text:"Link reset dikirim! Cek email kamu.", ok:true });
  }

  function press(key) {
    if (key === "del") { setDigits(d => d.slice(0,-1)); return; }
    if (key === "" || digits.length >= 4) return;
    setDigits(d => [...d, key]);
  }

  const stepTitle = step === "enter" ? (mode === "change" ? "Masukkan passcode lama" : "Buat passcode baru")
    : step === "confirm" ? (mode === "disable" ? "Konfirmasi passcode" : "Ulangi passcode baru")
    : step === "new" ? "Buat passcode baru"
    : "Ulangi passcode baru";

  return (<>
    <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal-sheet" style={{ paddingBottom:"env(safe-area-inset-bottom,24px)" }}>
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 8px" }}>
          <div style={{ width:36, height:4, borderRadius:99, background:"var(--border)" }}/>
        </div>

        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"8px 24px 28px" }}>
          <p style={{ fontSize:17, fontWeight:800, marginBottom:6 }}>{stepTitle}</p>
          {msg && <p style={{ fontSize:12, color:"var(--expense)", marginBottom:4 }}>{msg}</p>}

          {/* Dots */}
          <div style={{ display:"flex", gap:16, margin:"20px 0 32px",
            animation: shake ? "shake 0.5s ease" : "none" }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                width:14, height:14, borderRadius:"50%",
                background: i < digits.length ? "var(--brand)" : "var(--border)",
                transition:"background 0.15s",
                transform: i < digits.length ? "scale(1.2)" : "scale(1)",
              }}/>
            ))}
          </div>

          {/* Numpad */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, width:"100%", maxWidth:260 }}>
            {KEYS.map((key, i) => (
              <button key={i} onClick={() => press(key)} disabled={key === ""}
                style={{
                  height:62, borderRadius:16,
                  background: key === "" ? "transparent" : key === "del" ? "var(--surface2)" : "var(--surface)",
                  border: key === "" ? "none" : "1px solid var(--border)",
                  fontSize: key === "del" ? 13 : 22, fontWeight:700,
                  color: key === "del" ? "var(--sub)" : "var(--text)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  cursor: key === "" ? "default" : "pointer",
                }}>
                {key === "del" ? <Delete size={18}/> : key}
              </button>
            ))}
          </div>

          <button onClick={onClose} style={{ marginTop:20, fontSize:13, color:"var(--sub)", fontWeight:600 }}>
            Batal
          </button>

          {/* Lupa passcode — hanya tampil di mode change, step enter */}
          {mode === "change" && step === "enter" && (
            <button onClick={() => setShowForgot(true)}
              style={{ marginTop:8, fontSize:12, color:"var(--brand)", fontWeight:600 }}>
              Lupa passcode?
            </button>
          )}
        </div>

        <style>{`
          @keyframes shake {
            0%,100%{transform:translateX(0)}
            20%{transform:translateX(-8px)}
            40%{transform:translateX(8px)}
            60%{transform:translateX(-6px)}
            80%{transform:translateX(6px)}
          }
        `}</style>
      </div>
    </div>

    {/* Forgot passcode modal */}

    {showForgot && (
      <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && setShowForgot(false)}>
        <div className="modal-sheet" style={{ paddingBottom:"env(safe-area-inset-bottom,24px)" }}>
          <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 8px" }}>
            <div style={{ width:36, height:4, borderRadius:99, background:"var(--border)" }}/>
          </div>
          <div style={{ padding:"8px 20px 28px" }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
              <div style={{ width:56, height:56, borderRadius:16,
                background:"rgba(99,102,241,.12)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>
                📧
              </div>
            </div>
            <p style={{ fontSize:17, fontWeight:800, textAlign:"center", marginBottom:6 }}>Lupa Passcode?</p>
            <p style={{ fontSize:13, color:"var(--sub)", textAlign:"center", marginBottom:20 }}>
              Masukkan email akun kamu. Kami akan kirim link untuk reset passcode.
            </p>

            <form onSubmit={sendForgotEmail} style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div className="field-wrap">
                <span style={{ marginLeft:14, color:"var(--sub)", flexShrink:0 }}>
                  <Mail size={17}/>
                </span>
                <input className="field-input" type="email" placeholder="nama@email.com" required
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>

              {forgotMsg.text && (
                <p style={{ fontSize:13, borderRadius:12, padding:"10px 14px",
                  background: forgotMsg.ok ? "rgba(0,184,148,.12)" : "rgba(255,92,92,.12)",
                  color: forgotMsg.ok ? "#00B894" : "var(--expense)" }}>
                  {forgotMsg.text}
                </p>
              )}

              <button type="submit" disabled={forgotBusy}
                style={{ height:50, borderRadius:14, background:"var(--brand)", color:"#fff",
                  fontWeight:800, fontSize:15, opacity: forgotBusy ? 0.7 : 1 }}>
                {forgotBusy ? "Mengirim…" : "Kirim Link Reset"}
              </button>

              <button type="button" onClick={() => setShowForgot(false)}
                style={{ fontSize:13, color:"var(--sub)", fontWeight:600, textAlign:"center" }}>
                ← Kembali
              </button>
            </form>
          </div>
        </div>
      </div>
    )}
  </>);
}
