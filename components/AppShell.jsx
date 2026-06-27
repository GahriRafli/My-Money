"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, BellOff, ChevronDown, MoreHorizontal, TrendingUp, Wallet } from "lucide-react";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";
import { usePushNotification } from "@/lib/usePushNotification";
import { monthKey } from "@/lib/utils";
import { EXP_CATS, INC_CATS } from "@/lib/constants";

// Attach local category info to a transaction row from Supabase
function enrichTx(tx) {
  const cats = tx.type === "income" ? INC_CATS : EXP_CATS;
  const cat  = cats.find(c => c.id === tx.category_id);
  return { ...tx, categories: cat || null };
}

import TxsTab          from "@/components/tabs/TxsTab";
import StatsTab        from "@/components/tabs/StatsTab";
import AccountsTab     from "@/components/tabs/AccountsTab";
import MoreTab         from "@/components/tabs/MoreTab";
import BudgetPage      from "@/components/pages/BudgetPage";
import GoalsPage       from "@/components/pages/GoalsPage";
import RecurringPage   from "@/components/pages/RecurringPage";
import HouseholdPage   from "@/components/pages/HouseholdPage";
import ThemePage       from "@/components/pages/ThemePage";
import AddTxModal      from "@/components/modals/AddTxModal";
import ConfirmModal    from "@/components/ConfirmModal";

// ── THEME INIT ──────────────────────────────────────────────
function getStoredTheme() {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem("mymoney-theme") || "dark";
}
function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem("mymoney-theme", t);
}

