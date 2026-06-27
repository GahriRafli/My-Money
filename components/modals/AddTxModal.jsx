"use client";
import { useState } from "react";
import { Plus, Wallet, X } from "lucide-react";
import { EXP_CATS, INC_CATS } from "@/lib/constants";
import { fmt, toDay } from "@/lib/utils";
import AmountInput    from "@/components/AmountInput";
import DatePicker     from "@/components/DatePicker";
import CustomItemModal from "@/components/CustomItemModal";
import { useCustomStore } from "@/lib/useCustomStore";

export default function AddTxModal({ wallets, isGuest, onClose, onSave, initial = {} }) {
  const [type,       setType]       = useState(initial.type || "expense");
  const [amount,     setAmount]     = useState(initial.amount ? String(initial.amount) : "");
  const [catId,      setCatId]      = useState(initial.category_id || "");
  const [walletId,   setWalletId]   = useState(initial.wallet_id || wallets[0]?.id || "");
  const [toWalletId, setToWalletId] = useState(wallets[1]?.id || wallets[0]?.id || "");
  const [note,       setNote]       = useState(initial.note || "");
  const [date,       setDate]       = useState(initial.date || toDay());
  const [saving,     setSaving]     = useState(false);
  const [showNewCat, setShowNewCat] = useState(false);

  const { items: customExp, add: addCustomExp } = useCustomStore("mymoney-custom-cats-expense");
  const { items: customInc, add: addCustomInc } = useCustomStore("mymoney-custom-cats-income");

  const baseCats = type === "income" ? INC_CATS : EXP_CATS;
  const customCats = type === "income" ? customInc : customExp;
  const cats = [...baseCats, ...customCats];

  const canSave  = amount && (type === "transfer" ? (walletId !== toWalletId) : catId);
  const amtColor = type === "expense" ? "var(--expense)" : type === "income" ? "var(--income)" : "#F59E0B";

  async function save() {
    if (!canSave) return;
    setSaving(true);
    await onSave({
      type, amount: parseFloat(amount),
      category_id:  catId      || null,
      wallet_id:    walletId   || null,
      to_wallet_id: type === "transfer" ? toWalletId : null,
      note: note.trim() || null, date,
    });
    setSaving(false);
  }

  function handleAddCustomCat(cat) {
    if (type === "income") addCustomInc(cat);
    else addCustomExp(cat);
    setCatId(cat.id);
  }

  return (<>
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 6px" }}>
          <div style={{ width:36, height:4, borderRadius:99, background:"var(--border)" }} />
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px 14px" }}>
          <h2 style={{ fontSize:17, fontWeight:800 }}>{initial.id ? "Edit" : "Tambah"} Transaksi</h2>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:10, background:"var(--surface2)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--sub)" }}>
            <X size={17} />
          </button>
        </div>

        <div style={{ padding:"0 16px 20px", display:"flex", flexDirection:"column", gap:18 }}>
          {/* Type */}
          <div className="pill-toggle">
            {[["expense","Pengeluaran"],["income","Pemasukan"],["transfer","Transfer"]].map(([t,label]) => (
              <button key={t} className={`pill-btn${type===t?` active-${t}`:""}`}
                onClick={() => { setType(t); setCatId(""); }}>
                {label}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <span className="field-label">Jumlah</span>
            <div className="field-wrap">
              <span style={{ marginLeft:14, fontSize:13, fontWeight:700, color:"var(--sub)", flexShrink:0 }}>Rp</span>
              <AmountInput className="field-input" placeholder="0" autoFocus
                style={{ fontSize:22, fontWeight:800, color:amtColor }}
                value={amount} onChange={setAmount} />
            </div>
          </div>

          {/* Categories */}
          {type !== "transfer" && (
            <div>
              <span className="field-label">Kategori</span>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
                {cats.map(cat => (
                  <button key={cat.id} className={`cat-btn${catId===cat.id?" selected":""}`}
                    onClick={() => setCatId(cat.id)}>
                    <span style={{ fontSize:22, lineHeight:1 }}>{cat.icon}</span>
                    <span style={{ fontSize:9, fontWeight:600, color:"var(--sub)", textAlign:"center", lineHeight:1.2 }}>{cat.name}</span>
                  </button>
                ))}
                {/* Add custom category button */}
                <button onClick={() => setShowNewCat(true)}
                  className="cat-btn"
                  style={{ border:"2px dashed var(--border)", opacity:.7 }}>
                  <Plus size={20} style={{ color:"var(--sub)" }} />
                  <span style={{ fontSize:9, fontWeight:600, color:"var(--sub)", lineHeight:1.2 }}>Tambah</span>
                </button>
              </div>
            </div>
          )}

          {/* Wallet */}
          {wallets.length > 0 && (
            <div>
              <span className="field-label">{type === "transfer" ? "Dari Dompet" : "Dompet"}</span>
              <div className="field-wrap">
                <Wallet size={16} style={{ marginLeft:14, color:"var(--sub)", flexShrink:0 }} />
                <select className="field-input" style={{ fontSize:14 }} value={walletId} onChange={e => setWalletId(e.target.value)}>
                  {wallets.map(w => <option key={w.id} value={w.id}>{w.name} — {fmt(w.balance)}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* To Wallet (transfer only) */}
          {type === "transfer" && wallets.length > 0 && (
            <div>
              <span className="field-label">Ke Dompet</span>
              <div className="field-wrap">
                <Wallet size={16} style={{ marginLeft:14, color:"#F59E0B", flexShrink:0 }} />
                <select className="field-input" style={{ fontSize:14 }} value={toWalletId} onChange={e => setToWalletId(e.target.value)}>
                  {wallets.filter(w => w.id !== walletId).map(w => <option key={w.id} value={w.id}>{w.name} — {fmt(w.balance)}</option>)}
                </select>
              </div>
              {walletId === toWalletId && <p style={{ fontSize:11, color:"var(--expense)", marginTop:4 }}>Dompet asal dan tujuan tidak boleh sama.</p>}
            </div>
          )}

          {/* Note */}
          <div>
            <span className="field-label">Catatan</span>
            <div className="field-wrap">
              <input className="field-input" style={{ fontSize:14 }} placeholder="Keterangan (opsional)"
                value={note} onChange={e => setNote(e.target.value)} />
            </div>
          </div>

          {/* Date */}
          <div>
            <span className="field-label">Tanggal</span>
            <DatePicker value={date} onChange={setDate} />
          </div>

          {isGuest && (
            <p style={{ fontSize:12, background:"rgba(245,158,11,.12)", color:"#F59E0B", borderRadius:10, padding:"10px 14px" }}>
              ⚠️ Mode tamu — tidak tersimpan ke cloud.
            </p>
          )}

          <button onClick={save} disabled={saving || !canSave}
            style={{ height:52, borderRadius:14, fontWeight:800, fontSize:15, color:"#fff",
              background: canSave ? "var(--accent)" : "var(--surface2)",
              boxShadow: canSave ? "0 6px 20px rgba(255,109,78,.35)" : "none", transition:"all .2s" }}>
            {saving ? "Menyimpan…" : "Simpan Transaksi"}
          </button>
        </div>
      </div>
    </div>

    {showNewCat && (
      <CustomItemModal
        title={type === "income" ? "Kategori Pemasukan Baru" : "Kategori Pengeluaran Baru"}
        namePlaceholder="Nama kategori"
        onSave={handleAddCustomCat}
        onClose={() => setShowNewCat(false)}
      />
    )}
  </>);
}
