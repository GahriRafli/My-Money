"use client";
import { useMemo, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Trash2, X } from "lucide-react";
import { WALLET_TYPES } from "@/lib/constants";
import { fmt, toDay } from "@/lib/utils";
import AmountInput from "@/components/AmountInput";
import ConfirmModal from "@/components/ConfirmModal";
import CustomItemModal from "@/components/CustomItemModal";
import { useCustomStore } from "@/lib/useCustomStore";
import { supabase } from "@/lib/supabase";
import { Empty, SkelRows } from "./TxsTab";

export default function AccountsTab({ wallets, loading, user, workspace, onRefresh }) {
  const [hideAmt,  setHideAmt]  = useState(false);
  const [showAdd,  setShowAdd]  = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [selected, setSelected] = useState(null);
  const [delTarget,setDelTarget]= useState(null); // wallet to confirm-delete

  const grouped = useMemo(() => {
    const map = {};
    wallets.forEach(w => { (map[w.type || "cash"] ||= []).push(w); });
    return Object.entries(map);
  }, [wallets]);

  const assets = wallets.filter(w => Number(w.balance||0) >= 0).reduce((s,w)=>s+Number(w.balance||0),0);
  const liab   = wallets.filter(w => Number(w.balance||0) < 0).reduce((s,w)=>s+Number(w.balance||0),0);
  const M = hideAmt ? "••••••" : null;

  async function confirmDelete() {
    if (!delTarget || !user) return;
    const { error } = await supabase.from("wallets").delete().eq("id", delTarget.id);
    if (!error) onRefresh();
    setDelTarget(null);
  }

  return (
    <div>
      <div className="topbar">
        <p style={{ flex:1, fontSize:16, fontWeight:700 }}>Accounts</p>
        <button style={{ color:"var(--sub)" }} onClick={() => setHideAmt(!hideAmt)}>
          {hideAmt ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
        <button style={{ color:"var(--accent)" }} onClick={() => setShowAdd(true)}>
          <Plus size={22} />
        </button>
      </div>

      {/* Summary */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", padding:"14px 16px",
        background:"var(--surface)", borderBottom:"1px solid var(--border)" }}>
        <div>
          <p style={{ fontSize:10, color:"var(--sub)", marginBottom:4 }}>Assets</p>
          <p style={{ fontSize:13, fontWeight:800, color:"var(--income)" }}>{M || fmt(assets)}</p>
        </div>
        <div style={{ textAlign:"center" }}>
          <p style={{ fontSize:10, color:"var(--sub)", marginBottom:4 }}>Liabilities</p>
          <p style={{ fontSize:13, fontWeight:800, color: liab<0 ? "var(--expense)" : "var(--sub)" }}>
            {M || (liab < 0 ? fmt(liab) : "Rp 0")}
          </p>
        </div>
        <div style={{ textAlign:"right" }}>
          <p style={{ fontSize:10, color:"var(--sub)", marginBottom:4 }}>Total</p>
          <p style={{ fontSize:13, fontWeight:800 }}>{M || fmt(assets + liab)}</p>
        </div>
      </div>

      {loading && <SkelRows n={4} />}
      {!loading && wallets.length === 0 && (
        <div style={{ padding:"0 16px" }}>
          <Empty icon="🏦" title="Belum ada dompet" sub='Ketuk "+" untuk tambah dompet.' />
        </div>
      )}

      {grouped.map(([type, list]) => {
        const info = WALLET_TYPES[type] || { label: type, icon: "💳" };
        const groupTotal = list.reduce((s,w) => s + Number(w.balance||0), 0);
        return (
          <div key={type}>
            <div style={{ display:"flex", justifyContent:"space-between", padding:"12px 16px 6px",
              borderBottom:"1px solid var(--border)" }}>
              <p style={{ fontSize:13, color:"var(--sub)", fontWeight:600 }}>{info.label}</p>
              <p style={{ fontSize:13, fontWeight:700, color: groupTotal < 0 ? "var(--expense)" : "var(--income)" }}>
                {M || fmt(groupTotal)}
              </p>
            </div>
            {list.map(w => (
              <button key={w.id} onClick={() => setSelected(w)}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:10,
                  padding:"13px 16px 13px 28px", borderBottom:"1px solid var(--border)", textAlign:"left" }}>
                <span style={{ fontSize:20, flexShrink:0 }}>{w.icon || info.icon}</span>
                <p style={{ fontSize:14, fontWeight:600, flex:1 }}>{w.name}</p>
                <p style={{ fontSize:14, fontWeight:700,
                  color: Number(w.balance)>=0 ? "var(--income)" : "var(--expense)" }}>
                  {M || fmt(w.balance)}
                </p>
              </button>
            ))}
          </div>
        );
      })}

      {/* Action sheet */}
      {selected && (
        <WalletActionSheet wallet={selected} hideAmt={hideAmt}
          onClose={() => setSelected(null)}
          onEdit={() => { setEditing(selected); setSelected(null); }}
          onDelete={() => { setDelTarget(selected); setSelected(null); }}
        />
      )}

      {/* Confirm delete modal */}
      {delTarget && (
        <ConfirmModal
          icon="🗑️"
          title={`Hapus "${delTarget.name}"?`}
          body="Dompet akan dihapus permanen. Transaksi yang terkait tidak ikut terhapus."
          confirmLabel="Ya, Hapus"
          onConfirm={confirmDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}

      {showAdd && <WalletModal user={user} workspace={workspace} onClose={() => setShowAdd(false)} onSaved={onRefresh} />}
      {editing  && <WalletModal user={user} workspace={workspace} initial={editing} onClose={() => setEditing(null)} onSaved={onRefresh} />}
    </div>
  );
}

