"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, SlidersHorizontal, Star, Trash2, X } from "lucide-react";
import { catOf, dayLabel, fmt, monthKey, monthLabel, nextMonth, prevMonth } from "@/lib/utils";

const PIE_COLORS = ["#FF6B6B","#FF9F43","#FDCB6E","#55EFC4","#74B9FF","#A29BFE","#FD79A8","#00CEC9","#E17055","#6C5CE7","#00B894","#0984E3"];

export default function TxsTab({ txs, month, setMonth, summary, loading, onAdd, onEdit, onDelete, onStar, isGuest, onGoMore }) {
  const [subtab,     setSubtab]     = useState("daily");
  const [search,     setSearch]     = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [filter,     setFilter]     = useState("all");   // all | expense | income | transfer
  const [showFilter, setShowFilter] = useState(false);
  const [showStars,  setShowStars]  = useState(false);
  const [selected,   setSelected]   = useState(null);    // tx for action sheet

  const monthTxs = useMemo(() =>
    txs.filter(t => t.date?.startsWith(monthKey(month))), [txs, month]);

  const filtered = useMemo(() => {
    let list = monthTxs;
    if (filter !== "all") list = list.filter(t => t.type === filter);
    if (showStars) list = list.filter(t => t.is_starred);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.note?.toLowerCase().includes(q) || catOf(t).name.toLowerCase().includes(q));
    }
    return list;
  }, [monthTxs, filter, showStars, search]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(tx => { (map[tx.date || ""] ||= []).push(tx); });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const inc = monthTxs.filter(t=>t.type==="income").reduce((s,t)=>s+Number(t.amount),0);
  const exp = monthTxs.filter(t=>t.type==="expense").reduce((s,t)=>s+Number(t.amount),0);

  const FILTER_OPTS = [
    { id:"all",      label:"Semua",       color:"var(--accent)"  },
    { id:"expense",  label:"Pengeluaran", color:"var(--expense)" },
    { id:"income",   label:"Pemasukan",   color:"var(--income)"  },
    { id:"transfer", label:"Transfer",    color:"#F59E0B"        },
  ];

  return (
    <div>
      {/* Topbar */}
      <div className="topbar">
        <button style={{ color: showSearch ? "var(--accent)" : "var(--sub)" }}
          onClick={() => setShowSearch(!showSearch)}>
          <Search size={20} />
        </button>
        <p style={{ flex:1, textAlign:"center", fontWeight:700, fontSize:16 }}>Trans.</p>
        <button style={{ color: showStars ? "#F59E0B" : "var(--sub)" }}
          onClick={() => setShowStars(!showStars)}>
          <Star size={20} fill={showStars ? "#F59E0B" : "none"} />
        </button>
        <button style={{ color: filter !== "all" ? "var(--accent)" : "var(--sub)" }}
          onClick={() => setShowFilter(!showFilter)}>
          <SlidersHorizontal size={20} />
        </button>
      </div>

      {/* Filter pills */}
      {showFilter && (
        <div style={{ padding:"10px 14px", display:"flex", gap:8, borderBottom:"1px solid var(--border)",
          background:"var(--surface)", flexWrap:"wrap" }}>
          {FILTER_OPTS.map(f => (
            <button key={f.id} onClick={() => { setFilter(f.id); setShowFilter(false); }}
              style={{ padding:"6px 14px", borderRadius:99, fontSize:12, fontWeight:700,
                background: filter===f.id ? f.color : "var(--surface2)",
                color: filter===f.id ? "#fff" : "var(--sub)",
                border: `1.5px solid ${filter===f.id ? f.color : "var(--border)"}` }}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Search bar */}
      {showSearch && (
        <div style={{ padding:"8px 14px", background:"var(--bg)", borderBottom:"1px solid var(--border)" }}>
          <div className="field-wrap" style={{ height:40 }}>
            <Search size={15} style={{ marginLeft:12, color:"var(--sub)", flexShrink:0 }} />
            <input className="field-input" placeholder="Cari transaksi..." autoFocus
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && (
              <button onClick={() => setSearch("")} style={{ marginRight:10, color:"var(--sub)" }}>
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Month nav */}
      <MonthNav month={month} setMonth={setMonth} />

      {/* Sub-tabs */}
      <div className="subtabs">
        {[["daily","Daily"],["calendar","Calendar"],["monthly","Monthly"],["summary","Summary"]].map(([id,label]) => (
          <button key={id} className={`subtab${subtab===id?" active":""}`} onClick={() => setSubtab(id)}>{label}</button>
        ))}
      </div>

      {/* Summary row */}
      <div className="summary-bar">
        <div>
          <p style={{ fontSize:10, color:"var(--sub)", marginBottom:2 }}>Income</p>
          <p style={{ fontSize:12, fontWeight:700, color:"var(--income)" }}>{fmt(inc)}</p>
        </div>
        <div style={{ textAlign:"center" }}>
          <p style={{ fontSize:10, color:"var(--sub)", marginBottom:2 }}>Exp.</p>
          <p style={{ fontSize:12, fontWeight:700, color:"var(--expense)" }}>{fmt(exp)}</p>
        </div>
        <div style={{ textAlign:"right" }}>
          <p style={{ fontSize:10, color:"var(--sub)", marginBottom:2 }}>Total</p>
          <p style={{ fontSize:12, fontWeight:700, color:"var(--text)" }}>{fmt(inc - exp)}</p>
        </div>
      </div>

      {/* Active filter badge */}
      {subtab === "daily" && (filter !== "all" || showStars) && (
        <div style={{ padding:"6px 14px", display:"flex", gap:8, alignItems:"center" }}>
          {filter !== "all" && (
            <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99,
              background:"rgba(99,102,241,.15)", color:"var(--accent)", display:"flex", alignItems:"center", gap:4 }}>
              {FILTER_OPTS.find(f=>f.id===filter)?.label}
              <button onClick={() => setFilter("all")}><X size={11} /></button>
            </span>
          )}
          {showStars && (
            <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99,
              background:"rgba(245,158,11,.15)", color:"#F59E0B", display:"flex", alignItems:"center", gap:4 }}>
              ⭐ Favorit
              <button onClick={() => setShowStars(false)}><X size={11} /></button>
            </span>
          )}
        </div>
      )}

      {/* Calendar view */}
      {subtab === "calendar" && (
        <CalendarView monthTxs={monthTxs} month={month} onTapDay={tx => setSelected(tx)} onTapTx={tx => setSelected(tx)} />
      )}

      {/* Monthly view */}
      {subtab === "monthly" && (
        <MonthlyView txs={txs} month={month} />
      )}

      {/* Summary view */}
      {subtab === "summary" && (
        <SummaryView monthTxs={monthTxs} inc={inc} exp={exp} />
      )}

      {/* Guest hint */}
      {subtab === "daily" && isGuest && (
        <div style={{ margin:"10px 14px", padding:"10px 14px", background:"rgba(255,109,78,.1)",
          borderRadius:12, display:"flex", alignItems:"center", gap:10, border:"1px solid rgba(255,109,78,.2)" }}>
          <span style={{ fontSize:16 }}>👤</span>
          <p style={{ flex:1, fontSize:12, color:"rgba(255,109,78,.9)" }}>Mode tamu — data tidak tersimpan</p>
          <button onClick={onGoMore}
            style={{ background:"var(--accent)", color:"#fff", fontSize:11, fontWeight:700, padding:"5px 12px", borderRadius:8 }}>
            Login
          </button>
        </div>
      )}

      {/* Daily List */}
      {subtab === "daily" && loading && <SkelRows n={6} />}
      {subtab === "daily" && !loading && grouped.length === 0 && (
        <Empty icon="📋" title="Belum ada transaksi" sub="Ketuk + untuk mencatat transaksi baru." />
      )}
      {subtab === "daily" && !loading && grouped.map(([date, list]) => {
        const { day, dow } = dayLabel(date);
        const dInc = list.filter(t=>t.type==="income").reduce((s,t)=>s+Number(t.amount),0);
        const dExp = list.filter(t=>t.type==="expense").reduce((s,t)=>s+Number(t.amount),0);
        return (
          <div key={date}>
            <div style={{ display:"flex", alignItems:"center", padding:"8px 14px",
              borderBottom:"1px solid var(--border)", background:"var(--surface)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, flex:1 }}>
                <span style={{ fontSize:18, fontWeight:800, lineHeight:1 }}>{day}</span>
                <span style={{ fontSize:10, fontWeight:700, background:"var(--surface2)",
                  color:"var(--sub)", padding:"2px 6px", borderRadius:6 }}>{dow}</span>
              </div>
              <div style={{ display:"flex", gap:14 }}>
                {dInc > 0 && <span style={{ fontSize:12, fontWeight:600, color:"var(--income)" }}>{fmt(dInc)}</span>}
                {dExp > 0 && <span style={{ fontSize:12, fontWeight:600, color:"var(--expense)" }}>{fmt(dExp)}</span>}
              </div>
            </div>
            {list.map(tx => (
              <TxRow key={tx.id} tx={tx}
                onTap={() => setSelected(tx)}
              />
            ))}
          </div>
        );
      })}

      {/* FAB */}
      <button onClick={onAdd} className="fab"
        style={{ position:"fixed", right:20, bottom:"calc(72px + env(safe-area-inset-bottom,0px))", zIndex:40 }}
        aria-label="Tambah">
        <Plus size={24} color="#fff" />
      </button>

      {/* Action sheet */}
      {selected && (
        <TxActionSheet
          tx={selected}
          onClose={() => setSelected(null)}
          onEdit={() => { onEdit?.(selected); setSelected(null); }}
          onDelete={() => { onDelete?.(selected); setSelected(null); }}
          onStar={() => { onStar?.(selected); setSelected(null); }}
        />
      )}
    </div>
  );
}

// ── CALENDAR VIEW ────────────────────────────────────────────
const CAL_DAYS = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];

function CalendarView({ monthTxs, month, onTapTx }) {
  const [activeDayTxs, setActiveDayTxs] = useState(null); // { date, txs }

  const year = month.getFullYear();
  const m    = month.getMonth();
  const firstDow = new Date(year, m, 1).getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const today = new Date();

  // Map date-string → { inc, exp }
  const dayMap = useMemo(() => {
    const map = {};
    monthTxs.forEach(tx => {
      if (!tx.date) return;
      if (!map[tx.date]) map[tx.date] = { inc:0, exp:0, txs:[] };
      if (tx.type === "income")  map[tx.date].inc += Number(tx.amount);
      if (tx.type === "expense") map[tx.date].exp += Number(tx.amount);
      map[tx.date].txs.push(tx);
    });
    return map;
  }, [monthTxs]);

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function dateStr(d) {
    return `${year}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  }

  const isToday = d => today.getFullYear()===year && today.getMonth()===m && today.getDate()===d;

  return (
    <div>
      {/* Day headers */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", padding:"8px 12px 4px",
        borderBottom:"1px solid var(--border)" }}>
        {CAL_DAYS.map(d => (
          <p key={d} style={{ textAlign:"center", fontSize:11, fontWeight:700, color:"var(--sub)" }}>{d}</p>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", padding:"4px 8px 8px", gap:2 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const ds  = dateStr(d);
          const day = dayMap[ds];
          const dot_inc = day?.inc > 0;
          const dot_exp = day?.exp > 0;
          return (
            <button key={ds} onClick={() => day && setActiveDayTxs({ date:ds, txs:day.txs })}
              style={{ display:"flex", flexDirection:"column", alignItems:"center",
                padding:"6px 2px 4px", borderRadius:12,
                background: isToday(d) ? "var(--accent)" : "transparent",
                opacity: day ? 1 : 0.5 }}>
              <p style={{ fontSize:13, fontWeight:isToday(d)||day?700:400,
                color: isToday(d) ? "#fff" : "var(--text)" }}>{d}</p>
              <div style={{ display:"flex", gap:2, marginTop:3, height:6, alignItems:"center" }}>
                {dot_inc && <div style={{ width:5, height:5, borderRadius:99,
                  background: isToday(d) ? "rgba(255,255,255,.8)" : "var(--income)" }} />}
                {dot_exp && <div style={{ width:5, height:5, borderRadius:99,
                  background: isToday(d) ? "rgba(255,255,255,.6)" : "var(--expense)" }} />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Day detail sheet */}
      {activeDayTxs && (
        <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && setActiveDayTxs(null)}>
          <div className="modal-sheet" style={{ paddingBottom:"env(safe-area-inset-bottom,16px)" }}>
            <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 8px" }}>
              <div style={{ width:36, height:4, borderRadius:99, background:"var(--border)" }} />
            </div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px 12px" }}>
              <p style={{ fontSize:15, fontWeight:800 }}>{activeDayTxs.date}</p>
              <button onClick={() => setActiveDayTxs(null)}
                style={{ width:30, height:30, borderRadius:8, background:"var(--surface2)",
                  display:"flex", alignItems:"center", justifyContent:"center", color:"var(--sub)" }}>
                <X size={15} />
              </button>
            </div>
            {activeDayTxs.txs.map(tx => (
              <TxRow key={tx.id} tx={tx} onTap={() => { setActiveDayTxs(null); onTapTx(tx); }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── MONTHLY VIEW ──────────────────────────────────────────────
const SHORT_MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

function MonthlyView({ txs, month }) {
  const bars = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(month);
      d.setMonth(d.getMonth() - 11 + i);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      const mTxs = txs.filter(t => t.date?.startsWith(key));
      const inc  = mTxs.filter(t=>t.type==="income").reduce((s,t)=>s+Number(t.amount),0);
      const exp  = mTxs.filter(t=>t.type==="expense").reduce((s,t)=>s+Number(t.amount),0);
      return { label: SHORT_MONTHS[d.getMonth()], year: d.getFullYear(), key, inc, exp, net: inc-exp };
    });
  }, [txs, month]);

  const maxVal = Math.max(...bars.map(b => Math.max(b.inc, b.exp)), 1);
  const curKey = `${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,"0")}`;

  return (
    <div style={{ padding:"16px 14px", paddingBottom:80 }}>
      <p style={{ fontSize:13, fontWeight:700, color:"var(--sub)", marginBottom:16 }}>12 Bulan Terakhir</p>

      {/* Bar chart */}
      <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:140, marginBottom:8 }}>
        {bars.map(b => {
          const isCur = b.key === curKey;
          const incH  = b.inc > 0 ? Math.max((b.inc / maxVal) * 120, 4) : 0;
          const expH  = b.exp > 0 ? Math.max((b.exp / maxVal) * 120, 4) : 0;
          return (
            <div key={b.key} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
              <div style={{ display:"flex", alignItems:"flex-end", gap:2, height:124 }}>
                <div style={{ width:8, height:incH, borderRadius:"4px 4px 0 0",
                  background: isCur ? "var(--income)" : "rgba(16,185,129,.35)",
                  transition:"height .3s" }} />
                <div style={{ width:8, height:expH, borderRadius:"4px 4px 0 0",
                  background: isCur ? "var(--expense)" : "rgba(255,92,92,.35)",
                  transition:"height .3s" }} />
              </div>
              <p style={{ fontSize:9, fontWeight: isCur?800:500, color: isCur?"var(--accent)":"var(--sub)",
                textAlign:"center" }}>{b.label}</p>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display:"flex", gap:14, marginBottom:20, justifyContent:"center" }}>
        <span style={{ fontSize:11, color:"var(--income)", fontWeight:600 }}>● Pemasukan</span>
        <span style={{ fontSize:11, color:"var(--expense)", fontWeight:600 }}>● Pengeluaran</span>
      </div>

      {/* Monthly rows */}
      {[...bars].reverse().map(b => (
        <div key={b.key} style={{ display:"flex", alignItems:"center", padding:"11px 0",
          borderBottom:"1px solid var(--border)",
          opacity: b.inc===0 && b.exp===0 ? 0.4 : 1 }}>
          <p style={{ fontSize:13, fontWeight: b.key===curKey?800:600, flex:1,
            color: b.key===curKey?"var(--accent)":"var(--text)" }}>
            {b.label} {b.year}
          </p>
          <div style={{ textAlign:"right" }}>
            <div style={{ display:"flex", gap:12, justifyContent:"flex-end" }}>
              <span style={{ fontSize:12, color:"var(--income)", fontWeight:600 }}>+{fmt(b.inc)}</span>
              <span style={{ fontSize:12, color:"var(--expense)", fontWeight:600 }}>-{fmt(b.exp)}</span>
            </div>
            <p style={{ fontSize:11, color: b.net>=0?"var(--income)":"var(--expense)", fontWeight:700, marginTop:2 }}>
              {b.net>=0?"+":""}{fmt(b.net)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── SUMMARY VIEW ──────────────────────────────────────────────
function SummaryView({ monthTxs, inc, exp }) {
  const [view, setView] = useState("expense");

  const catData = useMemo(() => {
    const filtered = monthTxs.filter(t => t.type === view);
    const total    = filtered.reduce((s,t) => s + Number(t.amount), 0);
    const map = {};
    filtered.forEach(tx => {
      const cat = catOf(tx);
      if (!map[cat.name]) map[cat.name] = { name:cat.name, icon:cat.icon, color:cat.color, value:0 };
      map[cat.name].value += Number(tx.amount);
    });
    return { total, cats: Object.values(map).sort((a,b)=>b.value-a.value)
      .map((d,i) => ({ ...d, color: d.color || PIE_COLORS[i%PIE_COLORS.length],
        pct: total>0 ? Math.round(d.value/total*100) : 0 })) };
  }, [monthTxs, view]);

  const net = inc - exp;

  return (
    <div style={{ paddingBottom:80 }}>
      {/* Net card */}
      <div style={{ margin:"14px 14px 0", padding:"16px", borderRadius:16,
        background:"var(--surface)", border:"1px solid var(--border)" }}>
        <p style={{ fontSize:11, color:"var(--sub)", marginBottom:6, fontWeight:600 }}>Net Bulan Ini</p>
        <p style={{ fontSize:28, fontWeight:900, color: net>=0?"var(--income)":"var(--expense)" }}>
          {net>=0?"+":""}{fmt(net)}
        </p>
        <div style={{ display:"flex", gap:20, marginTop:12 }}>
          <div>
            <p style={{ fontSize:10, color:"var(--sub)" }}>Pemasukan</p>
            <p style={{ fontSize:14, fontWeight:700, color:"var(--income)" }}>{fmt(inc)}</p>
          </div>
          <div>
            <p style={{ fontSize:10, color:"var(--sub)" }}>Pengeluaran</p>
            <p style={{ fontSize:14, fontWeight:700, color:"var(--expense)" }}>{fmt(exp)}</p>
          </div>
        </div>
      </div>

      {/* Toggle */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", margin:"14px 14px 0",
        background:"var(--surface2)", borderRadius:12, padding:4 }}>
        {[["expense","Pengeluaran"],["income","Pemasukan"]].map(([id,label]) => (
          <button key={id} onClick={() => setView(id)}
            style={{ padding:"9px", borderRadius:10, fontSize:13, fontWeight:700,
              background: view===id ? "var(--surface)" : "transparent",
              color: view===id ? (id==="expense"?"var(--expense)":"var(--income)") : "var(--sub)",
              boxShadow: view===id ? "0 2px 8px rgba(0,0,0,.12)" : "none",
              transition:"all .15s" }}>
            {label}
          </button>
        ))}
      </div>

      {catData.cats.length === 0 && (
        <Empty icon="📊" title="Tidak ada data" sub="Belum ada transaksi di bulan ini." />
      )}

      {/* Bar rows */}
      {catData.cats.map((cat, i) => (
        <div key={cat.name} style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:7 }}>
            <span style={{ fontSize:20 }}>{cat.icon}</span>
            <p style={{ fontSize:13, fontWeight:600, flex:1 }}>{cat.name}</p>
            <p style={{ fontSize:13, fontWeight:800 }}>{fmt(cat.value)}</p>
            <p style={{ fontSize:11, fontWeight:700, color:"var(--sub)", minWidth:32, textAlign:"right" }}>{cat.pct}%</p>
          </div>
          <div style={{ height:6, background:"var(--surface2)", borderRadius:99, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${cat.pct}%`,
              background: cat.color || PIE_COLORS[i%PIE_COLORS.length],
              borderRadius:99, transition:"width .4s ease" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TxRow({ tx, onTap }) {
  const isExp = tx.type === "expense";
  const isInc = tx.type === "income";
  const cat = catOf(tx);

  return (
    <button
      onClick={onTap}
      style={{ width:"100%", display:"flex", alignItems:"center", gap:12,
        padding:"11px 14px", borderBottom:"1px solid var(--border)", textAlign:"left", position:"relative" }}>
      <div style={{ width:36, height:36, borderRadius:10, display:"flex", alignItems:"center",
        justifyContent:"center", fontSize:20, flexShrink:0, background:`${cat.color}18` }}>
        {cat.icon}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <p style={{ fontSize:13, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {tx.note || cat.name}
          </p>
          {tx.is_starred && <Star size={11} fill="#F59E0B" color="#F59E0B" />}
        </div>
        <p style={{ fontSize:11, color:"var(--sub)", marginTop:2 }}>
          {cat.name}{tx.wallets?.name ? ` · ${tx.wallets.name}` : ""}
        </p>
      </div>
      <p style={{ fontSize:13, fontWeight:700, flexShrink:0,
        color: isExp ? "var(--expense)" : isInc ? "var(--income)" : "#F59E0B" }}>
        {isExp ? "-" : isInc ? "+" : ""}{fmt(tx.amount)}
      </p>
    </button>
  );
}

function TxActionSheet({ tx, onClose, onEdit, onDelete, onStar }) {
  const cat = catOf(tx);
  const color = tx.type === "expense" ? "var(--expense)" : tx.type === "income" ? "var(--income)" : "#F59E0B";

  return (
    <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal-sheet" style={{ paddingBottom:"env(safe-area-inset-bottom,16px)" }}>
        {/* Handle */}
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 8px" }}>
          <div style={{ width:36, height:4, borderRadius:99, background:"var(--border)" }} />
        </div>

        {/* Tx preview */}
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"4px 16px 16px",
          borderBottom:"1px solid var(--border)" }}>
          <div style={{ width:44, height:44, borderRadius:14, display:"flex", alignItems:"center",
            justifyContent:"center", fontSize:24, background:`${cat.color}18`, flexShrink:0 }}>
            {cat.icon}
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:14, fontWeight:700 }}>{tx.note || cat.name}</p>
            <p style={{ fontSize:12, color:"var(--sub)", marginTop:2 }}>{tx.date}</p>
          </div>
          <p style={{ fontSize:16, fontWeight:800, color }}>{fmt(tx.amount)}</p>
        </div>

        {/* Actions */}
        <div style={{ padding:"8px 12px 8px" }}>
          <button onClick={onEdit}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:14,
              padding:"14px 12px", borderRadius:12, marginBottom:4 }}>
            <div style={{ width:38, height:38, borderRadius:12, background:"rgba(99,102,241,.12)",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Pencil size={18} color="var(--accent)" />
            </div>
            <span style={{ fontSize:14, fontWeight:600 }}>Edit Transaksi</span>
          </button>

          <button onClick={onStar}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:14,
              padding:"14px 12px", borderRadius:12, marginBottom:4 }}>
            <div style={{ width:38, height:38, borderRadius:12, background:"rgba(245,158,11,.12)",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Star size={18} color="#F59E0B" fill={tx.is_starred ? "#F59E0B" : "none"} />
            </div>
            <span style={{ fontSize:14, fontWeight:600 }}>
              {tx.is_starred ? "Hapus dari Favorit" : "Tandai Favorit"}
            </span>
          </button>

          <button onClick={onDelete}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:14,
              padding:"14px 12px", borderRadius:12,
              background:"rgba(255,92,92,.08)" }}>
            <div style={{ width:38, height:38, borderRadius:12, background:"rgba(255,92,92,.15)",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Trash2 size={18} color="var(--expense)" />
            </div>
            <span style={{ fontSize:14, fontWeight:600, color:"var(--expense)" }}>Hapus Transaksi</span>
          </button>
        </div>

        <button onClick={onClose}
          style={{ margin:"4px 12px 8px", width:"calc(100% - 24px)", padding:"13px",
            borderRadius:14, border:"1px solid var(--border)", fontSize:14, fontWeight:700, color:"var(--sub)" }}>
          Batal
        </button>
      </div>
    </div>
  );
}

export function MonthNav({ month, setMonth }) {
  return (
    <div className="month-nav">
      <button onClick={() => setMonth(prevMonth(month))}
        style={{ width:32, height:32, borderRadius:8, display:"flex", alignItems:"center",
          justifyContent:"center", background:"var(--surface2)", color:"var(--sub)" }}>
        <ChevronLeft size={18} />
      </button>
      <p style={{ fontSize:15, fontWeight:700, minWidth:110, textAlign:"center" }}>{monthLabel(month)}</p>
      <button onClick={() => setMonth(nextMonth(month))}
        style={{ width:32, height:32, borderRadius:8, display:"flex", alignItems:"center",
          justifyContent:"center", background:"var(--surface2)", color:"var(--sub)" }}>
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

export function Empty({ icon, title, sub }) {
  return (
    <div style={{ textAlign:"center", padding:"48px 24px" }}>
      <p style={{ fontSize:48, marginBottom:12 }}>{icon}</p>
      <p style={{ fontSize:15, fontWeight:700, marginBottom:6 }}>{title}</p>
      <p style={{ fontSize:13, color:"var(--sub)", lineHeight:1.6 }}>{sub}</p>
    </div>
  );
}

export function SkelRows({ n = 4 }) {
  return Array.from({ length: n }).map((_, i) => (
    <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
      borderBottom:"1px solid var(--border)" }}>
      <div className="skeleton" style={{ width:36, height:36, borderRadius:10, flexShrink:0 }} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
        <div className="skeleton" style={{ height:12, width:"55%", borderRadius:6 }} />
        <div className="skeleton" style={{ height:10, width:"35%", borderRadius:6 }} />
      </div>
      <div className="skeleton" style={{ height:12, width:60, borderRadius:6 }} />
    </div>
  ));
}
