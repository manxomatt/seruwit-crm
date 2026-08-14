# Desain: Central Admin — Platform Operator Panel

> **Tujuan dokumen:** Mendefinisikan scope, struktur, dan kebutuhan fitur panel admin central secara lengkap. Panel ini eksklusif untuk tim operator SaaS — bukan untuk tenant. Fokusnya sempit: **mengelola workspace tenant dan menjual langganan**.

---

## 1. Prinsip Dasar

| Prinsip | Penjelasan |
|---------|-----------|
| **Hanya satu domain** | Semua fungsi central berjalan di domain root (misal `seruwit.com`), bukan di subdomain tenant. |
| **Tidak ada modul tenant** | Central tidak menginstall modul bisnis (Akuntansi, Penjualan, Logistik, dst.) — modul itu milik tenant. |
| **Bisnis proses tunggal** | Satu alur kerja inti: prospek → trial → order berlangganan → konfirmasi pembayaran → workspace aktif. |
| **Tim kecil** | Panel ini digunakan oleh tim internal operator (super admin, CS, finance) — bukan ribuan pengguna. |

---

## 2. Audit: Kondisi Saat Ini

### 2.1 Yang Sudah Ada (Berfungsi)

| Fitur | Route | Grup Sidebar | Status |
|-------|-------|-------------|--------|
| Tenant Management | `/module/tenants` | Platform | ✅ Lengkap |
| Plans (paket langganan) | `/module/plans` | Platform | ✅ Lengkap |
| Payment Orders (verifikasi transfer) | `/module/payment-orders` | Finance | ✅ Lengkap |
| Module Registry (kill switch) | `/module/registry` | Platform | ✅ Ada |
| Settings (struktur + nilai) | `/module/settings` | Administration | ✅ Ada |
| Users (admin team) | `/module/users` | Administration | ✅ Ada |
| Roles | `/module/roles` | Administration | ✅ Ada |
| Media Library | `/module/media` | Content | ✅ Ada |
| Pages (CMS statis) | `/module/pages` | Content | ✅ Ada |
| Posts / Blog | `/module/posts` | Content | ✅ Ada |
| Analytics | `/module/analytics` | Administration | ✅ Ada |
| Dashboard | `/module/dashboard` | — | ⚠️ Generik (sama dengan tenant) |
| Notifikasi (bell) | shared prop | — | ✅ Ada |
| Profil | `/module/profile` | — | ✅ Ada |

### 2.2 Masalah yang Ditemukan

#### A. Dashboard generik
Dashboard saat ini (`Module/Dashboard.tsx`) menampilkan statistik logistik tenant. Central admin tidak punya konteks tenant — dashboard harus menampilkan metrik SaaS (MRR, tenant aktif, trial yang segera berakhir, pembayaran pending).

#### B. Sidebar menampilkan grup modul tenant
Grup `finance` di sidebar saat ini daftar: `accounting, invoicing, receivables, payables, billing` — semua modul tenant. Saat diakses dari central domain, item-item ini tidak muncul (karena tidak ada permission), tapi **grup label "Finance" tetap muncul** jika ada item lain. Ini membingungkan karena konsep finance pada central berbeda dengan finance pada tenant.

#### C. Module installer di Tenant Show
Halaman `/module/tenants/{id}` menampilkan panel "Install Modul" yang memungkinkan admin central menginstall modul ke tenant. Ini masih relevan secara operasional (admin membantu onboarding tenant), tapi perlu dibatasi agar hanya modul yang di-entitle oleh plan tenant yang bisa diinstall (bukan semua modul terdaftar).

#### D. Tidak ada dashboard SaaS / laporan pendapatan
Tidak ada halaman yang menampilkan:
- MRR / ARR
- Jumlah trial aktif dan konversi
- Grafik pendapatan per periode
- Tenant yang akan expired

#### E. Reseller tidak punya halaman sendiri
Reseller diidentifikasi via `reseller_global_id` di tabel tenants, tapi tidak ada halaman manajemen reseller — hanya terlihat via filter di daftar tenant.

#### F. Tidak ada audit log admin
Tidak ada pencatatan aksi admin: siapa yang mengkonfirmasi payment order mana, siapa yang suspend tenant, dll.

---

## 3. Struktur Target: 4 Grup Navigasi