function WalletActionSheet({ wallet, hideAmt, onClose, onEdit, onDelete }) {
  const info = WALLET_TYPES[wallet.type] || { label: wallet.type, icon: "💳" };
  return (
    <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal-sheet" style={{ paddingBottom:"env(safe-area-inset-bottom,16px)" }}>
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 8px" }}>
          <div style={{ width:36, height:4, borderRadius:99, background:"var(--border)" }} />
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"4px 16px 16px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ width:48, height:48, borderRadius:16, background:"var(--surface2)",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>
            {wallet.icon || info.icon}
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:15, fontWeight:700 }}>{wallet.name}</p>
            <p style={{ fontSize:12, color:"var(--sub)", marginTop:2 }}>{info.label}</p>
          </div>
          <p style={{ fontSize:16, fontWeight:800, color: Number(wallet.balance)>=0?"var(--income)":"var(--expense)" }}>
            {hideAmt ? "••••••" : fmt(wallet.balance)}
          </p>
        </div>
        <div style={{ padding:"8px 12px" }}>
          <button onClick={onEdit} style={{ width:"100%", display:"flex", alignItems:"center", gap:14,
            padding:"14px 12px", borderRadius:12, marginBottom:4 }}>
            <div style={{ width:38, height:38, borderRadius:12, background:"rgba(99,102,241,.12)",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Pencil size={18} color="var(--accent)" />
            </div>
            <span style={{ fontSize:14, fontWeight:600 }}>Edit Dompet</span>
          </button>
          <button onClick={onDelete} style={{ width:"100%", display:"flex", alignItems:"center", gap:14,
            padding:"14px 12px", borderRadius:12, background:"rgba(255,92,92,.08)" }}>
            <div style={{ width:38, height:38, borderRadius:12, background:"rgba(255,92,92,.15)",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Trash2 size={18} color="var(--expense)" />
            </div>
            <span style={{ fontSize:14, fontWeight:600, color:"var(--expense)" }}>Hapus Dompet</span>
          </button>
        </div>
        <button onClick={onClose} style={{ margin:"4px 12px 8px", width:"calc(100% - 24px)", padding:"13px",
          borderRadius:14, border:"1px solid var(--border)", fontSize:14, fontWeight:700, color:"var(--sub)" }}>
          Batal
        </button>
      </div>
    </div>
  );
}

function WalletModal({ user, workspace, initial, onClose, onSaved }) {
  const isEdit = !!initial?.id;
  const [name,       setName]       = useState(initial?.name    || "");
  const [type,       setType]       = useState(initial?.type    || "cash");
  const [balance,    setBalance]    = useState(initial?.balance != null ? String(Math.abs(Number(initial.balance))) : "0");
  const [busy,       setBusy]       = useState(false);
  const [err,        setErr]        = useState("");
  const [showNewType,setShowNewType]= useState(false);
  const { items: customTypes, add: addType } = useCustomStore("mymoney-custom-wallet-types");

  const allTypes = [
    ...Object.entries(WALLET_TYPES).map(([id, info]) => ({ id, ...info })),
    ...customTypes,
  ];

  async function save(e) {
    e.preventDefault();
    if (!name) return;
    setBusy(true); setErr("");

    const newBalance = parseFloat(balance) || 0;

    if (isEdit) {
      const oldBalance = Number(initial.balance) || 0;
      const diff = newBalance - oldBalance;

      const typeInfo = allTypes.find(t => t.id === type);
      const { error: wErr } = await supabase.from("wallets")
        .update({ name, type, icon: typeInfo?.icon || "💳" })
        .eq("id", initial.id);
      if (wErr) { setErr(wErr.message); setBusy(false); return; }

      // If balance changed, insert adjustment transaction (bypasses trigger)
      if (diff !== 0 && user) {
        await supabase.from("transactions").insert({
          user_id:     user.id,
          wallet_id:   initial.id,
          type:        diff > 0 ? "income" : "expense",
          amount:      Math.abs(diff),
          category_id: "adjustment",
          note:        "Penyesuaian saldo",
          date:        toDay(),
        });
      }
    } else {
      if (!user) { onClose(); return; }
      const typeInfo = allTypes.find(t => t.id === type);
      const walletPayload = {
        user_id: user.id, name, type,
        icon: typeInfo?.icon || "💳",
        balance: newBalance, is_default: false,
      };
      if (workspace?.id) walletPayload.household_id = workspace.id;
      const { error } = await supabase.from("wallets").insert(walletPayload);
      if (error) { setErr(error.message); setBusy(false); return; }
    }

    onSaved?.();
    onClose();
  }

  const oldBalance = Number(initial?.balance) || 0;
  const newBalance = parseFloat(balance) || 0;
  const diff = isEdit ? newBalance - oldBalance : 0;

  return (<>
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 6px" }}>
          <div style={{ width:36, height:4, borderRadius:99, background:"var(--border)" }} />
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px 14px" }}>
          <h2 style={{ fontSize:17, fontWeight:800 }}>{isEdit ? "Edit Dompet" : "Tambah Dompet"}</h2>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:10, background:"var(--surface2)",
            display:"flex", alignItems:"center", justifyContent:"center", color:"var(--sub)" }}>
            <X size={17} />
          </button>
        </div>
        <form onSubmit={save} style={{ padding:"0 16px 24px", display:"flex", flexDirection:"column", gap:16 }}>
          <div>
            <span className="field-label">Nama Dompet</span>
            <div className="field-wrap">
              <input className="field-input" placeholder="cth: BCA, Cash, GoPay" required
                value={name} onChange={e => setName(e.target.value)} />
            </div>
          </div>
          <div>
            <span className="field-label">Tipe</span>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {allTypes.map(t => (
                <button key={t.id} type="button" onClick={() => setType(t.id)}
                  style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 12px", borderRadius:10,
                    border:`2px solid ${type===t.id?"var(--accent)":"var(--border)"}`,
                    background: type===t.id ? "rgba(99,102,241,.1)" : "var(--surface2)", fontSize:13, fontWeight:600 }}>
                  <span>{t.icon}</span> {t.label || t.name}
                </button>
              ))}
              <button type="button" onClick={() => setShowNewType(true)}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 12px", borderRadius:10,
                  border:"2px dashed var(--border)", color:"var(--sub)", fontSize:13, fontWeight:600 }}>
                <Plus size={15} /> Tipe Baru
              </button>
            </div>
          </div>
          <div>
            <span className="field-label">{isEdit ? "Saldo Saat Ini" : "Saldo Awal"}</span>
            <div className="field-wrap">
              <span style={{ marginLeft:14, fontSize:13, fontWeight:700, color:"var(--sub)", flexShrink:0 }}>Rp</span>
              <AmountInput className="field-input" placeholder="0" value={balance} onChange={setBalance} />
            </div>
            {/* Show diff info when editing */}
            {isEdit && diff !== 0 && (
              <div style={{ marginTop:8, padding:"10px 14px", borderRadius:12,
                background: diff>0 ? "rgba(16,185,129,.1)" : "rgba(255,92,92,.1)",
                border: `1px solid ${diff>0?"rgba(16,185,129,.25)":"rgba(255,92,92,.25)"}`,
                display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:16 }}>{diff>0?"📈":"📉"}</span>
                <div>
                  <p style={{ fontSize:12, fontWeight:700, color: diff>0?"var(--income)":"var(--expense)" }}>
                    {diff>0?"Penambahan":"Pengurangan"} {fmt(Math.abs(diff))}
                  </p>
                  <p style={{ fontSize:11, color:"var(--sub)", marginTop:2 }}>
                    Akan dicatat sebagai transaksi penyesuaian otomatis
                  </p>
                </div>
              </div>
            )}
          </div>
          {err && <p style={{ fontSize:13, color:"var(--expense)", background:"rgba(255,92,92,.1)", borderRadius:10, padding:"10px 14px" }}>{err}</p>}
          <button type="submit" disabled={busy || !name}
            style={{ height:52, borderRadius:14, fontWeight:800, fontSize:15, color:"#fff",
              background: name ? "var(--accent)" : "var(--surface2)",
              boxShadow: name ? "0 6px 20px rgba(255,109,78,.3)" : "none" }}>
            {busy ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Simpan Dompet"}
          </button>
        </form>
      </div>
    </div>

    {showNewType && (
      <CustomItemModal
        title="Tipe Dompet Baru"
        namePlaceholder="Nama tipe (cth: E-Wallet)"
        onSave={t => { addType(t); setType(t.id); }}
        onClose={() => setShowNewType(false)}
      />
    )}
  </>);
}
