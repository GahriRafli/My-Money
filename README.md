# My Money

Versi baru sedang dimigrasikan ke **Next.js + React + Tailwind CSS + Supabase**. File vanilla lama masih disimpan sebagai referensi migrasi.

## Jalankan Versi Next.js

1. Install dependency:

```bash
npm install
```

2. Buat file `.env.local` dari contoh:

```bash
cp .env.local.example .env.local
```

3. Isi:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

4. Jalankan:

```bash
npm run dev
```

Lalu buka `http://localhost:3000`.

> Jangan pernah menaruh service role key di frontend atau `.env.local` yang diawali `NEXT_PUBLIC_`.

---

Aplikasi manajemen keuangan pribadi berbasis web — sekompleks Money Lover — dibangun dengan **Vanilla JS + Supabase**.

---

## 🚀 Cara Setup (10 menit)

### 1. Buat Project Supabase

1. Daftar / login di [supabase.com](https://supabase.com)
2. Klik **New Project**, isi nama dan database password
3. Tunggu project selesai dibuat (~1 menit)

### 2. Jalankan SQL Schema

1. Di dashboard Supabase, buka **SQL Editor**
2. Copy isi file `supabase-schema.sql`
3. Paste dan klik **Run**
4. Semua tabel, trigger, dan data default kategori akan dibuat otomatis

### 3. Isi Konfigurasi

Buka `js/supabase.js`, ganti 2 baris ini:

```js
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';   // ← dari Settings → API
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';                  // ← anon key
```

Kedua nilai ada di: **Supabase Dashboard → Settings → API**

### 4. Jalankan

Cukup buka `index.html` di browser, atau pakai server lokal:

```bash
# Python
python3 -m http.server 8080

# Node.js (npx)
npx serve .

# VS Code → Live Server extension
```

---

## ✨ Fitur

| Fitur | Keterangan |
|---|---|
| 🔐 Auth | Register & login dengan email/password |
| 💵 Multi-Wallet | Tunai, Bank, E-Wallet, Investasi, Tabungan |
| 📋 Transaksi | Catat pemasukan, pengeluaran, transfer antar dompet |
| 🏷️ Kategori | 20+ kategori default + buat kategori sendiri |
| 🔄 Berulang | Tagihan/gaji berulang (harian/mingguan/bulanan/tahunan) |
| 🎯 Anggaran | Budget per kategori dengan alert % |
| 🏆 Target Tabungan | Savings goals dengan deadline & progress bar |
| 📊 Laporan | Donut chart, bar chart harian, breakdown per kategori |
| ⌨️ Shortcuts | N=Pengeluaran, I=Pemasukan, T=Transfer, 1-4=Navigasi, Esc=Tutup |

---

## 🗂 Struktur File

```
mymoney/
├── index.html              # App shell (auth + semua halaman + semua modal)
├── supabase-schema.sql     # Schema lengkap — jalankan di Supabase SQL Editor
├── css/
│   └── style.css           # Design system lengkap (white UI)
└── js/
    ├── supabase.js         # Supabase client + semua DB helpers
    ├── app.js              # State global, routing, utilities, format
    ├── pages.js            # Render semua halaman (dashboard, transaksi, dll)
    ├── modals.js           # Semua modal: add/edit transaksi, wallet, budget, dll
    └── main.js             # Auth flow, bootstrap, keyboard shortcuts
```

---

## 🗄 Database Tables

| Tabel | Fungsi |
|---|---|
| `profiles` | Profil user (extends auth.users) |
| `wallets` | Dompet user (saldo otomatis update via trigger) |
| `categories` | Kategori (system default + custom user) |
| `transactions` | Semua transaksi (trigger otomatis update saldo wallet) |
| `budgets` | Anggaran per kategori |
| `recurring_rules` | Tagihan/pemasukan berulang |
| `savings_goals` | Target tabungan |

> **Row Level Security (RLS)** aktif di semua tabel — data user terisolasi satu sama lain.

---

## 🔧 Kustomisasi

- **Mata uang**: Ganti di Settings → Preferensi (IDR/USD/SGD/MYR)
- **Tambah kategori**: Saat tambah transaksi → klik tombol "+ Baru"
- **Warna wallet**: Pilih dari 10 warna preset saat buat/edit dompet