```
CENTRAL ADMIN PANEL
│
├── [Dashboard] — Ringkasan platform SaaS
│
├── FINANCE
│   ├── Payment Orders        — verifikasi transfer manual
│   ├── Pendapatan            — laporan MRR/ARR, revenue per plan ← BELUM ADA
│   └── Reseller Commission   — komisi per reseller              ← BELUM ADA
│
├── CONTENT
│   ├── Pages                 — landing page, legal, FAQ
│   ├── Posts                 — blog marketing
│   └── Media                 — asset gambar/video
│
├── PLATFORM
│   ├── Tenants               — daftar workspace, status, suspend
│   ├── Plans                 — paket langganan & modul yang disertakan
│   ├── Resellers             — mitra penjualan                  ← BELUM ADA
│   └── Module Registry       — enable/disable modul global
│
└── ADMINISTRATION
    ├── Users                 — akun tim internal operator
    ├── Roles                 — hak akses tim
    ├── Settings              — konfigurasi platform (tampilan, mail, dll.)
    └── Analytics             — traffic & penggunaan (central domain)
```

---

## 4. Detail per Grup

### 4.1 Finance

Fokus: pendapatan dari langganan. Semua data dari tabel central (`payment_orders`, `subscriptions`, `plans`).

#### 4.1.1 Payment Orders (Sudah Ada — Perlu Minor Enhancement)

**Fungsi saat ini:**
- Daftar semua order pembayaran (pending, awaiting_confirmation, confirmed, rejected)
- Detail order: bukti transfer, nominal, kode unik
- Aksi: konfirmasi / tolak

**Yang masih kurang:**
- Filter by status, plan, dan rentang tanggal
- Export ke CSV
- Riwayat aksi (confirmed by siapa, kapan)

**Tabel acuan:** `payment_orders`, `subscriptions`, `tenants`, `plans`

#### 4.1.2 Laporan Pendapatan (Belum Ada)

**Metrik yang harus ditampilkan:**

| Metrik | Definisi | Sumber Data |
|--------|----------|-------------|
| MRR (Monthly Recurring Revenue) | Total nilai langganan aktif yang disetarakan per bulan | `subscriptions.status=active` JOIN `plans.price` |
| ARR | MRR × 12 | Derived |
| Jumlah tenant aktif | Tenant dengan `subscriptions.status=active` | `subscriptions` |
| Trial aktif | Tenant dengan `trial_ends_at > now()` | `tenants` |
| Konversi trial → berbayar | Trial yang berakhir dengan subscription confirmed | `subscriptions` + `tenants.trial_ends_at` |
| Revenue per periode | Total `payment_orders.amount` confirmed, dikelompokkan per bulan | `payment_orders` |
| Revenue per plan | Grouped by `plans.name` | `payment_orders JOIN plans` |
| Churn | Subscription cancelled dalam 30/60/90 hari | `subscriptions.status=cancelled` |

**Desain halaman:** Grafik bar (revenue per bulan), kartu metrik utama (MRR, tenant aktif, trial, churn rate), tabel rincian per plan.

**Route:** `GET /module/finance/revenue` → `module.finance.revenue`

**Gate:** `can:manage-tenants`

#### 4.1.3 Reseller Commission (Belum Ada)

**Fungsi:**
- Daftar reseller (user dengan role `reseller`)
- Jumlah tenant yang mereka onboard
- Total nilai langganan dari tenant mereka (basis komisi)
- Export laporan komisi per periode

**Tabel acuan:** `tenants.reseller_global_id`, `subscriptions`, `users`

**Route:** `GET /module/finance/resellers` → `module.finance.resellers`

---

### 4.2 Content

Fokus: marketing website operator (bukan tenant). Semua modul ini sudah ada tapi perlu dipastikan hanya tampil di central.

#### 4.2.1 Pages (Sudah Ada)

CMS untuk halaman statis: landing page, halaman harga (pricing), syarat & ketentuan, kebijakan privasi, FAQ, halaman kontak.

**Status:** Sudah berfungsi via `PagesModule`. Di central domain, route `/module/pages/*` tersedia.

**Yang perlu dikonfirmasi:** Pages yang dibuat di central domain **tidak boleh terlihat di tenant** dan sebaliknya (isolasi via context tenancy sudah ada).

#### 4.2.2 Posts / Blog (Sudah Ada)

Blog marketing untuk: studi kasus, update fitur, panduan penggunaan, artikel SEO.

**Status:** Sudah berfungsi via `PostsModule`.

#### 4.2.3 Media (Sudah Ada)

Library gambar, ikon, screenshot produk untuk digunakan di Pages dan Posts.

**Status:** Sudah berfungsi. Pastikan `media` pada central terisolasi dari media tenant.

---

### 4.3 Platform

Fokus: kontrol terhadap semua workspace dan konfigurasi platform-wide.

#### 4.3.1 Tenants (Sudah Ada — Perlu Enhancement)

