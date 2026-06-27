"use client";
import { useState } from "react";
import { ChevronLeft, Plus, Trash2, X } from "lucide-react";
import { fmt, toDay } from "@/lib/utils";
import AmountInput from "@/components/AmountInput";
import { supabase } from "@/lib/supabase";
import { Empty, SkelRows } from "@/components/tabs/TxsTab";

const GOAL_ICONS = ["🎯","🏖️","🚗","🏠","💍","✈️","📱","💻","🎓","👶","🐾","🏋️","🎸","🌱","💰"];

export default function GoalsPage({ goals, loading, user, onBack, onRefresh }) {
  const [showAdd, setShowAdd] = useState(false);
  const [addTo,   setAddTo]   = useState(null); // goal object for adding savings

  async function deleteGoal(id) {
    if (!user) return;
    await supabase.from("savings_goals").delete().eq("id", id);
    onRefresh();
  }

  async function addSaving(goal, amount) {
    if (!user) return;
    const newAmt = Number(goal.saved_amount) + Number(amount);
    const done   = newAmt >= Number(goal.target_amount);
    await supabase.from("savings_goals").update({
      saved_amount: newAmt, is_completed: done,
    }).eq("id", goal.id);
    onRefresh();
    setAddTo(null);
  }

  return (
    <div>
      <div className="topbar">
        <button className="page-back-btn" onClick={onBack}><ChevronLeft size={18} /></button>
        <p style={{ flex:1, fontSize:16, fontWeight:700 }}>Target Tabungan</p>
        <button style={{ color:"var(--accent)" }} onClick={() => setShowAdd(true)}><Plus size={22} /></button>
      </div>

      <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:12 }}>
        {loading && <SkelRows n={3} />}
        {!loading && goals.length === 0 && (
          <div className="card"><Empty icon="🏆" title="Belum ada target" sub="Ketuk + untuk membuat target tabungan." /></div>
        )}
        {goals.map(g => {
          const pct    = g.target_amount > 0 ? Math.min(100, Math.round(Number(g.saved_amount) / Number(g.target_amount) * 100)) : 0;
          const remain = Math.max(0, Number(g.target_amount) - Number(g.saved_amount));
          return (
            <div key={g.id} className="card" style={{ padding:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                <div style={{ width:48, height:48, borderRadius:16, display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:24, flexShrink:0,
                  background: g.is_completed ? "rgba(78,173,255,.15)" : "var(--surface2)" }}>
                  {g.icon || "🎯"}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <p style={{ fontSize:14, fontWeight:700, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{g.name}</p>
                    {g.is_completed && <span style={{ fontSize:10, fontWeight:700, background:"rgba(78,173,255,.15)", color:"var(--income)", padding:"2px 8px", borderRadius:99 }}>✓ Tercapai</span>}
                  </div>
                  {g.deadline && <p style={{ fontSize:11, color:"var(--sub)", marginTop:2 }}>Deadline: {g.deadline}</p>}
                </div>
                <button onClick={() => deleteGoal(g.id)} style={{ color:"var(--expense)", opacity:0.6, padding:4, flexShrink:0 }}>
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Progress */}
              <div className="progress-track" style={{ marginBottom:8 }}>
                <div className="progress-fill"
                  style={{ width:`${pct}%`, background: g.is_completed ? "var(--income)" : "var(--accent)" }} />
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                <span style={{ fontSize:12, fontWeight:600, color:"var(--income)" }}>{fmt(g.saved_amount)}</span>
                <span style={{ fontSize:12, fontWeight:700, color:"var(--sub)" }}>{pct}%</span>
                <span style={{ fontSize:12, fontWeight:600, color:"var(--sub)" }}>{fmt(g.target_amount)}</span>
              </div>

              {!g.is_completed && (
                <div style={{ display:"flex", gap:8 }}>
                  <div style={{ flex:1, background:"var(--surface2)", borderRadius:10, padding:"8px 12px" }}>
                    <p style={{ fontSize:10, color:"var(--sub)" }}>Sisa</p>
                    <p style={{ fontSize:12, fontWeight:700, color:"var(--expense)", marginTop:2 }}>{fmt(remain)}</p>
                  </div>
                  <button onClick={() => setAddTo(g)}
                    style={{ flex:1, background:"var(--accent)", color:"#fff", borderRadius:10,
                      fontSize:13, fontWeight:700, display:"flex", alignItems:"center",
                      justifyContent:"center", gap:6 }}>
                    <Plus size={16} /> Tambah
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showAdd && <AddGoalModal user={user} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); onRefresh(); }} />}
      {addTo   && <AddSavingModal goal={addTo} onClose={() => setAddTo(null)} onSave={addSaving} />}
    </div>
  );
}

function AddGoalModal({ user, onClose, onSaved }) {
  const [name,    setName]    = useState("");
  const [icon,    setIcon]    = useState("🎯");
  const [target,  setTarget]  = useState("");
  const [saved,   setSaved]   = useState("0");
  const [deadline,setDeadline]= useState("");
  const [busy,    setBusy]    = useState(false);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    if (user) {
      await supabase.from("savings_goals").insert({
        user_id: user.id, name, icon, target_amount: parseFloat(target),
        saved_amount: parseFloat(saved)||0, deadline: deadline||null,
      });
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
          <h2 style={{ fontSize:17, fontWeight:800 }}>Target Tabungan Baru</h2>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:10, background:"var(--surface2)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--sub)" }}><X size={17} /></button>
        </div>
        <form onSubmit={save} style={{ padding:"0 16px 24px", display:"flex", flexDirection:"column", gap:16 }}>
          <div>
            <span className="field-label">Pilih Ikon</span>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {GOAL_ICONS.map(ic => (
                <button key={ic} type="button" onClick={() => setIcon(ic)}
                  style={{ width:40, height:40, borderRadius:10, fontSize:20,
                    border:`2px solid ${icon===ic?"var(--accent)":"var(--border)"}`,
                    background: icon===ic?"rgba(99,102,241,.1)":"var(--surface2)" }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="field-label">Nama Target</span>
            <div className="field-wrap">
              <input className="field-input" placeholder="cth: Liburan ke Bali" required
                value={name} onChange={e => setName(e.target.value)} />
            </div>
          </div>
          <div>
            <span className="field-label">Target Dana</span>
            <div className="field-wrap">
              <span style={{ marginLeft:14, fontSize:13, fontWeight:700, color:"var(--sub)", flexShrink:0 }}>Rp</span>
              <AmountInput className="field-input" placeholder="0" required
                value={target} onChange={setTarget} />
            </div>
          </div>
          <div>
            <span className="field-label">Sudah Ditabung</span>
            <div className="field-wrap">
              <span style={{ marginLeft:14, fontSize:13, fontWeight:700, color:"var(--sub)", flexShrink:0 }}>Rp</span>
              <AmountInput className="field-input" placeholder="0"
                value={saved} onChange={setSaved} />
            </div>
          </div>
          <div>
            <span className="field-label">Deadline (opsional)</span>
            <div className="field-wrap">
              <input className="field-input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>
          </div>
          <button type="submit" disabled={busy || !name || !target}
            style={{ height:52, borderRadius:14, fontWeight:800, fontSize:15, color:"#fff",
              background: (name&&target) ? "var(--accent)" : "var(--surface2)",
              boxShadow: (name&&target) ? "0 6px 20px rgba(255,109,78,.3)" : "none" }}>
            {busy ? "Menyimpan…" : "Simpan Target"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AddSavingModal({ goal, onClose, onSave }) {
  const [amount, setAmount] = useState("");
  const [busy,   setBusy]   = useState(false);
  async function save(e) {
    e.preventDefault();
    if (!amount) return;
    setBusy(true);
    await onSave(goal, parseFloat(amount));
    setBusy(false);
  }
  return (
    <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 6px" }}>
          <div style={{ width:36, height:4, borderRadius:99, background:"var(--border)" }} />
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px 14px" }}>
          <h2 style={{ fontSize:17, fontWeight:800 }}>Tambah Tabungan</h2>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:10, background:"var(--surface2)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--sub)" }}><X size={17} /></button>
        </div>
        <form onSubmit={save} style={{ padding:"0 16px 24px", display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ textAlign:"center", padding:"10px 0" }}>
            <p style={{ fontSize:32 }}>{goal.icon}</p>
            <p style={{ fontSize:14, fontWeight:700, marginTop:8 }}>{goal.name}</p>
            <p style={{ fontSize:12, color:"var(--sub)", marginTop:4 }}>Sisa: {fmt(Math.max(0, Number(goal.target_amount)-Number(goal.saved_amount)))}</p>
          </div>
          <div>
            <span className="field-label">Jumlah Ditabung</span>
            <div className="field-wrap">
              <span style={{ marginLeft:14, fontSize:13, fontWeight:700, color:"var(--sub)", flexShrink:0 }}>Rp</span>
              <AmountInput className="field-input" placeholder="0" required autoFocus
                style={{ fontSize:20, fontWeight:800, color:"var(--income)" }}
                value={amount} onChange={setAmount} />
            </div>
          </div>
          <button type="submit" disabled={busy || !amount}
            style={{ height:52, borderRadius:14, fontWeight:800, fontSize:15, color:"#fff",
              background: amount ? "var(--income)" : "var(--surface2)",
              boxShadow: amount ? "0 6px 20px rgba(16,185,129,.3)" : "none" }}>
            {busy ? "Menyimpan…" : "Simpan Tabungan"}
          </button>
        </form>
      </div>
    </div>
  );
}
