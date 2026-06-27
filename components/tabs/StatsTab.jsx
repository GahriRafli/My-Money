"use client";
import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Star } from "lucide-react";
import { catOf, fmt, monthKey, monthLabel, nextMonth, prevMonth } from "@/lib/utils";
import { MONTHS } from "@/lib/constants";
import { MonthNav, Empty, SkelRows } from "./TxsTab";

const PIE_COLORS = ["#FF6B6B","#FF9F43","#FDCB6E","#55EFC4","#74B9FF","#A29BFE","#FD79A8","#00CEC9","#E17055","#6C5CE7","#00B894","#0984E3"];

export default function StatsTab({ txs, budgets = [], month, setMonth, loading }) {
  const [subtab,    setSubtab]  = useState("stats");
  const [view,      setView]    = useState("expense");
  const [chartType, setChart]   = useState("pie");

  const monthTxs = useMemo(() =>
    txs.filter(t => t.date?.startsWith(monthKey(month))), [txs, month]);

  const inc = monthTxs.filter(t=>t.type==="income").reduce((s,t)=>s+Number(t.amount),0);
  const exp = monthTxs.filter(t=>t.type==="expense").reduce((s,t)=>s+Number(t.amount),0);

  const catData = useMemo(() => {
    const filtered = monthTxs.filter(t => t.type === view);
    const total    = filtered.reduce((s,t) => s + Number(t.amount), 0);
    const map = {};
    filtered.forEach(tx => {
      const cat = catOf(tx);
      if (!map[cat.name]) map[cat.name] = { name:cat.name, icon:cat.icon, color:cat.color, value:0 };
      map[cat.name].value += Number(tx.amount);
    });
    return Object.values(map).sort((a,b)=>b.value-a.value)
      .map((d,i) => ({ ...d, color: d.color || PIE_COLORS[i%PIE_COLORS.length],
        pct: total>0 ? Math.round(d.value/total*100) : 0 }));
  }, [monthTxs, view]);

  const barData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(month);
      d.setMonth(d.getMonth() - (5-i));
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      const mTxs = txs.filter(t => t.date?.startsWith(key));
      return {
        name: MONTHS[d.getMonth()].slice(0,3),
        income:  mTxs.filter(t=>t.type==="income").reduce((s,t)=>s+Number(t.amount),0),
        expense: mTxs.filter(t=>t.type==="expense").reduce((s,t)=>s+Number(t.amount),0),
      };
    });
  }, [txs, month]);

  const total = view === "expense" ? exp : inc;

  // Budget data for current month
  const mk = monthKey(month);
  const budgetStats = useMemo(() => budgets.map(b => {
    const spent = monthTxs.filter(t => t.type==="expense" && t.category_id===b.category_id)
      .reduce((s,t) => s + Number(t.amount), 0);
    const pct = b.amount > 0 ? Math.min(100, Math.round(spent/b.amount*100)) : 0;
    const cat  = catOf({ category_id: b.category_id, type:"expense", categories: b.categories });
    return { ...b, spent, pct, cat };
  }), [budgets, monthTxs]);

  // Starred transactions
  const starred = useMemo(() => txs.filter(t=>t.is_starred), [txs]);

  return (
    <div>
      {/* Topbar with sub-tabs */}
      <div className="topbar" style={{ padding:"0 14px", gap:0 }}>
        {[["stats","Stats"],["budget","Budget"],["note","Catatan"]].map(([id,label]) => (
          <button key={id} onClick={() => setSubtab(id)}
            style={{ padding:"0 16px", height:"100%", fontSize:14,
              fontWeight: subtab===id ? 700 : 600,
              color: subtab===id ? "var(--accent)" : "var(--sub)",
              borderBottom: subtab===id ? "2px solid var(--accent)" : "2px solid transparent",
              transition:"all .15s" }}>
            {label}
          </button>
        ))}
        <div style={{ flex:1 }} />
        {subtab === "stats" && (
          <div style={{ display:"flex", gap:4 }}>
            {[["pie","🥧"],["bar","📊"]].map(([id,emoji]) => (
              <button key={id} onClick={() => setChart(id)}
                style={{ width:32, height:32, borderRadius:8, fontSize:16,
                  background: chartType===id ? "var(--surface2)" : "transparent",
                  border: chartType===id ? "1px solid var(--border)" : "none" }}>
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      <MonthNav month={month} setMonth={setMonth} />

      {/* ── STATS SUB-TAB ──────────────────────────────────── */}
      {subtab === "stats" && (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", borderBottom:"1px solid var(--border)" }}>
            {[["income","Income",inc],["expense","Exp.",exp]].map(([id,label,val]) => (
              <button key={id} onClick={() => setView(id)}
                style={{ padding:"10px 14px", textAlign: id==="income"?"left":"right",
                  borderBottom:`2px solid ${view===id?(id==="income"?"var(--income)":"var(--expense)"):"transparent"}` }}>
                <p style={{ fontSize:11, color:"var(--sub)", marginBottom:3 }}>{label}</p>
                <p style={{ fontSize:14, fontWeight:700, color: id==="income"?"var(--income)":"var(--expense)" }}>{fmt(val)}</p>
              </button>
            ))}
          </div>

          {loading && <SkelRows n={4} />}
          {!loading && catData.length === 0 && <Empty icon="📊" title="Tidak ada data" sub="Catat transaksi untuk melihat statistik." />}

          {!loading && catData.length > 0 && (
            <>
              {chartType === "pie" ? (
                <div style={{ padding:"16px 14px 0", display:"flex", justifyContent:"center" }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={catData} cx="50%" cy="50%" outerRadius={90} innerRadius={45}
                        dataKey="value" paddingAngle={2} stroke="none">
                        {catData.map((entry,i) => <Cell key={i} fill={entry.color || PIE_COLORS[i%PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={val=>[fmt(val),""]}
                        contentStyle={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, color:"var(--text)", fontSize:12 }}
                        itemStyle={{ color:"var(--text)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ padding:"16px 14px 0" }}>
                  <p style={{ fontSize:11, color:"var(--sub)", marginBottom:10, fontWeight:600 }}>6 Bulan Terakhir</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={barData} barSize={10} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill:"var(--sub)", fontSize:10 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip formatter={val=>[fmt(val),""]}
                        contentStyle={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, color:"var(--text)", fontSize:11 }} />
                      <Bar dataKey="income"  fill="var(--income)"  radius={[4,4,0,0]} />
                      <Bar dataKey="expense" fill="var(--expense)" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ display:"flex", justifyContent:"center", gap:16, marginTop:8 }}>
                    <span style={{ fontSize:11, color:"var(--income)" }}>● Income</span>
                    <span style={{ fontSize:11, color:"var(--expense)" }}>● Expense</span>
                  </div>
                </div>
              )}

              <div style={{ marginTop:8, paddingBottom:8 }}>
                {catData.map((cat,i) => (
                  <div key={cat.name} style={{ display:"flex", alignItems:"center", gap:12,
                    padding:"11px 16px", borderBottom:"1px solid var(--border)" }}>
                    <div style={{ width:40, height:24, borderRadius:6, display:"flex", alignItems:"center",
                      justifyContent:"center", fontSize:11, fontWeight:800, flexShrink:0,
                      background: cat.color || PIE_COLORS[i%PIE_COLORS.length], color:"#fff" }}>
                      {cat.pct}%
                    </div>
                    <span style={{ fontSize:18, flexShrink:0 }}>{cat.icon}</span>
                    <p style={{ flex:1, fontSize:14, fontWeight:600 }}>{cat.name}</p>
                    <p style={{ fontSize:14, fontWeight:700, flexShrink:0 }}>{fmt(cat.value)}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ── BUDGET SUB-TAB ─────────────────────────────────── */}
      {subtab === "budget" && (
        <div style={{ paddingBottom:80 }}>
          {/* Month summary */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", padding:"14px 16px",
            borderBottom:"1px solid var(--border)", background:"var(--surface)" }}>
            <div>
              <p style={{ fontSize:10, color:"var(--sub)", marginBottom:3 }}>Total Budget</p>
              <p style={{ fontSize:13, fontWeight:700 }}>{fmt(budgetStats.reduce((s,b)=>s+b.amount,0))}</p>
            </div>
            <div style={{ textAlign:"center" }}>
              <p style={{ fontSize:10, color:"var(--sub)", marginBottom:3 }}>Terpakai</p>
              <p style={{ fontSize:13, fontWeight:700, color:"var(--expense)" }}>{fmt(budgetStats.reduce((s,b)=>s+b.spent,0))}</p>
            </div>
            <div style={{ textAlign:"right" }}>
              <p style={{ fontSize:10, color:"var(--sub)", marginBottom:3 }}>Sisa</p>
              <p style={{ fontSize:13, fontWeight:700, color:"var(--income)" }}>
                {fmt(Math.max(0, budgetStats.reduce((s,b)=>s+b.amount-b.spent,0)))}
              </p>
            </div>
          </div>

          {loading && <SkelRows n={3} />}
          {!loading && budgetStats.length === 0 && (
            <Empty icon="🎯" title="Belum ada budget" sub="Buat budget di menu More → Budget." />
          )}

          {budgetStats.map(b => {
            const over = b.pct >= 100;
            const warn = b.pct >= 80 && !over;
            const barColor = over ? "var(--expense)" : warn ? "#F59E0B" : "var(--income)";
            return (
              <div key={b.id} style={{ padding:"14px 16px", borderBottom:"1px solid var(--border)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <span style={{ fontSize:22, flexShrink:0 }}>{b.cat?.icon || "📦"}</span>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:14, fontWeight:700 }}>{b.cat?.name || b.category_id}</p>
                    <p style={{ fontSize:11, color:"var(--sub)", marginTop:2 }}>
                      {fmt(b.spent)} / {fmt(b.amount)}
                    </p>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <p style={{ fontSize:15, fontWeight:800, color:barColor }}>{b.pct}%</p>
                    {over && <p style={{ fontSize:10, color:"var(--expense)", fontWeight:700 }}>Melebihi!</p>}
                  </div>
                </div>
                <div style={{ height:8, background:"var(--surface2)", borderRadius:99, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${b.pct}%`, borderRadius:99, background:barColor, transition:"width .4s" }} />
                </div>
                <p style={{ fontSize:11, color:"var(--sub)", marginTop:6 }}>
                  Sisa: <b style={{ color: over?"var(--expense)":"var(--income)" }}>{fmt(Math.max(0,b.amount-b.spent))}</b>
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── NOTE / FAVORIT SUB-TAB ─────────────────────────── */}
      {subtab === "note" && (
        <div style={{ paddingBottom:80 }}>
          <div style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)",
            display:"flex", alignItems:"center", gap:8 }}>
            <Star size={14} color="#F59E0B" fill="#F59E0B" />
            <p style={{ fontSize:13, fontWeight:700 }}>{starred.length} Transaksi Favorit</p>
          </div>

          {starred.length === 0 && (
            <Empty icon="⭐" title="Belum ada favorit" sub="Tap ⭐ pada transaksi untuk menandainya sebagai favorit." />
          )}

          {starred.map(tx => {
            const cat = catOf(tx);
            const isExp = tx.type === "expense";
            const isInc = tx.type === "income";
            return (
              <div key={tx.id} style={{ display:"flex", alignItems:"center", gap:12,
                padding:"13px 16px", borderBottom:"1px solid var(--border)" }}>
                <div style={{ width:38, height:38, borderRadius:10, display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:20, flexShrink:0, background:`${cat.color}18` }}>
                  {cat.icon}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <p style={{ fontSize:13, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {tx.note || cat.name}
                    </p>
                    <Star size={11} fill="#F59E0B" color="#F59E0B" />
                  </div>
                  <p style={{ fontSize:11, color:"var(--sub)", marginTop:2 }}>
                    {cat.name} · {tx.date}
                  </p>
                </div>
                <p style={{ fontSize:13, fontWeight:700, flexShrink:0,
                  color: isExp?"var(--expense)":isInc?"var(--income)":"#F59E0B" }}>
                  {isExp?"-":isInc?"+":""}{fmt(tx.amount)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
