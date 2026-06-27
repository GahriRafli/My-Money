"use client";
import { ChevronLeft } from "lucide-react";
import { THEMES } from "@/lib/constants";

export default function ThemePage({ currentTheme, onTheme, onBack }) {
  return (
    <div>
      <div className="topbar">
        <button className="page-back-btn" onClick={onBack}><ChevronLeft size={18} /></button>
        <p style={{ flex:1, fontSize:16, fontWeight:700 }}>Pilih Tema</p>
      </div>

      <div style={{ padding:"20px 16px", display:"flex", flexDirection:"column", gap:12 }}>
        <p style={{ fontSize:13, color:"var(--sub)", marginBottom:4, lineHeight:1.6 }}>
          Tema yang kamu pilih akan tersimpan secara otomatis.
        </p>

        {THEMES.map(theme => {
          const active = currentTheme === theme.id;
          return (
            <button key={theme.id} onClick={() => onTheme(theme.id)}
              style={{ display:"flex", alignItems:"center", gap:16, padding:"14px 16px",
                borderRadius:16, border:`2px solid ${active?"var(--accent)":"var(--border)"}`,
                background: active ? "rgba(99,102,241,.08)" : "var(--surface)",
                transition:"all .2s", textAlign:"left" }}>
              {/* Preview swatch */}
              <div style={{ width:52, height:52, borderRadius:14, background:theme.preview,
                flexShrink:0, border:"2px solid rgba(255,255,255,0.1)",
                display:"flex", flexDirection:"column", gap:4, padding:8, overflow:"hidden" }}>
                <div style={{ height:8, borderRadius:4, background:"rgba(255,255,255,0.25)", width:"100%" }} />
                <div style={{ height:6, borderRadius:4, background:"rgba(255,255,255,0.15)", width:"70%" }} />
                <div style={{ height:6, borderRadius:4, background:"rgba(99,102,241,0.6)", width:"50%" }} />
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:15, fontWeight:700 }}>{theme.label}</p>
                <p style={{ fontSize:12, color:"var(--sub)", marginTop:2 }}>
                  {theme.id === "dark"   && "Dark purple — cocok untuk malam hari"}
                  {theme.id === "light"  && "Light mode — terang dan bersih"}
                  {theme.id === "amoled" && "Pure black — hemat baterai OLED"}
                  {theme.id === "forest" && "Dark green — nuansa alam yang tenang"}
                  {theme.id === "ocean"  && "Dark blue — seperti di kedalaman laut"}
                </p>
              </div>
              {active && (
                <div style={{ width:24, height:24, borderRadius:99, background:"var(--accent)",
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ fontSize:13, color:"#fff" }}>✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
