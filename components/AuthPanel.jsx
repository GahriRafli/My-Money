"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  Eye,
  Lock,
  Mail,
  PieChart,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
} from "lucide-react";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

export default function AuthPanel() {
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setMessage("");

    if (!hasSupabaseConfig) {
      setMessage("Isi .env.local dengan Supabase URL dan anon key dulu.");
      return;
    }

    setLoading(true);
    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password,
          })
        : await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: { data: { full_name: form.name } },
          });
    setLoading(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (mode === "register") {
      setMessage("Akun dibuat. Cek email jika konfirmasi aktif, lalu masuk.");
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#F6F7F2] text-ink">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.08fr)_minmax(440px,.92fr)]">
        <section className="relative flex min-h-[58vh] flex-col overflow-hidden bg-ink px-5 py-5 text-white sm:px-8 sm:py-7 lg:min-h-screen lg:px-10">
          <div className="absolute inset-0 opacity-80 finance-pattern" />
          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-ink to-transparent" />

          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-brand text-white shadow-soft">
                <WalletCards size={23} />
              </div>
              <div>
                <p className="text-sm text-white/60">My Money</p>
                <h1 className="text-lg font-semibold sm:text-xl">Financial command center</h1>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-2 text-xs text-white/72 sm:flex">
              <ShieldCheck size={15} />
              Supabase secured
            </div>
          </div>

          <div className="relative z-10 grid flex-1 items-center gap-8 py-10 lg:grid-cols-[minmax(0,.95fr)_minmax(320px,.78fr)] lg:py-8">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-saffron/40 bg-saffron/12 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-saffron">
                <Sparkles size={14} />
                Personal and household finance
              </div>
              <h2 className="max-w-2xl text-[2.55rem] font-semibold leading-[1.03] sm:text-6xl lg:text-[4.6rem]">
                Uang lebih rapi, keputusan lebih ringan.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
                Pantau saldo, transaksi, anggaran, dan target keluarga dalam tampilan yang tenang tapi tetap cepat dibaca.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                {["Saldo real time", "Budget aktif", "Target tabungan"].map((item) => (
                  <span key={item} className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm text-white/78">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="hero-preview hidden lg:block">
              <div className="preview-topbar">
                <span />
                <span />
                <span />
              </div>
              <div className="preview-balance">
                <p>Total saldo</p>
                <strong>Rp 24,8 jt</strong>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <PreviewMetric label="Masuk" value="+18%" />
                  <PreviewMetric label="Keluar" value="-7%" />
                </div>
              </div>
              <div className="preview-chart">
                <div className="chart-bars">
                  {[42, 68, 54, 82, 61, 92, 74].map((height, index) => (
                    <span key={index} style={{ height: `${height}%` }} />
                  ))}
                </div>
                <div className="chart-donut">
                  <PieChart size={56} />
                </div>
              </div>
              <div className="preview-list">
                <PreviewRow tone="bg-brand" title="Gaji" value="+ Rp 8,5 jt" />
                <PreviewRow tone="bg-coral" title="Belanja" value="- Rp 420 rb" />
                <PreviewRow tone="bg-saffron" title="Target liburan" value="72%" />
              </div>
            </div>
          </div>

          <div className="relative z-10 grid gap-3 pb-2 text-sm text-white/75 sm:grid-cols-3">
            {[
              ["Cepat", "Catat transaksi tanpa banyak langkah"],
              ["Jelas", "Ringkasan finansial mudah dipindai"],
              ["Bersama", "Siap untuk mode keluarga"],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-lg border border-white/12 bg-white/7 p-4 backdrop-blur">
                <p className="font-semibold text-white">{title}</p>
                <p className="mt-1 text-xs leading-5 text-white/58">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-7">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-2 text-xs font-semibold text-brand">
                <BadgeCheck size={15} />
                Siap dipakai di desktop dan mobile
              </div>
              <p className="text-sm font-medium text-muted">Selamat datang</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
                {mode === "login" ? "Masuk dan lanjutkan ritme finansialmu" : "Mulai ruang finansial barumu"}
              </h2>
            </div>

            <div className="mb-6 grid grid-cols-2 rounded-lg border border-line bg-white p-1 shadow-[0_10px_28px_rgba(23,32,51,0.05)]">
              <button
                type="button"
                className={`rounded-md px-4 py-2.5 text-sm font-medium transition ${mode === "login" ? "bg-ink text-white shadow-sm" : "text-muted hover:text-ink"}`}
                onClick={() => setMode("login")}
              >
                Masuk
              </button>
              <button
                type="button"
                className={`rounded-md px-4 py-2.5 text-sm font-medium transition ${mode === "register" ? "bg-ink text-white shadow-sm" : "text-muted hover:text-ink"}`}
                onClick={() => setMode("register")}
              >
                Daftar
              </button>
            </div>

            <form className="space-y-4" onSubmit={submit}>
              {mode === "register" && (
                <Field icon={<UserRound size={18} />} label="Nama lengkap">
                  <input
                    className="field-input"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="Nama kamu"
                    required
                  />
                </Field>
              )}

              <Field icon={<Mail size={18} />} label="Email">
                <input
                  className="field-input"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="nama@email.com"
                  required
                />
              </Field>

              <Field icon={<Lock size={18} />} label="Password">
                <div className="flex h-full min-w-0 flex-1 items-center">
                  <input
                    className="field-input"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    placeholder="Minimal 6 karakter"
                    required
                  />
                  <button
                    type="button"
                    className="mr-3 grid h-8 w-8 place-items-center rounded-md text-muted transition hover:bg-canvas hover:text-ink"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Tampilkan password"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </Field>

              {message && <p className="rounded-lg bg-coral/10 px-4 py-3 text-sm text-coral">{message}</p>}

              <button className="group flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand font-semibold text-white shadow-soft transition hover:bg-[#18745F]" disabled={loading}>
                {loading ? "Memproses..." : mode === "login" ? "Masuk" : "Buat akun"}
                {!loading && <ArrowUpRight size={17} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

function PreviewMetric({ label, value }) {
  return (
    <div className="rounded-lg bg-white/9 p-3">
      <p className="text-xs text-white/50">{label}</p>
      <strong className="mt-1 block text-lg">{value}</strong>
    </div>
  );
}

function PreviewRow({ tone, title, value }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${tone}`} />
        <span>{title}</span>
      </div>
      <strong>{value}</strong>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink">{label}</span>
      <div className="flex h-12 items-center rounded-lg border border-line bg-white text-muted shadow-[0_8px_22px_rgba(23,32,51,0.04)] transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
        <span className="ml-3">{icon}</span>
        {children}
      </div>
    </label>
  );
}
