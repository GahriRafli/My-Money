"use client";
import { useState } from "react";
import { X } from "lucide-react";

const QUICK_EMOJI = ["💼","🏠","🚗","✈️","🎮","🛒","💊","📚","🎵","☕","🌿","💰","🏦","📱","🎁","⚽","🍕","🐾","💡","🔧","👗","🏋️","🎨","🌐"];

export default function CustomItemModal({ title = "Tambah Baru", namePlaceholder = "Nama", onSave, onClose }) {
  const [name,  setName]  = useState("");
  const [emoji, setEmoji] = useState("💼");
  const [custom, setCustom] = useState(""); // user-typed emoji override

  const displayEmoji = custom || emoji;

  function handleSave() {
    if (!name.trim()) return;
    const id = name.trim().toLowerCase().replace(/\s+/g, "_") + "_" + Date.now();
    onSave({ id, name: name.trim(), icon: displayEmoji, color: "#6366F1" });
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 6px" }}>
          <div style={{ width:36, height:4, borderRadius:99, background:"var(--border)" }} />
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px 14px" }}>
          <h2 style={{ fontSize:17, fontWeight:800 }}>{title}</h2>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:10, background:"var(--surface2)",
            display:"flex", alignItems:"center", justifyContent:"center", color:"var(--sub)" }}>
            <X size={17} />
          </button>
        </div>

        <div style={{ padding:"0 16px 28px", display:"flex", flexDirection:"column", gap:16 }}>
          {/* Emoji preview + custom input */}
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:56, height:56, borderRadius:18, background:"var(--surface2)",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, flexShrink:0 }}>
              {displayEmoji}
            </div>
            <div style={{ flex:1 }}>
              <span className="field-label">Ikon (emoji)</span>
              <div className="field-wrap" style={{ marginTop:4 }}>
                <input className="field-input" placeholder="Ketik emoji..."
                  value={custom} onChange={e => setCustom(e.target.value)}
                  style={{ fontSize:18 }} maxLength={4} />
              </div>
            </div>
          </div>

          {/* Quick emoji grid */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {QUICK_EMOJI.map(em => (
              <button key={em} type="button"
                onClick={() => { setEmoji(em); setCustom(""); }}
                style={{ width:40, height:40, borderRadius:10, fontSize:20,
                  background: emoji === em && !custom ? "rgba(99,102,241,.15)" : "var(--surface2)",
                  border: emoji === em && !custom ? "2px solid var(--accent)" : "2px solid transparent" }}>
                {em}
              </button>
            ))}
          </div>

          {/* Name */}
          <div>
            <span className="field-label">{namePlaceholder}</span>
            <div className="field-wrap">
              <input className="field-input" placeholder={`cth: ${namePlaceholder}`}
                value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSave()} autoFocus />
            </div>
          </div>

          <button onClick={handleSave} disabled={!name.trim()}
            style={{ height:52, borderRadius:14, fontWeight:800, fontSize:15, color:"#fff",
              background: name.trim() ? "var(--accent)" : "var(--surface2)",
              boxShadow: name.trim() ? "0 6px 20px rgba(99,102,241,.3)" : "none" }}>
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
