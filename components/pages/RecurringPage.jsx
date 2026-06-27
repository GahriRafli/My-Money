"use client";
import { useState } from "react";
import { ChevronLeft, Plus, Trash2, X } from "lucide-react";
import { EXP_CATS, INC_CATS, FREQ_OPTS } from "@/lib/constants";
import { catOf, fmt, toDay } from "@/lib/utils";
import AmountInput from "@/components/AmountInput";
import { supabase } from "@/lib/supabase";
import { Empty, SkelRows } from "@/components/tabs/TxsTab";

export default function RecurringPage({ recurring, wallets, loading, user, onBack, onRefresh }) {
  const [showAdd, setShowAdd] = useState(false);

  async function toggle(rule) {
    if (!user) return;
    await supabase.from("recurring_rules").update({ is_active: !rule.is_active }).eq("id", rule.id);
    onRefresh();
  }

  async function deleteRule(id) {
    if (!user) return;
    await supabase.from("recurring_rules").delete().eq("id", id);
    onRefresh();
  }

  const active   = recurring.filter(r => r.is_active);
  const inactive = recurring.filter(r => !r.is_active);

  return (
    <div>
      <div className="topbar">
        <button className="page-back-btn" onClick={onBack}><ChevronLeft size={18} /></button>
        <p style={{ flex:1, fontSize:16, fontWeight:700 }}>Transaksi Berulang</p>
        <button style={{ color:"var(--accent)" }} onClick={() => setShowAdd(true)}><Plus size={22} /></button>
      </div>

      <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:12 }}>
        {loading && <SkelRows n={3} />}
        {!loading && recurring.length === 0 && (
          <div className="card"><Empty icon="🔁" title="Belum ada transaksi berulang" sub="Ketuk + untuk menambah." /></div>
        )}

        {active.length > 0 && (
          <>
            <p style={{ fontSize:11, fontWeight:700, color:"var(--sub)", textTransform:"uppercase", letterSpacing:"0.08em" }}>Aktif</p>
            {active.map(r => <RuleCard key={r.id} rule={r} onToggle={toggle} onDelete={deleteRule} />)}
          </>
        )}
        {inactive.length > 0 && (
          <>
            <p style={{ fontSize:11, fontWeight:700, color:"var(--sub)", textTransform:"uppercase", letterSpacing:"0.08em", marginTop:8 }}>Nonaktif</p>
            {inactive.map(r => <RuleCard key={r.id} rule={r} onToggle={toggle} onDelete={deleteRule} />)}
          </>
        )}
      </div>

      {showAdd && <AddRecurringModal user={user} wallets={wallets} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); onRefresh(); }} />}
    </div>
  );
}

