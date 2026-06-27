"use client";

export default function ConfirmModal({ icon = "⚠️", title, body, confirmLabel = "Ya, Hapus", confirmColor = "var(--expense)", onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal-sheet" style={{ paddingBottom:"env(safe-area-inset-bottom,16px)" }}>
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 8px" }}>
          <div style={{ width:36, height:4, borderRadius:99, background:"var(--border)" }} />
        </div>
        <div style={{ padding:"12px 20px 24px", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
          <div style={{ width:64, height:64, borderRadius:20, background:"rgba(255,92,92,.12)",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>
            {icon}
          </div>
          <p style={{ fontSize:17, fontWeight:800, textAlign:"center" }}>{title}</p>
          {body && <p style={{ fontSize:13, color:"var(--sub)", textAlign:"center", lineHeight:1.6 }}>{body}</p>}
          <div style={{ display:"flex", gap:10, width:"100%", marginTop:8 }}>
            <button onClick={onCancel}
              style={{ flex:1, height:50, borderRadius:14, border:"1px solid var(--border)",
                fontSize:14, fontWeight:700, color:"var(--sub)" }}>
              Batal
            </button>
            <button onClick={onConfirm}
              style={{ flex:1, height:50, borderRadius:14, background:confirmColor,
                fontSize:14, fontWeight:700, color:"#fff" }}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
