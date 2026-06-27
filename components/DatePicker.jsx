"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const DAYS   = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni",
                "Juli","Agustus","September","Oktober","November","Desember"];

function parseLocal(str) {
  if (!str) return new Date();
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function buildGrid(year, month) {
  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const prevTotal = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = first - 1; i >= 0; i--) cells.push({ d: prevTotal - i, cur: false });
  for (let d = 1; d <= total; d++) cells.push({ d, cur: true });
  while (cells.length % 7) cells.push({ d: cells.length - first - total + 1, cur: false });
  return cells;
}

export default function DatePicker({ value, onChange }) {
  const sel  = parseLocal(value);
  const today = new Date();

  const [open,  setOpen]  = useState(false);
  const [view,  setView]  = useState({ y: sel.getFullYear(), m: sel.getMonth() });
  const ref = useRef(null);

  useEffect(() => {
    function onOut(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onOut);
    return () => document.removeEventListener("mousedown", onOut);
  }, []);

  function pick(d) {
    const chosen = new Date(view.y, view.m, d);
    onChange(toStr(chosen));
    setOpen(false);
  }

  function prevM() { setView(v => v.m === 0 ? { y: v.y-1, m: 11 } : { y: v.y, m: v.m-1 }); }
  function nextM() { setView(v => v.m === 11 ? { y: v.y+1, m: 0  } : { y: v.y, m: v.m+1 }); }

  const grid = buildGrid(view.y, view.m);

  const displayStr = sel
    ? `${String(sel.getDate()).padStart(2,"0")} ${MONTHS[sel.getMonth()]} ${sel.getFullYear()}`
    : "Pilih tanggal";

  const isToday = (d) =>
    view.y === today.getFullYear() && view.m === today.getMonth() && d === today.getDate();
  const isSel = (d) =>
    view.y === sel.getFullYear() && view.m === sel.getMonth() && d === sel.getDate();

  return (
    <div ref={ref} style={{ position:"relative" }}>
      {/* Trigger */}
      <button type="button" onClick={() => { setOpen(o => !o); setView({ y: sel.getFullYear(), m: sel.getMonth() }); }}
        className="field-wrap" style={{ width:"100%", justifyContent:"space-between", cursor:"pointer" }}>
        <span className="field-input" style={{ fontSize:14, color:"var(--text)", pointerEvents:"none" }}>
          {displayStr}
        </span>
        <Calendar size={17} style={{ marginRight:14, color:"var(--sub)", flexShrink:0 }} />
      </button>

      {/* Dropdown calendar */}
      {open && (
        <div style={{
          position:"absolute", bottom:"calc(100% + 8px)", left:0, right:0, zIndex:200,
          background:"var(--surface)", borderRadius:20,
          border:"1px solid var(--border)",
          boxShadow:"0 20px 60px rgba(0,0,0,.35)",
          overflow:"hidden",
          animation:"fadeIn .15s ease",
        }}>
          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"14px 16px 10px" }}>
            <button type="button" onClick={prevM}
              style={{ width:34, height:34, borderRadius:10, background:"var(--surface2)",
                display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text)" }}>
              <ChevronLeft size={18} />
            </button>
            <p style={{ fontSize:15, fontWeight:800 }}>
              {MONTHS[view.m]} {view.y}
            </p>
            <button type="button" onClick={nextM}
              style={{ width:34, height:34, borderRadius:10, background:"var(--surface2)",
                display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text)" }}>
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", padding:"0 12px 4px" }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign:"center", fontSize:11, fontWeight:700,
                color:"var(--sub)", padding:"4px 0" }}>{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", padding:"0 12px 14px", gap:2 }}>
            {grid.map((cell, i) => {
              const sel_  = cell.cur && isSel(cell.d);
              const tod   = cell.cur && isToday(cell.d);
              return (
                <button key={i} type="button" disabled={!cell.cur}
                  onClick={() => cell.cur && pick(cell.d)}
                  style={{
                    height:36, borderRadius:10, fontSize:13, fontWeight: sel_ ? 800 : 500,
                    color: sel_ ? "#fff" : tod ? "var(--accent)" : cell.cur ? "var(--text)" : "var(--border)",
                    background: sel_ ? "var(--accent)" : tod && !sel_ ? "rgba(99,102,241,.12)" : "transparent",
                    border: sel_ ? "none" : tod && !sel_ ? "1.5px solid var(--accent)" : "none",
                    cursor: cell.cur ? "pointer" : "default",
                    transition:"background .12s",
                  }}>
                  {cell.d}
                </button>
              );
            })}
          </div>

          {/* Footer shortcuts */}
          <div style={{ display:"flex", gap:8, padding:"0 12px 14px" }}>
            <button type="button" onClick={() => { onChange(toStr(today)); setOpen(false); }}
              style={{ flex:1, height:38, borderRadius:12, border:"1.5px solid var(--accent)",
                color:"var(--accent)", fontSize:13, fontWeight:700 }}>
              Hari ini
            </button>
            <button type="button" onClick={() => {
              const y = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
              onChange(toStr(y)); setOpen(false);
            }} style={{ flex:1, height:38, borderRadius:12, border:"1px solid var(--border)",
              color:"var(--sub)", fontSize:13, fontWeight:600 }}>
              Kemarin
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