**Fungsi saat ini:**
- Daftar tenant dengan status, domain, jumlah member
- ✅ Kolom subscription plan (baru ditambahkan)
- Buat tenant baru
- Suspend / aktifkan tenant
- Lihat detail tenant (member, modul terinstall)
- Install / uninstall modul ke tenant

**Yang masih kurang:**
- Filter: by status, plan, reseller, tanggal dibuat
- Search by nama/domain
- Bulk actions (suspend beberapa tenant)
- Tampilkan `trial_ends_at` di daftar
- Badge "Trial" / "Expired" di samping status

#### 4.3.2 Plans (Sudah Ada)

Mendefinisikan paket langganan: nama, harga, billing interval, modul yang disertakan.

**Status:** Sudah berfungsi. Halaman `/module/plans`.

**Yang masih kurang:**
- Halaman edit plan yang lebih detail (checklist modul yang disertakan)
- Preview berapa tenant yang terdampak bila plan diubah

#### 4.3.3 Resellers (Belum Ada)

**Fungsi:**
- Daftar user dengan role `reseller`
- Promote user biasa menjadi reseller
- Lihat tenant yang dimiliki tiap reseller
- Set komisi rate per reseller (basis untuk laporan komisi)

**Model yang dibutuhkan:** Tidak perlu tabel baru — cukup user dengan role `reseller` + atribut tambahan (commission_rate) di `users` table atau tabel `reseller_profiles`.

**Route:** `GET /module/platform/resellers` → `module.platform.resellers`

#### 4.3.4 Module Registry (Sudah Ada)

Kill switch global untuk mengaktifkan/menonaktifkan modul di semua tenant sekaligus.

**Status:** Sudah berfungsi. Halaman `/module/registry`.

---

### 4.4 Administration

Fokus: manajemen tim internal operator dan konfigurasi sistem.

#### 4.4.1 Users (Sudah Ada)

Akun tim operator (super admin, CS, finance). Berbeda dengan users di dalam workspace tenant.

**Perhatian:** Pada central domain, `User` yang dikelola adalah `CentralUser` (tabel `users` di schema public). Pastikan controller users menampilkan central users, bukan tenant users.

#### 4.4.2 Roles (Sudah Ada)

Role untuk tim operator: `super_admin`, `finance_admin`, `customer_support`, `content_editor`.

**Status:** Sudah ada infrastruktur roles.

**Yang masih kurang:** Role seeder untuk central admin team (berbeda dari role di dalam workspace tenant).

#### 4.4.3 Settings (Sudah Ada)

Konfigurasi platform: nama SaaS, logo, warna brand, konfigurasi email (SMTP), konfigurasi regional.

**Status:** Sudah berfungsi. Admin central bisa buat/edit/hapus setting definition (route `settings.create/edit/destroy` hanya ada di central domain).

#### 4.4.4 Analytics (Sudah Ada)

Traffic dan penggunaan domain central.

**Status:** Sudah ada rute `/module/analytics`.

---

## 5. Dashboard Central (Perlu Didesain Ulang)

Dashboard yang ada saat ini generik untuk tenant. Central admin butuh dashboard yang berbeda:

### Kartu Metrik Utama (baris atas)

| Kartu | Nilai | Trend |
|-------|-------|-------|
| Tenant Aktif | jumlah subscription active | vs bulan lalu |
| MRR | total recurring revenue | vs bulan lalu |
| Trial Aktif | jumlah trial yang berjalan | - |
| Pembayaran Pending | payment_orders awaiting | urgen |

### Widget Tengah

1. **Grafik Revenue (12 bulan)** — bar chart payment_orders confirmed per bulan
2. **Trial yang segera berakhir** — tabel tenant dengan `trial_ends_at` dalam 7 hari
3. **Payment Orders terbaru** — 5 order terakhir yang butuh konfirmasi

### Widget Bawah

4. **Distribusi Tenant per Plan** — pie chart atau tabel
5. **Tenant baru (30 hari terakhir)** — tabel singkat

---

## 6. Navigasi: Perubahan yang Dibutuhkan

### 6.1 Sidebar Central vs Tenant

Saat ini sidebar menggunakan `MENU_GROUPS` yang sama untuk central dan tenant. Perlu pemisahan logika:

```
// ModuleLayout.tsx — Saat ini
const MENU_GROUPS = [
  { titleKey: 'finance', modules: ['accounting', 'invoicing', 'receivables', 'payables', 'billing'] },
  // ...
];

// Target: grup finance berbeda di central
// Central → finance: ['payment-orders', 'finance-revenue', 'finance-resellers']
// Tenant  → finance: ['accounting', 'invoicing', 'receivables', 'payables', 'billing']
```

