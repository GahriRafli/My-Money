"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, Plus, Trash2, X } from "lucide-react";
import { EXP_CATS } from "@/lib/constants";
import { fmt, monthKey } from "@/lib/utils";
import AmountInput from "@/components/AmountInput";
import { supabase } from "@/lib/supabase";
import { Empty, SkelRows } from "@/components/tabs/TxsTab";

export default function BudgetPage({ budgets, txs, loading, user, onBack, onRefresh }) {
  const [showAdd, setShowAdd] = useState(false);
  const m = monthKey(new Date());

  const stats = useMemo(() => budgets.map(b => {
    const spent = txs.filter(t => t.type==="expense" && t.category_id===b.category_id && t.date?.startsWith(m))
      .reduce((s,t) => s + Number(t.amount), 0);
    const pct = b.amount > 0 ? Math.min(100, Math.round(spent / b.amount * 100)) : 0;
    return { ...b, spent, pct };
  }), [budgets, txs]);

  async function deleteBudget(id) {
    if (!user) return;
    await supabase.from("budgets").delete().eq("id", id);
    onRefresh();
  }

  return (
    <div>
      <div className="topbar">
        <button className="page-back-btn" onClick={onBack}><ChevronLeft size={18} /></button>
        <p style={{ flex:1, fontSize:16, fontWeight:700 }}>Anggaran</p>
        <button style={{ color:"var(--accent)" }} onClick={() => setShowAdd(true)}><Plus size={22} /></button>
      </div>

      {/* Summary */}
      {stats.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, padding:"14px 16px" }}>
          <div className="card" style={{ padding:"14px 16px" }}>
            <p style={{ fontSize:11, color:"var(--sub)" }}>Total Anggaran</p>
            <p style={{ fontSize:15, fontWeight:800, marginTop:4, color:"var(--text)" }}>
              {fmt(stats.reduce((s,b) => s+b.amount, 0))}
            </p>
          </div>
          <div className="card" style={{ padding:"14px 16px" }}>
            <p style={{ fontSize:11, color:"var(--sub)" }}>Total Terpakai</p>
            <p style={{ fontSize:15, fontWeight:800, marginTop:4, color:"var(--expense)" }}>
              {fmt(stats.reduce((s,b) => s+b.spent, 0))}
            </p>
          </div>
        </div>
      )}

      <div style={{ padding:"0 16px 16px", display:"flex", flexDirection:"column", gap:10 }}>
        {loading && <SkelRows n={3} />}
        {!loading && stats.length === 0 && (
          <div className="card">
            <Empty icon="🎯" title="Belum ada anggaran" sub="Ketuk + untuk membuat anggaran bulanan." />
          </div>
        )}
        {stats.map(b => {
          const barColor = b.pct>=100 ? "var(--expense)" : b.pct>=80 ? "#F59E0B" : "var(--income)";
          const cat = EXP_CATS.find(c => c.id===b.category_id) || b.categories;
          return (
            <div key={b.id} className="card" style={{ padding:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                <div style={{ width:44, height:44, borderRadius:14, display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:22, flexShrink:0,
                  background:`${cat?.color||"#6366F1"}18` }}>
                  {cat?.icon || "🎯"}
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:14, fontWeight:700 }}>{b.name}</p>
                  <p style={{ fontSize:11, color:"var(--sub)", marginTop:2 }}>
                    {fmt(b.spent)} / {fmt(b.amount)}
                  </p>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:14, fontWeight:800, color:barColor }}>{b.pct}%</span>
                  <button onClick={() => deleteBudget(b.id)}
                    style={{ color:"var(--expense)", opacity:0.6, padding:4 }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width:`${b.pct}%`, background:barColor }} />
              </div>
              {b.pct >= 80 && (
                <p style={{ fontSize:11, color: b.pct>=100?"var(--expense)":"#F59E0B", marginTop:8 }}>
                  {b.pct>=100 ? "⚠️ Anggaran habis!" : `⚡ ${b.pct}% terpakai, mendekati batas`}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {showAdd && (
        <AddBudgetModal user={user} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); onRefresh(); }} />
      )}
    </div>
  );
}

function AddBudgetModal({ user, onClose, onSaved }) {
  const [name,   setName]   = useState("");
  const [catId,  setCatId]  = useState("");
  const [amount, setAmount] = useState("");
  const [busy,   setBusy]   = useState(false);
  const [err,    setErr]    = useState("");

  async function save(e) {
    e.preventDefault();
    if (!name || !amount) return;
    setBusy(true);
    if (user) {
      const { error } = await supabase.from("budgets").insert({
        user_id: user.id, name, category_id: catId || null,
        amount: parseFloat(amount), period:"monthly",
      });
      if (error) { setErr(error.message); setBusy(false); return; }
    }
    onSaved();
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 6px" }}>
          <div style={{ width:36, height:4, borderRadius:99, background:"var(--border)" }} />
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px 14px" }}>
          <h2 style={{ fontSize:17, fontWeight:800 }}>Tambah Anggaran</h2>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:10, background:"var(--surface2)",
            display:"flex", alignItems:"center", justifyContent:"center", color:"var(--sub)" }}>
            <X size={17} />
          </button>
        </div>
        <form onSubmit={save} style={{ padding:"0 16px 24px", display:"flex", flexDirection:"column", gap:16 }}>
          <div>
            <span className="field-label">Nama Anggaran</span>
            <div className="field-wrap">
              <input className="field-input" placeholder="cth: Makan bulan ini" required
                value={name} onChange={e => setName(e.target.value)} />
            </div>
          </div>
          <div>
            <span className="field-label">Kategori (opsional)</span>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
              {EXP_CATS.map(cat => (
                <button key={cat.id} type="button" className={`cat-btn${catId===cat.id?" selected":""}`}
                  onClick={() => setCatId(catId===cat.id?"":cat.id)}>
                  <span style={{ fontSize:22, lineHeight:1 }}>{cat.icon}</span>
                  <span style={{ fontSize:9, fontWeight:600, color:"var(--sub)", textAlign:"center" }}>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="field-label">Batas Anggaran</span>
            <div className="field-wrap">
              <span style={{ marginLeft:14, fontSize:13, fontWeight:700, color:"var(--sub)", flexShrink:0 }}>Rp</span>
              <AmountInput className="field-input" placeholder="0" required
                value={amount} onChange={setAmount} />
            </div>
          </div>
          {err && <p style={{ fontSize:13, color:"var(--expense)", background:"rgba(255,92,92,.1)", borderRadius:10, padding:"10px 14px" }}>{err}</p>}
          {!user && <p style={{ fontSize:12, color:"#F59E0B", background:"rgba(245,158,11,.1)", borderRadius:10, padding:"10px 14px" }}>⚠️ Login untuk menyimpan anggaran ke cloud.</p>}
          <button type="submit" disabled={busy || !name || !amount}
            style={{ height:52, borderRadius:14, fontWeight:800, fontSize:15, color:"#fff",
              background: (name&&amount) ? "var(--accent)" : "var(--surface2)",
              boxShadow: (name&&amount) ? "0 6px 20px rgba(255,109,78,.3)" : "none" }}>
            {busy ? "Menyimpan…" : "Simpan Anggaran"}
          </button>
        </form>
      </div>
    </div>
  );
}