function RuleCard({ rule, onToggle, onDelete }) {
  const cat   = catOf(rule);
  const freq  = FREQ_OPTS.find(f => f.id === rule.frequency) || { label: rule.frequency };
  const color = rule.type === "income" ? "var(--income)" : rule.type === "expense" ? "var(--expense)" : "#F59E0B";
  return (
    <div className="card" style={{ padding:"14px 16px", opacity: rule.is_active ? 1 : 0.55 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:44, height:44, borderRadius:14, display:"flex", alignItems:"center",
          justifyContent:"center", fontSize:22, flexShrink:0, background:`${cat.color}18` }}>
          {cat.icon}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:14, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {rule.note || cat.name}
          </p>
          <p style={{ fontSize:11, color:"var(--sub)", marginTop:2 }}>
            {freq.label} · Berikutnya: {rule.next_due || "-"}
          </p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8 }}>
          <p style={{ fontSize:14, fontWeight:800, color }}>{fmt(rule.amount)}</p>
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={() => onToggle(rule)}
              style={{ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:8,
                background: rule.is_active ? "rgba(78,173,255,.15)" : "rgba(140,140,160,.15)",
                color: rule.is_active ? "var(--income)" : "var(--sub)" }}>
              {rule.is_active ? "Aktif" : "Nonaktif"}
            </button>
            <button onClick={() => onDelete(rule.id)} style={{ color:"var(--expense)", opacity:0.6, padding:4 }}>
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddRecurringModal({ user, wallets, onClose, onSaved }) {
  const [type,    setType]    = useState("expense");
  const [catId,   setCatId]   = useState("");
  const [amount,  setAmount]  = useState("");
  const [note,    setNote]    = useState("");
  const [freq,    setFreq]    = useState("monthly");
  const [start,   setStart]   = useState(toDay());
  const [walletId,setWalletId]= useState(wallets[0]?.id || "");
  const [busy,    setBusy]    = useState(false);

  const cats = type === "income" ? INC_CATS : EXP_CATS;

  async function save(e) {
    e.preventDefault();
    if (!amount || !catId) return;
    setBusy(true);
    if (user) {
      await supabase.from("recurring_rules").insert({
        user_id: user.id, type, category_id: catId, amount: parseFloat(amount),
        note: note||null, frequency: freq, start_date: start, next_due: start,
        wallet_id: walletId||null, is_active: true,
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
          <h2 style={{ fontSize:17, fontWeight:800 }}>Tambah Berulang</h2>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:10, background:"var(--surface2)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--sub)" }}><X size={17} /></button>
        </div>
        <form onSubmit={save} style={{ padding:"0 16px 24px", display:"flex", flexDirection:"column", gap:16 }}>
          <div className="pill-toggle">
            {[["expense","Pengeluaran"],["income","Pemasukan"]].map(([t,label]) => (
              <button key={t} type="button" className={`pill-btn${type===t?` active-${t}`:""}`}
                onClick={() => { setType(t); setCatId(""); }}>
                {label}
              </button>
            ))}
          </div>
          <div>
            <span className="field-label">Jumlah</span>
            <div className="field-wrap">
              <span style={{ marginLeft:14, fontSize:13, fontWeight:700, color:"var(--sub)", flexShrink:0 }}>Rp</span>
              <AmountInput className="field-input" placeholder="0" required
                style={{ fontSize:20, fontWeight:800 }}
                value={amount} onChange={setAmount} />
            </div>
          </div>
          <div>
            <span className="field-label">Kategori</span>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
              {cats.map(cat => (
                <button key={cat.id} type="button" className={`cat-btn${catId===cat.id?" selected":""}`}
                  onClick={() => setCatId(cat.id)}>
                  <span style={{ fontSize:22, lineHeight:1 }}>{cat.icon}</span>
                  <span style={{ fontSize:9, fontWeight:600, color:"var(--sub)", textAlign:"center" }}>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="field-label">Frekuensi</span>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {FREQ_OPTS.map(f => (
                <button key={f.id} type="button" onClick={() => setFreq(f.id)}
                  style={{ padding:"8px 14px", borderRadius:10, fontSize:13, fontWeight:600,
                    border:`2px solid ${freq===f.id?"var(--accent)":"var(--border)"}`,
                    background: freq===f.id?"rgba(99,102,241,.1)":"var(--surface2)" }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="field-label">Catatan</span>
            <div className="field-wrap">
              <input className="field-input" placeholder="Keterangan (opsional)"
                value={note} onChange={e => setNote(e.target.value)} />
            </div>
          </div>
          <div>
            <span className="field-label">Mulai Tanggal</span>
            <div className="field-wrap">
              <input className="field-input" type="date" value={start} onChange={e => setStart(e.target.value)} />
            </div>
          </div>
          <button type="submit" disabled={busy || !amount || !catId}
            style={{ height:52, borderRadius:14, fontWeight:800, fontSize:15, color:"#fff",
              background: (amount&&catId) ? "var(--accent)" : "var(--surface2)",
              boxShadow: (amount&&catId) ? "0 6px 20px rgba(255,109,78,.3)" : "none" }}>
            {busy ? "Menyimpan…" : "Simpan"}
          </button>
        </form>
      </div>
    </div>
  );
}