### 6.2 Grup Sidebar Target (Central)

```
FINANCE      → payment-orders | finance-revenue | finance-resellers
CONTENT      → pages | posts | media
PLATFORM     → tenants | plans | platform-resellers | module-registry
ADMINISTRATION → users | roles | settings | analytics
```

### 6.3 Grup Sidebar Tidak Berubah (Tenant)

Tidak ada perubahan pada navigasi tenant.

---

## 7. Akses & Permission

### 7.1 Role yang Dibutuhkan di Central

| Role | Akses |
|------|-------|
| `super_admin` | Semua fitur central |
| `finance_admin` | Payment Orders, Laporan Pendapatan, Komisi Reseller |
| `customer_support` | Tenants (read-only + suspend), Notifikasi |
| `content_editor` | Pages, Posts, Media |
| `reseller` | Hanya workspace miliknya (bukan panel admin) |

### 7.2 Gate yang Digunakan

| Gate | Scope |
|------|-------|
| `manage-tenants` | Semua halaman Platform |
| `manage-plans` | Plans |
| `manage-settings` | Settings structure |
| `manage-module-registry` | Module Registry |
| `manage-finance` (baru) | Laporan Pendapatan, Komisi |

---

## 8. Fitur yang Belum Ada — Backlog Terurut

| Prioritas | Fitur | Estimasi Kompleksitas | Keterangan |
|-----------|-------|----------------------|-----------|
| 🔴 Tinggi | Dashboard SaaS (metrik & widgets) | Sedang | Gantikan dashboard generik |
| 🔴 Tinggi | Filter & search di Tenant list | Rendah | UX penting untuk CS |
| 🟡 Sedang | Laporan Pendapatan (revenue report) | Sedang | Kebutuhan finance |
| 🟡 Sedang | Trial expiry alerts di dashboard | Rendah | Cegah churn |
| 🟡 Sedang | Export payment orders ke CSV | Rendah | Kebutuhan rekonsiliasi |
| 🟠 Normal | Reseller Management UI | Sedang | Saat ini hanya filter di tenant list |
| 🟠 Normal | Komisi Reseller Report | Sedang | Basis tagihan ke reseller |
| 🟠 Normal | Audit log aksi admin | Tinggi | Kebutuhan governance |
| 🟢 Rendah | Central dashboard role-specific | Tinggi | CS, Finance lihat dashboard berbeda |
| 🟢 Rendah | Email template management | Tinggi | Template notifikasi ke tenant |

---

## 9. Batasan yang Harus Diterapkan

### 9.1 Central TIDAK Boleh

- ❌ Mengakses data dalam workspace tenant (tidak ada impersonasi langsung tanpa log)
- ❌ Menampilkan modul tenant (Akuntansi, Penjualan, dll.) di sidebar central
- ❌ Membuat/mengedit data bisnis tenant (invoice, order, stok)

### 9.2 Central BOLEH

- ✅ Melihat metadata tenant (nama, domain, status, plan, jumlah user)
- ✅ Suspend / aktifkan workspace
- ✅ Mengkonfirmasi pembayaran
- ✅ Install modul ke workspace tenant (sebagai tindakan provisioning)
- ✅ Impersonasi (masuk ke workspace sebagai admin tenant) — untuk support, dengan log

---

## 10. Referensi Kode

| File | Peran |
|------|-------|
| `routes/web.php` | Semua route central domain |
| `routes/app.php` | Route bersama (module.*), diload oleh `web.php` saat `CENTRAL_SERVES_APP=true` |
| `app/Http/Controllers/Module/TenantController.php` | CRUD tenant |
| `app/Http/Controllers/Module/PaymentOrderController.php` | Verifikasi pembayaran |
| `app/Http/Controllers/Module/PlanController.php` | CRUD plans |
| `app/Http/Controllers/Module/ModuleRegistryController.php` | Kill switch modul |
| `resources/js/Layouts/ModuleLayout.tsx` | Sidebar — logika `isCentral` di baris 571 |
| `resources/js/Pages/Module/Tenants/` | Halaman tenant management |
| `resources/js/Pages/Module/Plans/` | Halaman plans |
| `resources/js/Pages/Admin/PaymentOrders/` | Halaman payment orders |
| `app/Models/Subscription.php` | Model langganan (central connection) |
| `app/Models/PaymentOrder.php` | Model order pembayaran |
| `app/Services/PaymentOrderService.php` | Logika konfirmasi → aktivasi subscription |
| `app/Jobs/PostSaasRevenueJob.php` | Posting jurnal akuntansi setelah konfirmasi |