// ═══════════════════════════════════════════════════════════════
export default function AppShell({ session, inviteToken }) {
  const [tab,       setTab]       = useState("txs");
  const [subPage,   setSubPage]   = useState(null);
  const [showAdd,   setShowAdd]   = useState(false);
  const [editTx,    setEditTx]    = useState(null);
  const [month,     setMonth]     = useState(new Date());
  const [theme,     setTheme]     = useState("dark");
  const [invite,      setInvite]      = useState(inviteToken);
  const [workspace,   setWorkspace]   = useState(null);   // null=personal | {id,name,access}
  const [households,  setHouseholds]  = useState([]);
  const [showWsModal, setShowWsModal] = useState(false);

  // Data
  const [wallets,   setWallets]   = useState([]);
  const [txs,       setTxs]       = useState([]);
  const [budgets,   setBudgets]   = useState([]);
  const [goals,     setGoals]     = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [profile,   setProfile]   = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [toast,     setToast]     = useState(null);
  const [delTx,     setDelTx]     = useState(null);

  const user    = session?.user ?? null;
  const isGuest = !user;

  // Apply theme on mount & sync
  useEffect(() => {
    const t = getStoredTheme();
    setTheme(t);
    applyTheme(t);
  }, []);

  function showToast(msg, type = "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function handleTheme(t) {
    setTheme(t);
    applyTheme(t);
  }

  // Load data from Supabase
  useEffect(() => { if (user && hasSupabaseConfig) loadAll(); }, [user?.id]);

  // Reload data when workspace changes
  useEffect(() => { if (user && hasSupabaseConfig) loadWorkspaceData(); }, [workspace?.id]);

  async function loadAll() {
    setLoading(true);
    const [pR, bR, gR, rR] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("budgets").select("*").eq("user_id", user.id),
      supabase.from("savings_goals").select("*").eq("user_id", user.id),
      supabase.from("recurring_rules")
        .select("*, wallets(name,icon)")
        .eq("user_id", user.id).order("next_due"),
    ]);
    setProfile(pR.data);
    setBudgets(bR.data || []);
    setGoals(gR.data || []);
    setRecurring(rR.data || []);

    // Load households list
    const { data: ownedHh } = await supabase.from("households").select("*").eq("owner_id", user.id);
    const { data: memberRows } = await supabase.from("household_members").select("*").eq("user_id", user.id).eq("status","active");
    const memberIds = (memberRows || []).map(m => m.household_id).filter(id => !(ownedHh||[]).find(h => h.id === id));
    let memberHh = [];
    if (memberIds.length > 0) {
      const { data: hhData } = await supabase.from("households").select("*").in("id", memberIds);
      memberHh = (hhData || []).map(h => {
        const m = memberRows.find(mb => mb.household_id === h.id);
        return { ...h, myAccess: m?.access };
      });
    }
    const allHh = [...(ownedHh||[]).map(h=>({...h, myAccess:"full"})), ...memberHh];
    setHouseholds(allHh);

    await loadWorkspaceData();
    setLoading(false);
  }

  async function loadWorkspaceData() {
    if (!user) return;
    const isHousehold = !!workspace?.id;
    const [wR, tR] = await Promise.all([
      isHousehold
        ? supabase.from("wallets").select("*").eq("household_id", workspace.id)
        : supabase.from("wallets").select("*").eq("user_id", user.id).is("household_id", null),
      isHousehold
        ? supabase.from("transactions").select("*, wallets!wallet_id(name,icon,color,type)").eq("household_id", workspace.id).order("date", { ascending:false }).limit(300)
        : supabase.from("transactions").select("*, wallets!wallet_id(name,icon,color,type)").eq("user_id", user.id).is("household_id", null).order("date", { ascending:false }).limit(300),
    ]);
    setWallets(wR.data || []);
    setTxs((tR.data || []).map(enrichTx));
  }

  async function refreshWallets() {
    if (!user) return;
    const isHousehold = !!workspace?.id;
    const q = isHousehold
      ? supabase.from("wallets").select("*").eq("household_id", workspace.id)
      : supabase.from("wallets").select("*").eq("user_id", user.id).is("household_id", null);
    const { data } = await q;
    if (data) setWallets(data);
  }

  // Save transaction (guest or Supabase)
  async function saveTx(tx) {
    if (isGuest) {
      const cats = tx.type === "income" ? INC_CATS : EXP_CATS;
      const cat  = cats.find(c => c.id === tx.category_id);
      // Update guest wallet balance in state
      const amt = parseFloat(tx.amount) || 0;
      setWallets(prev => prev.map(w => {
        if (tx.type === "expense" && w.id === tx.wallet_id)  return { ...w, balance: (w.balance||0) - amt };
        if (tx.type === "income"  && w.id === tx.wallet_id)  return { ...w, balance: (w.balance||0) + amt };
        if (tx.type === "transfer") {
          if (w.id === tx.wallet_id)    return { ...w, balance: (w.balance||0) - amt };
          if (w.id === tx.to_wallet_id) return { ...w, balance: (w.balance||0) + amt };
        }
        return w;
      }));
      setTxs(p => [{ ...tx, id: Date.now().toString(), categories: cat }, ...p]);
      setShowAdd(false); setEditTx(null);
      return;
    }

    // Build payload — strip undefined fields
    const payload = {
      user_id:    user.id,
      type:       tx.type,
      amount:     parseFloat(tx.amount) || 0,
      wallet_id:  tx.wallet_id || null,
      note:       tx.note     || null,
      date:       tx.date,
    };
    if (workspace?.id) payload.household_id = workspace.id;
    if (tx.category_id)  payload.category_id  = tx.category_id;
    if (tx.to_wallet_id) payload.to_wallet_id = tx.to_wallet_id;

    if (editTx?.id) {
      const { data, error } = await supabase.from("transactions")
        .update(payload).eq("id", editTx.id)
        .select("*, wallets!wallet_id(name,icon,color,type)").single();
      if (error) { showToast("Gagal simpan: " + error.message); return; }
      if (data) { setTxs(p => p.map(t => t.id === editTx.id ? enrichTx(data) : t)); await refreshWallets(); }
    } else {
      const { data, error } = await supabase.from("transactions")
        .insert(payload)
        .select("*, wallets!wallet_id(name,icon,color,type)").single();
      if (error) { showToast("Gagal simpan: " + error.message); return; }
      if (data) { setTxs(p => [enrichTx(data), ...p]); await refreshWallets(); }
    }
    setShowAdd(false); setEditTx(null);
  }

  async function starTx(tx) {
    const starred = !tx.is_starred;
    if (isGuest) {
      setTxs(p => p.map(t => t.id === tx.id ? { ...t, is_starred: starred } : t));
      return;
    }
    const { error } = await supabase.from("transactions").update({ is_starred: starred }).eq("id", tx.id);
    if (!error) setTxs(p => p.map(t => t.id === tx.id ? { ...t, is_starred: starred } : t));
  }

  function deleteTx(tx) {
    setDelTx(tx);
  }

  async function confirmDeleteTx() {
    const tx = delTx;
    setDelTx(null);
    if (!tx) return;
    if (isGuest) {
      const amt = parseFloat(tx.amount) || 0;
      setWallets(prev => prev.map(w => {
        if (tx.type === "expense" && w.id === tx.wallet_id) return { ...w, balance: (w.balance||0) + amt };
        if (tx.type === "income"  && w.id === tx.wallet_id) return { ...w, balance: (w.balance||0) - amt };
        if (tx.type === "transfer") {
          if (w.id === tx.wallet_id)    return { ...w, balance: (w.balance||0) + amt };
          if (w.id === tx.to_wallet_id) return { ...w, balance: (w.balance||0) - amt };
        }
        return w;
      }));
      setTxs(p => p.filter(t => t.id !== tx.id));
      return;
    }
    const { error } = await supabase.from("transactions").delete().eq("id", tx.id);
    if (error) { showToast("Gagal hapus: " + error.message); return; }
    setTxs(p => p.filter(t => t.id !== tx.id));
    await refreshWallets();
  }

  const monthTxs = useMemo(() => txs.filter(t => t.date?.startsWith(monthKey(month))), [txs, month]);
  const summary  = useMemo(() => ({
    income:  monthTxs.filter(t=>t.type==="income").reduce((s,t)=>s+Number(t.amount),0),
    expense: monthTxs.filter(t=>t.type==="expense").reduce((s,t)=>s+Number(t.amount),0),
    balance: wallets.reduce((s,w)=>s+Number(w.balance||0),0),
  }), [monthTxs, wallets]);

  const today = new Date();
  const TAB_BAR = [
    { id:"txs",      emoji:"📅", label: `${today.getDate()}/${String(today.getMonth()+1).padStart(2,"0")}`, onTab: () => { setTab("txs"); setMonth(new Date()); setSubPage(null); } },
    { id:"stats",    Icon: TrendingUp,     label:"Stats",    onTab: () => { setTab("stats"); setMonth(new Date()); setSubPage(null); } },
    { id:"accounts", Icon: Wallet,         label:"Accounts" },
    { id:"more",     Icon: MoreHorizontal, label:"More"     },
  ];

  // Sub-page navigation from MoreTab
  function navigate(page) {
    setSubPage(page);
  }

  const hasHouseholds = !isGuest && households.length > 0;

  const { subscribed: pushSubscribed, loading: pushLoading, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } =
    usePushNotification(user, workspace?.id || null);

  // Content renderer
  function renderContent() {
    // Sub-pages (full-screen, no tab bar override)
    if (subPage === "budget")    return <BudgetPage    budgets={budgets}   txs={txs}       loading={loading} user={user} onBack={() => setSubPage(null)} onRefresh={loadAll} />;
    if (subPage === "goals")     return <GoalsPage      goals={goals}                       loading={loading} user={user} onBack={() => setSubPage(null)} onRefresh={loadAll} />;
    if (subPage === "recurring") return <RecurringPage  recurring={recurring} wallets={wallets} loading={loading} user={user} onBack={() => setSubPage(null)} onRefresh={loadAll} />;
    if (subPage === "household") return <HouseholdPage  user={user}                                                        onBack={() => setSubPage(null)} />;
    if (subPage === "theme")     return <ThemePage      currentTheme={theme} onTheme={handleTheme}                         onBack={() => setSubPage(null)} />;

    const wsBanner = hasHouseholds ? (
      <div style={{
        display:"flex", alignItems:"center",
        background: workspace ? "rgba(99,102,241,.12)" : "var(--surface)",
        borderBottom:"1px solid var(--border)",
      }}>
        <button onClick={() => setShowWsModal(true)} style={{
          flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          padding:"8px 16px", fontSize:12, fontWeight:700,
          color: workspace ? "var(--brand)" : "var(--sub)",
        }}>
          <span>{workspace ? "🏠" : "👤"}</span>
          <span>{workspace ? workspace.name : "Personal"}</span>
          <ChevronDown size={13} />
        </button>
        {workspace && (
          <button
            onClick={() => pushSubscribed ? pushUnsubscribe() : pushSubscribe()}
            disabled={pushLoading}
            title={pushSubscribed ? "Matikan notifikasi" : "Aktifkan notifikasi"}
            style={{ padding:"8px 14px", color: pushSubscribed ? "var(--brand)" : "var(--sub)",
              opacity: pushLoading ? 0.5 : 1 }}>
            {pushSubscribed ? <Bell size={16}/> : <BellOff size={16}/>}
          </button>
        )}
      </div>
    ) : null;

    // Main tabs
    if (tab === "txs")      return <>{wsBanner}<TxsTab      txs={txs}      month={month} setMonth={setMonth} summary={summary} loading={loading} onAdd={() => setShowAdd(true)} onEdit={tx => { setEditTx(tx); setShowAdd(true); }} onDelete={deleteTx} onStar={starTx} isGuest={isGuest} onGoMore={() => setTab("more")} /></>;
    if (tab === "stats")    return <>{wsBanner}<StatsTab    txs={txs}      month={month} setMonth={setMonth} summary={summary} loading={loading} budgets={budgets} /></>;
    if (tab === "accounts") return <>{wsBanner}<AccountsTab wallets={wallets} loading={loading} user={user} workspace={workspace} onRefresh={loadWorkspaceData} /></>;
    if (tab === "more")     return <MoreTab     user={user}    profile={profile} isGuest={isGuest} onNavigate={navigate} />;
  }

  // Sidebar nav items for desktop
  const NAV_ITEMS = [
    { id:"txs",      emoji:"📅", label:"Transaksi",  onTab: () => { setTab("txs"); setMonth(new Date()); setSubPage(null); } },
    { id:"stats",    Icon: TrendingUp, label:"Statistik",  onTab: () => { setTab("stats"); setMonth(new Date()); setSubPage(null); } },
    { id:"accounts", Icon: Wallet,     label:"Akun",       onTab: () => { setTab("accounts"); setSubPage(null); } },
    { id:"more",     Icon: MoreHorizontal, label:"Lainnya", onTab: () => { setTab("more"); setSubPage(null); } },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="desktop-sidebar">
        {/* Logo */}
        <div style={{ padding:"0 20px 24px", borderBottom:"1px solid var(--border)" }}>
          <p style={{ fontSize:20, fontWeight:900, color:"var(--accent)" }}>💰 My Money</p>
          <p style={{ fontSize:11, color:"var(--sub)", marginTop:4 }}>Keuangan Pribadi & Bersama</p>
        </div>

        {/* Workspace badge */}
        {hasHouseholds && (
          <div style={{ padding:"14px 16px", borderBottom:"1px solid var(--border)" }}>
            <button onClick={() => setShowWsModal(true)} style={{
              width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 12px",
              borderRadius:12, background: workspace ? "rgba(99,102,241,.12)" : "var(--surface2)",
              border:`1.5px solid ${workspace ? "var(--brand)" : "var(--border)"}`,
            }}>
              <span style={{ fontSize:18 }}>{workspace ? "🏠" : "👤"}</span>
              <div style={{ flex:1, textAlign:"left" }}>
                <p style={{ fontSize:12, fontWeight:700, color: workspace ? "var(--brand)" : "var(--text)" }}>
                  {workspace ? workspace.name : "Personal"}
                </p>
                <p style={{ fontSize:10, color:"var(--sub)" }}>Workspace aktif</p>
              </div>
              <ChevronDown size={13} color="var(--sub)" />
            </button>
          </div>
        )}

        {/* Nav items */}
        <nav style={{ padding:"12px 12px", flex:1 }}>
          {NAV_ITEMS.map(({ id, emoji, Icon, label, onTab }) => {
            const active = tab === id && !subPage;
            return (
              <button key={id} onClick={onTab}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:12,
                  padding:"11px 12px", borderRadius:12, marginBottom:4,
                  background: active ? "rgba(255,109,78,.1)" : "transparent",
                  color: active ? "var(--accent)" : "var(--sub)",
                  fontWeight: active ? 700 : 600, fontSize:14, transition:"all .15s" }}>
                {emoji
                  ? <span style={{ fontSize:18, width:22, textAlign:"center" }}>{emoji}</span>
                  : <Icon size={18} strokeWidth={active ? 2.4 : 1.8} />}
                {label}
              </button>
            );
          })}
        </nav>

        {/* User info */}
        {user && (
          <div style={{ padding:"16px 20px", borderTop:"1px solid var(--border)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:10, background:"rgba(255,109,78,.15)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:14, fontWeight:800, color:"var(--accent)" }}>
                {user.email?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:12, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="app-frame">
        <div style={{ paddingBottom: subPage ? 0 : "calc(60px + env(safe-area-inset-bottom,0px))" }}>
          {renderContent()}
        </div>

        {/* Bottom Tab Bar — mobile only */}
        {!subPage && (
          <nav className="tab-bar">
            <div style={{ display:"flex", justifyContent:"space-around", alignItems:"center", padding:"8px 0 4px" }}>
              {TAB_BAR.map(({ id, emoji, Icon, label, onTab }) => {
                const active = tab === id;
                return (
                  <button key={id} onClick={onTab || (() => { setTab(id); setSubPage(null); })}
                    style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3,
                      minWidth:64, padding:"2px 0",
                      color: active ? "var(--accent)" : "var(--sub)",
                      fontSize:11, fontWeight:600, transition:"color .15s" }}>
                    {emoji
                      ? <span style={{ fontSize:20, lineHeight:1 }}>{emoji}</span>
                      : <Icon size={21} strokeWidth={active ? 2.4 : 1.7} />}
                    <span style={{ fontSize:10 }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </div>

      {/* Workspace switcher modal */}
      {showWsModal && (
        <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && setShowWsModal(false)}>
          <div className="modal-sheet" style={{ padding:"20px 16px calc(env(safe-area-inset-bottom,0px) + 20px)" }}>
            <p style={{ fontSize:16, fontWeight:800, marginBottom:16 }}>Pilih Workspace</p>
            {/* Personal */}
            <button onClick={() => { setWorkspace(null); setShowWsModal(false); }}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"14px",
                borderRadius:14, marginBottom:10, textAlign:"left",
                background: !workspace ? "rgba(99,102,241,.1)" : "var(--surface2)",
                border:`2px solid ${!workspace ? "var(--brand)" : "var(--border)"}` }}>
              <span style={{ fontSize:28 }}>👤</span>
              <div>
                <p style={{ fontSize:14, fontWeight:700, color: !workspace ? "var(--brand)" : "var(--text)" }}>Personal</p>
                <p style={{ fontSize:12, color:"var(--sub)" }}>Data keuangan pribadimu</p>
              </div>
              {!workspace && <span style={{ marginLeft:"auto", fontSize:18 }}>✓</span>}
            </button>
            {/* Households */}
            {households.map(hh => {
              const active = workspace?.id === hh.id;
              return (
                <button key={hh.id} onClick={() => { setWorkspace({ id:hh.id, name:hh.name, access: hh.myAccess }); setShowWsModal(false); }}
                  style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"14px",
                    borderRadius:14, marginBottom:10, textAlign:"left",
                    background: active ? "rgba(99,102,241,.1)" : "var(--surface2)",
                    border:`2px solid ${active ? "var(--brand)" : "var(--border)"}` }}>
                  <span style={{ fontSize:28 }}>🏠</span>
                  <div>
                    <p style={{ fontSize:14, fontWeight:700, color: active ? "var(--brand)" : "var(--text)" }}>{hh.name}</p>
                    <p style={{ fontSize:12, color:"var(--sub)" }}>
                      {hh.owner_id === user?.id ? "Owner" : hh.myAccess === "full" ? "Full Access" : "View Only"}
                    </p>
                  </div>
                  {active && <span style={{ marginLeft:"auto", fontSize:18 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Invite banner */}
      {invite && (
        <InviteBanner
          token={invite}
          user={user}
          onDone={(msg) => { setInvite(null); showToast(msg, "ok"); }}
          onDismiss={() => setInvite(null)}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div style={{
          position:"fixed", bottom: "calc(72px + env(safe-area-inset-bottom,0px))",
          left:"50%", transform:"translateX(-50%)", zIndex:9999,
          background: toast.type==="error" ? "var(--expense)" : "#10B981",
          color:"#fff", padding:"12px 20px", borderRadius:14,
          fontSize:13, fontWeight:600, maxWidth:"90vw", textAlign:"center",
          boxShadow:"0 8px 32px rgba(0,0,0,.35)", whiteSpace:"pre-wrap",
          animation:"fadeUp .2s ease",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Confirm delete transaction modal */}
      {delTx && (
        <ConfirmModal
          icon="🗑️"
          title="Hapus transaksi ini?"
          body={delTx.note || (delTx.categories?.name) || "Transaksi akan dihapus permanen."}
          confirmLabel="Ya, Hapus"
          onConfirm={confirmDeleteTx}
          onCancel={() => setDelTx(null)}
        />
      )}

      {/* Add / Edit Transaction Modal */}
      {showAdd && (
        <AddTxModal
          wallets={wallets}
          isGuest={isGuest}
          initial={editTx || {}}
          onClose={() => { setShowAdd(false); setEditTx(null); }}
          onSave={saveTx}
        />
      )}
    </>
  );
}

function InviteBanner({ token, user, onDone, onDismiss }) {
  const [info,    setInfo]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [notFound,setNotFound]= useState(false);

  useEffect(() => {
    async function fetchInvite() {
      // First try RPC (bypasses RLS), fall back to direct query
      let data = null;
      const rpc = await supabase.rpc("get_invite_by_token", { p_token: token });
      if (rpc.data) {
        data = rpc.data;
      } else {
        const { data: d } = await supabase.from("household_members")
          .select("*").eq("invite_token", token).eq("status","pending").maybeSingle();
        if (d) {
          // Fetch household name terpisah
          const { data: hh } = await supabase.from("households").select("name").eq("id", d.household_id).maybeSingle();
          data = { ...d, households: hh };
        }
      }

      if (data) {
        setInfo(data);
      } else if (!user) {
        setInfo({ _needsLogin: true });
      } else {
        setNotFound(true);
        setTimeout(() => onDismiss(), 3000);
      }
      setLoading(false);
    }
    fetchInvite();
  }, [token, user?.id]);

  async function accept() {
    if (!user) { onDismiss(); return; }
    setJoining(true);
    const { error } = await supabase.from("household_members")
      .update({
        user_id: user.id,
        email: user.email,
        status: "active",
        joined_at: new Date().toISOString(),
      })
      .eq("invite_token", token)
      .eq("status", "pending");
    setJoining(false);
    if (error) onDone("Gagal bergabung: " + error.message);
    else onDone(`Berhasil bergabung ke "${info?.households?.name}"! 🎉`);
  }

  if (loading) return null;

  if (notFound) return (
    <div style={{
      position:"fixed", bottom:90, left:"50%", transform:"translateX(-50%)",
      zIndex:9999, padding:"12px 20px", borderRadius:14,
      background:"var(--expense)", color:"#fff", fontSize:13, fontWeight:600,
      textAlign:"center", boxShadow:"0 8px 32px rgba(0,0,0,.3)", maxWidth:"90vw",
      animation:"fadeUp .2s ease",
    }}>
      Link undangan tidak valid atau sudah digunakan.
    </div>
  );

  if (!info) return null;

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9998,
      background:"rgba(0,0,0,.6)", backdropFilter:"blur(8px)",
      display:"flex", alignItems:"flex-end",
    }}>
      <div style={{ width:"100%", background:"var(--surface)", borderRadius:"20px 20px 0 0",
        padding:"24px 20px calc(env(safe-area-inset-bottom,0px) + 24px)",
        animation:"slideUp .28s cubic-bezier(.32,.72,0,1)" }}>
        <div style={{ width:64, height:64, borderRadius:20, background:"rgba(99,102,241,.12)",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 16px" }}>
          🏠
        </div>
        <p style={{ fontSize:20, fontWeight:900, textAlign:"center", marginBottom:8 }}>
          Undangan Household
        </p>
        <p style={{ fontSize:14, color:"var(--sub)", textAlign:"center", lineHeight:1.7, marginBottom:24 }}>
          {info._needsLogin ? (
            <>Kamu punya undangan household. <b style={{ color:"var(--accent)" }}>Login</b> terlebih dahulu untuk melihat & menerima undangan.</>
          ) : (
            <>Kamu diundang untuk bergabung ke{" "}
            <b style={{ color:"var(--text)" }}>{info.households?.name}</b>
            {" "}dengan akses <b style={{ color:"var(--accent)" }}>{info.access==="full"?"Full Access":"View Only"}</b>.</>
          )}
        </p>
        <div style={{ display:"flex", gap:12 }}>
          <button onClick={onDismiss}
            style={{ flex:1, height:52, borderRadius:14, border:"1px solid var(--border)",
              fontSize:15, fontWeight:700, color:"var(--sub)" }}>
            Tutup
          </button>
          <button onClick={accept} disabled={joining || !user || info._needsLogin}
            style={{ flex:2, height:52, borderRadius:14,
              background: (user && !info._needsLogin) ? "var(--accent)" : "var(--surface2)",
              color:"#fff", fontSize:15, fontWeight:800,
              boxShadow: (user && !info._needsLogin) ? "0 6px 20px rgba(99,102,241,.3)" : "none" }}>
            {joining ? "Bergabung…" : (user && !info._needsLogin) ? "Terima & Bergabung" : "Login dulu"}
          </button>
        </div>
      </div>
    </div>
  );
}
