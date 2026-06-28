"use client";
import { useState, useEffect } from "react";
import { Delete } from "lucide-react";

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
  const [step,   setStep]   = useState(mode === "disable" ? "confirm" : "enter");
  const [first,  setFirst]  = useState("");
  const [digits, setDigits] = useState([]);
  const [shake,  setShake]  = useState(false);
  const [msg,    setMsg]    = useState("");

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

  function press(key) {
    if (key === "del") { setDigits(d => d.slice(0,-1)); return; }
    if (key === "" || digits.length >= 4) return;
    setDigits(d => [...d, key]);
  }

  const stepTitle = step === "enter" ? (mode === "change" ? "Masukkan passcode lama" : "Buat passcode baru")
    : step === "confirm" ? (mode === "disable" ? "Konfirmasi passcode" : "Ulangi passcode baru")
    : step === "new" ? "Buat passcode baru"
    : "Ulangi passcode baru";

  return (
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
  );
}
