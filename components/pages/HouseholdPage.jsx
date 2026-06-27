"use client";
import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Copy, Crown, Eye, Link, Plus, ShieldCheck, Trash2, Users, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { randToken } from "@/lib/utils";
import { Empty, SkelRows } from "@/components/tabs/TxsTab";
import ConfirmModal from "@/components/ConfirmModal";

export default function HouseholdPage({ user, onBack }) {
  const [loading,    setLoading]    = useState(true);
  const [households, setHouseholds] = useState([]);
  const [active,     setActive]     = useState(null);
  const [members,    setMembers]    = useState([]);
  const [pendingInv, setPendingInv] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [copiedToken,setCopied]     = useState(null);
  const [toast,      setToast]      = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [err,        setErr]        = useState("");

  function showToast(msg, type = "ok") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => { if (user) load(); }, [user?.id]);

  async function load() {
    setLoading(true);

    // Owned households
    const { data: owned } = await supabase.from("households").select("*").eq("owner_id", user.id);

    // Member-of: ambil membership rows dulu, lalu fetch household data terpisah
    const { data: memberships } = await supabase.from("household_members")
      .select("*").eq("user_id", user.id).eq("status", "active");

    const ownedIds = (owned || []).map(h => h.id);
    const memberIds = (memberships || [])
      .map(m => m.household_id)
      .filter(id => !ownedIds.includes(id));

    let memberHouseholds = [];
    if (memberIds.length > 0) {
      const { data: hhData } = await supabase.from("households").select("*").in("id", memberIds);
      memberHouseholds = (hhData || []).map(h => {
        const m = memberships.find(mb => mb.household_id === h.id);
        return { ...h, isOwner: false, myAccess: m?.access };
      });
    }

    const all = [
      ...(owned || []).map(h => ({ ...h, isOwner: true })),
      ...memberHouseholds,
    ];
    setHouseholds(all);
    if (all.length > 0 && !active) setActive(all[0]);

    // Pending invites: fetch tanpa join lalu fetch household name terpisah
    const { data: inviteRows } = await supabase.from("household_members")
      .select("*").eq("email", user.email).eq("status", "pending");

    if (inviteRows && inviteRows.length > 0) {
      const inviteHhIds = inviteRows.map(i => i.household_id);
      const { data: inviteHh } = await supabase.from("households").select("id,name,owner_id").in("id", inviteHhIds);
      const hhMap = Object.fromEntries((inviteHh || []).map(h => [h.id, h]));
      setPendingInv(inviteRows.map(i => ({ ...i, households: hhMap[i.household_id] || null })));
    } else {
      setPendingInv([]);
    }

    setLoading(false);
  }

  async function loadMembers(hhId) {
    const { data } = await supabase.from("household_members")
      .select("*").eq("household_id", hhId).order("joined_at");
    setMembers(data || []);
  }

  useEffect(() => { if (active) loadMembers(active.id); }, [active?.id]);

  async function createHousehold(name) {
    setErr("");
    const { data: hh, error } = await supabase.from("households")
      .insert({ name, owner_id: user.id }).select().single();
    if (error) { setErr(error.message); return; }
    await supabase.from("household_members").insert({
      household_id: hh.id, user_id: user.id, email: user.email,
      role:"owner", access:"full", status:"active", joined_at: new Date().toISOString(),
    });
    setShowCreate(false);
    await load();
    setActive({ ...hh, isOwner: true });
  }

  async function sendInvite({ email, access }) {
    if (!active) return;
    const { data: existing } = await supabase.from("household_members")
      .select("id").eq("household_id", active.id).eq("email", email).maybeSingle();
    if (existing) { setErr("Email ini sudah diundang."); return; }
    const token = randToken();
    const { error } = await supabase.from("household_members").insert({
      household_id: active.id, email, access, role:"member",
      status:"pending", invited_by: user.id, invite_token: token,
    });
    if (error) { setErr(error.message); return; }
    setShowInvite(false);
    loadMembers(active.id);
    // Copy invite URL
    const url = `${window.location.origin}?invite=${token}`;
    navigator.clipboard?.writeText(url).catch(()=>{});
    setCopied(token);
    setTimeout(() => setCopied(null), 3000);
  }

  async function generateInviteLink(email, access) {
    const token = randToken();
    const payload = {
      household_id: active.id,
      access,
      role: "member",
      status: "pending",
      invited_by: user.id,
      invite_token: token,
    };
    if (email) payload.email = email;

    const { error } = await supabase.from("household_members").insert(payload);
    if (error) { showToast("Gagal buat link: " + error.message, "error"); return null; }
    return `${window.location.origin}?invite=${token}`;
  }

  async function respondInvite(inv, accept) {
    if (accept) {
      const { error } = await supabase.from("household_members").update({
        user_id: user.id,
        email: user.email,
        status: "active",
        joined_at: new Date().toISOString(),
      }).eq("id", inv.id);
      if (error) { showToast("Gagal terima undangan: " + error.message, "error"); return; }
    } else {
      await supabase.from("household_members").update({ status:"rejected" }).eq("id", inv.id);
    }
    load();
  }

  async function removeMember(memberId) {
    await supabase.from("household_members").delete().eq("id", memberId);
    loadMembers(active.id);
  }

  async function changeAccess(memberId, newAccess) {
    await supabase.from("household_members").update({ access: newAccess }).eq("id", memberId);
    loadMembers(active.id);
  }

  async function leaveHousehold() {
    if (!active || active.isOwner) return;
    await supabase.from("household_members").delete().eq("user_id", user.id).eq("household_id", active.id);
    setActive(null); load();
  }

  async function deleteHousehold() {
    if (!active?.isOwner) return;
    await supabase.from("households").delete().eq("id", active.id);
    setActive(null); setConfirmDel(null); load();
  }

  function copyInviteUrl(token) {
    const url = `${window.location.origin}?invite=${token}`;
    navigator.clipboard?.writeText(url).catch(()=>{});
    setCopied(token);
    setTimeout(() => setCopied(null), 3000);
  }

  if (!user) return (
    <div>
      <div className="topbar">
        <button className="page-back-btn" onClick={onBack}><ChevronLeft size={18}/></button>
        <p style={{flex:1,fontSize:16,fontWeight:700}}>Household</p>
      </div>
      <Empty icon="👥" title="Login diperlukan" sub="Login terlebih dahulu untuk menggunakan fitur household." />
    </div>
  );

  return (
    <div style={{ paddingBottom:40 }}>
      {/* Topbar */}
      <div className="topbar">
        <button className="page-back-btn" onClick={onBack}><ChevronLeft size={18}/></button>
        <p style={{ flex:1, fontSize:16, fontWeight:700 }}>Household</p>
        <button style={{ color:"var(--accent)" }} onClick={() => setShowCreate(true)}>
          <Plus size={22}/>
        </button>
      </div>

      {loading && <div style={{padding:"0 16px"}}><SkelRows n={4}/></div>}

      {/* Pending invites */}
      {!loading && pendingInv.map(inv => (
        <div key={inv.id} style={{ margin:"14px 16px 0", padding:16, background:"rgba(255,109,78,.08)",
          borderRadius:16, border:"1px solid rgba(255,109,78,.25)" }}>
          <div style={{ display:"flex", gap:10, marginBottom:14 }}>
            <span style={{ fontSize:28 }}>📩</span>
            <div>
              <p style={{ fontSize:14, fontWeight:700 }}>Undangan Masuk</p>
              <p style={{ fontSize:12, color:"var(--sub)", marginTop:4, lineHeight:1.6 }}>
                Kamu diundang ke <b style={{color:"var(--text)"}}>{inv.households?.name}</b> dengan akses{" "}
                <b style={{color:"var(--accent)"}}>{inv.access==="full"?"Full":"View Only"}</b>
              </p>
            </div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => respondInvite(inv,false)}
              style={{ flex:1, height:40, borderRadius:10, border:"1px solid var(--border)", fontSize:13, fontWeight:700, color:"var(--sub)" }}>
              Tolak
            </button>
            <button onClick={() => respondInvite(inv,true)}
              style={{ flex:1, height:40, borderRadius:10, background:"var(--accent)", color:"#fff", fontSize:13, fontWeight:700 }}>
              Terima
            </button>
          </div>
        </div>
      ))}

      {/* Household list tabs (if multiple) */}
      {!loading && households.length > 1 && (
        <div style={{ display:"flex", gap:8, padding:"14px 16px 0", overflowX:"auto" }}>
          {households.map(hh => (
            <button key={hh.id} onClick={() => setActive(hh)}
              style={{ flexShrink:0, padding:"8px 14px", borderRadius:10, fontSize:13, fontWeight:700,
                background: active?.id===hh.id ? "var(--accent)" : "var(--surface2)",
                color: active?.id===hh.id ? "#fff" : "var(--sub)",
                border: `2px solid ${active?.id===hh.id?"var(--accent)":"var(--border)"}` }}>
              {hh.name}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && households.length === 0 && pendingInv.length === 0 && (
        <div style={{ padding:"0 16px", marginTop:14 }}>
          <div style={{ padding:"32px 20px", textAlign:"center", background:"var(--surface)",
            borderRadius:20, border:"1px solid var(--border)", marginBottom:16 }}>
            <p style={{ fontSize:44, marginBottom:12 }}>👨‍👩‍👧‍👦</p>
            <p style={{ fontSize:16, fontWeight:800, marginBottom:8 }}>Belum ada Household</p>
            <p style={{ fontSize:13, color:"var(--sub)", lineHeight:1.7 }}>
              Buat household baru dan bagikan link undangan ke teman atau keluarga. Semua anggota bisa catat transaksi di workspace bersama yang terpisah dari data personalmu.
            </p>
          </div>
          <button onClick={() => setShowCreate(true)}
            style={{ width:"100%", height:52, borderRadius:14, background:"var(--accent)",
              color:"#fff", fontSize:15, fontWeight:800, boxShadow:"0 6px 20px rgba(99,102,241,.3)" }}>
            + Buat Household Baru
          </button>
        </div>
      )}

      {/* Active household detail */}
      {!loading && active && (
        <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:14 }}>
          {/* Info card */}
          <div style={{ padding:16, background:"var(--surface)", borderRadius:18, border:"1px solid var(--border)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
              <div style={{ width:52, height:52, borderRadius:16, fontSize:28, background:"var(--surface2)",
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>🏠</div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:17, fontWeight:800 }}>{active.name}</p>
                <p style={{ fontSize:12, color:"var(--sub)", marginTop:3 }}>
                  {members.filter(m=>m.status==="active").length} anggota aktif
                  {active.isOwner ? " · Kamu owner" : ` · Aksesmu: ${active.myAccess==="full"?"Full":"View"}`}
                </p>
              </div>
            </div>

            {/* Info tentang workspace */}
            <div style={{ padding:"10px 14px", background:"rgba(99,102,241,.08)", borderRadius:12,
              border:"1px solid rgba(99,102,241,.15)" }}>
              <p style={{ fontSize:12, color:"var(--accent)", fontWeight:600, lineHeight:1.6 }}>
                💡 Workspace bersama ini terpisah dari data personalmu. Switch ke household ini di halaman utama untuk melihat & catat transaksi bersama.
              </p>
            </div>
          </div>

          {/* Invite via link */}
          {active.isOwner && (
            <div style={{ padding:16, background:"var(--surface)", borderRadius:18, border:"1px solid var(--border)" }}>
              <p style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Undang Anggota</p>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={() => setShowInvite(true)}
                  style={{ flex:1, height:44, borderRadius:12, background:"var(--accent)",
                    color:"#fff", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  <Link size={15}/> Buat Link Undangan
                </button>
              </div>
              {copiedToken && (
                <div style={{ marginTop:10, padding:"10px 14px", background:"rgba(16,185,129,.1)",
                  borderRadius:10, border:"1px solid rgba(16,185,129,.2)",
                  display:"flex", alignItems:"center", gap:8 }}>
                  <Check size={15} color="var(--income)" />
                  <p style={{ fontSize:12, color:"var(--income)", fontWeight:600 }}>Link berhasil disalin ke clipboard!</p>
                </div>
              )}
            </div>
          )}

          {/* Members */}
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:"var(--sub)", textTransform:"uppercase",
              letterSpacing:"0.08em", marginBottom:8 }}>
              Anggota ({members.length})
            </p>
            <div style={{ background:"var(--surface)", borderRadius:18, border:"1px solid var(--border)", overflow:"hidden" }}>
              {members.map((m,i) => {
                const isOwner = m.user_id === active.owner_id;
                const name = m.profiles?.full_name || m.email;
                const isPending = m.status === "pending";
                return (
                  <div key={m.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 16px",
                    borderBottom: i<members.length-1 ? "1px solid var(--border)" : "none" }}>
                    <div style={{ width:38, height:38, borderRadius:12, background:"var(--surface2)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:16, fontWeight:800, color:"var(--accent)", flexShrink:0 }}>
                      {isPending ? "⏳" : name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</p>
                      <p style={{ fontSize:11, color:"var(--sub)", marginTop:2 }}>
                        {isPending ? "Menunggu konfirmasi" : m.email}
                      </p>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                      {isPending && active.isOwner && m.invite_token && (
                        <button onClick={() => copyInviteUrl(m.invite_token)}
                          style={{ width:30, height:30, borderRadius:8, background:"var(--surface2)",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            color: copiedToken===m.invite_token ? "var(--income)" : "var(--sub)" }}>
                          {copiedToken===m.invite_token ? <Check size={14}/> : <Copy size={14}/>}
                        </button>
                      )}
                      {isOwner ? (
                        <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, fontWeight:700, color:"#F59E0B" }}>
                          <Crown size={12}/> Owner
                        </span>
                      ) : active.isOwner ? (
                        <button onClick={() => changeAccess(m.id, m.access==="full"?"view":"full")}
                          style={{ padding:"4px 10px", borderRadius:8, fontSize:11, fontWeight:700,
                            background: m.access==="full"?"rgba(99,102,241,.12)":"rgba(245,158,11,.12)",
                            color: m.access==="full"?"var(--accent)":"#F59E0B",
                            display:"flex", alignItems:"center", gap:4 }}>
                          {m.access==="full" ? <><ShieldCheck size={11}/> Full</> : <><Eye size={11}/> View</>}
                        </button>
                      ) : (
                        <span style={{ fontSize:11, fontWeight:700, color:"var(--sub)" }}>
                          {m.access==="full"?"Full":"View"}
                        </span>
                      )}
                      {active.isOwner && !isOwner && (
                        <button onClick={() => removeMember(m.id)}
                          style={{ color:"var(--expense)", opacity:0.6, padding:4 }}>
                          <Trash2 size={14}/>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Danger zone */}
          {active.isOwner ? (
            <button onClick={() => setConfirmDel(active)}
              style={{ width:"100%", padding:"13px", borderRadius:14,
                background:"rgba(255,92,92,.08)", border:"1px solid rgba(255,92,92,.2)",
                color:"var(--expense)", fontSize:13, fontWeight:700 }}>
              Hapus Household
            </button>
          ) : (
            <button onClick={leaveHousehold}
              style={{ width:"100%", padding:"13px", borderRadius:14,
                background:"rgba(255,92,92,.08)", border:"1px solid rgba(255,92,92,.2)",
                color:"var(--expense)", fontSize:13, fontWeight:700 }}>
              Keluar dari Household
            </button>
          )}
        </div>
      )}

      {/* Create household modal */}
      {showCreate && <CreateHouseholdModal onSave={createHousehold} onClose={() => setShowCreate(false)} err={err} />}

      {/* Invite modal */}
      {showInvite && active && (
        <InviteModal
          active={active}
          onSend={sendInvite}
          onClose={() => setShowInvite(false)}
          err={err}
          setErr={setErr}
          generateLink={generateInviteLink}
          onCopied={token => { setCopied(token); setTimeout(()=>setCopied(null),3000); }}
          showToast={showToast}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed", bottom:90, left:"50%", transform:"translateX(-50%)",
          zIndex:9999, padding:"12px 20px", borderRadius:14, maxWidth:"90vw",
          background: toast.type==="error" ? "var(--expense)" : "#10B981",
          color:"#fff", fontSize:13, fontWeight:600, textAlign:"center",
          boxShadow:"0 8px 32px rgba(0,0,0,.3)", animation:"fadeUp .2s ease",
          whiteSpace:"pre-wrap",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Confirm delete */}
      {confirmDel && (
        <ConfirmModal
          icon="🏠"
          title={`Hapus "${confirmDel.name}"?`}
          body="Semua data household (wallet & transaksi bersama) akan dihapus permanen."
          confirmLabel="Ya, Hapus"
          onConfirm={deleteHousehold}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}

function CreateHouseholdModal({ onSave, onClose, err }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (!name) return;
    setBusy(true);
    await onSave(name);
    setBusy(false);
  }
  return (
    <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-sheet">
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 6px" }}>
          <div style={{ width:36, height:4, borderRadius:99, background:"var(--border)" }}/>
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px 14px" }}>
          <h2 style={{ fontSize:17, fontWeight:800 }}>Buat Household Baru</h2>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:10, background:"var(--surface2)",
            display:"flex", alignItems:"center", justifyContent:"center", color:"var(--sub)" }}>
            <X size={17}/>
          </button>
        </div>
        <form onSubmit={submit} style={{ padding:"0 16px 28px", display:"flex", flexDirection:"column", gap:16 }}>
          <div>
            <span className="field-label">Nama Household</span>
            <div className="field-wrap">
              <input className="field-input" placeholder="cth: Keluarga, Kost Ceria, Bisnis..." required
                value={name} onChange={e=>setName(e.target.value)} autoFocus />
            </div>
          </div>
          <div style={{ padding:"12px 14px", background:"rgba(99,102,241,.08)", borderRadius:12,
            border:"1px solid rgba(99,102,241,.15)", fontSize:12, color:"var(--accent)", lineHeight:1.7 }}>
            💡 Household = workspace bersama terpisah dari akun personalmu. Kamu bisa switch ke workspace ini kapan saja.
          </div>
          {err && <p style={{ fontSize:13, color:"var(--expense)" }}>{err}</p>}
          <button type="submit" disabled={busy||!name}
            style={{ height:52, borderRadius:14, fontWeight:800, fontSize:15, color:"#fff",
              background: name ? "var(--accent)" : "var(--surface2)",
              boxShadow: name ? "0 6px 20px rgba(99,102,241,.3)" : "none" }}>
            {busy ? "Membuat…" : "Buat Household"}
          </button>
        </form>
      </div>
    </div>
  );
}

function InviteModal({ active, onSend, onClose, err, setErr, generateLink, onCopied, showToast }) {
  const [mode,   setMode]   = useState("link");
  const [email,  setEmail]  = useState("");
  const [access, setAccess] = useState("full");
  const [busy,   setBusy]   = useState(false);
  const [genUrl, setGenUrl] = useState("");

  async function handleGenLink() {
    setBusy(true);
    const url = await generateLink(null, access);
    setBusy(false);
    if (url) {
      setGenUrl(url);
      try { await navigator.clipboard.writeText(url); } catch {}
      showToast("🔗 Link undangan berhasil disalin!");
    }
  }

  async function handleEmail(e) {
    e.preventDefault();
    setBusy(true);
    await onSend({ email, access });
    setBusy(false);
  }

  return (
    <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-sheet">
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 6px" }}>
          <div style={{ width:36, height:4, borderRadius:99, background:"var(--border)" }}/>
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px 14px" }}>
          <h2 style={{ fontSize:17, fontWeight:800 }}>Undang Anggota</h2>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:10, background:"var(--surface2)",
            display:"flex", alignItems:"center", justifyContent:"center", color:"var(--sub)" }}>
            <X size={17}/>
          </button>
        </div>

        <div style={{ padding:"0 16px 28px", display:"flex", flexDirection:"column", gap:16 }}>
          {/* Mode toggle */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", background:"var(--surface2)", borderRadius:12, padding:4 }}>
            {[["link","🔗 Via Link"],["email","✉️ Via Email"]].map(([id,label]) => (
              <button key={id} onClick={() => { setMode(id); setErr(""); }}
                style={{ padding:"9px", borderRadius:10, fontSize:13, fontWeight:700,
                  background: mode===id ? "var(--surface)" : "transparent",
                  color: mode===id ? "var(--accent)" : "var(--sub)",
                  boxShadow: mode===id ? "0 2px 8px rgba(0,0,0,.12)" : "none" }}>
                {label}
              </button>
            ))}
          </div>

          {/* Access level */}
          <div>
            <span className="field-label">Level Akses</span>
            <div style={{ display:"flex", gap:10, marginTop:6 }}>
              {[["full","Full Access","Bisa tambah & lihat transaksi"],["view","View Only","Hanya bisa lihat"]].map(([id,label,desc]) => (
                <button key={id} type="button" onClick={() => setAccess(id)}
                  style={{ flex:1, padding:"12px", borderRadius:12, textAlign:"left",
                    border:`2px solid ${access===id?"var(--accent)":"var(--border)"}`,
                    background: access===id ? "rgba(99,102,241,.08)" : "var(--surface2)" }}>
                  <p style={{ fontSize:13, fontWeight:700, color: access===id?"var(--accent)":"var(--text)" }}>{label}</p>
                  <p style={{ fontSize:11, color:"var(--sub)", marginTop:3 }}>{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Via Link */}
          {mode === "link" && (
            <>
              <button onClick={handleGenLink} disabled={busy}
                style={{ height:50, borderRadius:14, background:"var(--accent)", color:"#fff",
                  fontSize:14, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                <Link size={17}/> {busy ? "Membuat…" : "Buat & Salin Link"}
              </button>
              {genUrl && (
                <div style={{ padding:"10px 14px", background:"var(--surface2)", borderRadius:12,
                  border:"1px solid var(--border)" }}>
                  <p style={{ fontSize:10, color:"var(--sub)", marginBottom:4, fontWeight:600 }}>LINK UNDANGAN</p>
                  <p style={{ fontSize:11, color:"var(--text)", wordBreak:"break-all", lineHeight:1.5 }}>{genUrl}</p>
                </div>
              )}
              <p style={{ fontSize:12, color:"var(--sub)", textAlign:"center", lineHeight:1.6 }}>
                Link berlaku sekali pakai. Siapa saja yang membuka link ini bisa bergabung ke household <b>{active.name}</b>.
              </p>
            </>
          )}

          {/* Via Email */}
          {mode === "email" && (
            <form onSubmit={handleEmail} style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <span className="field-label">Email Teman</span>
                <div className="field-wrap">
                  <input className="field-input" type="email" placeholder="nama@email.com" required
                    value={email} onChange={e=>setEmail(e.target.value)} autoFocus />
                </div>
              </div>
              {err && <p style={{ fontSize:13, color:"var(--expense)" }}>{err}</p>}
              <button type="submit" disabled={busy||!email}
                style={{ height:50, borderRadius:14, background:"var(--accent)", color:"#fff", fontSize:14, fontWeight:700 }}>
                {busy ? "Mengirim…" : "Kirim Undangan"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
