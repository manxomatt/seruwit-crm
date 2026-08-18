# Desain: Program Reseller & Komisi Berbasis Transaksi

> **Konteks:** Role `reseller` sudah ada dan sudah bisa membuat/mengelola tenant miliknya sendiri. Yang belum ada adalah **monetisasi**: reseller harus mendapat fee dari setiap transaksi berbayar tenant yang terafiliasi dengannya. Dokumen ini merancang mekanisme atribusi, perhitungan komisi, pencatatan ledger, pembayaran (payout), dan integrasi akuntansi.

---

## 1. State Saat Ini

| Aspek | Kondisi |
|-------|---------|
| Role `reseller` | Ada (`SystemRolePermissions`, seeded di central) |
| Atribusi tenant → reseller | Ada: `tenants.reseller_global_id` → `users.global_id`, di-set saat reseller membuat tenant (`CreateTenantAction`) |
| Scoping data | Ada: `TenantController` memfilter tenant milik reseller, gate `manage-tenants` |
| Sumber transaksi | `payment_orders` (central DB) — `amount` (harga plan) + `unique_code` = `total_amount` |
| Trigger uang masuk | `PaymentOrderService::confirm()` → `SubscriptionService::activate()` + `PostSaasRevenueJob` |
| Komisi | **Tidak ada** |
| Payout / rekening reseller | **Tidak ada** |
| Atribusi self-serve (tenant daftar sendiri lewat link reseller) | **Tidak ada** |

**Gap inti:** tidak ada objek yang mencatat "reseller X berhak Rp N dari pembayaran Y", tidak ada aturan tarif, dan tidak ada jalur pembayaran fee.

---

## 2. Prinsip Desain

1. **Satu sumber kebenaran transaksi.** Komisi hanya lahir dari `PaymentOrder` yang berstatus `confirmed`. Tidak ada jalur lain (tidak dari `subscriptions`, tidak dari tenant aktif), sehingga rekonsiliasi uang masuk ↔ komisi selalu 1:1.
2. **Ledger imutabel + snapshot.** Baris komisi menyimpan tarif, basis, dan reseller **hasil snapshot saat akrual**. Mengubah tarif atau memindahkan tenant ke reseller lain tidak boleh menulis ulang sejarah.
3. **Idempoten.** Unique index pada `payment_order_id` — job retry / double-confirm tidak menggandakan komisi. Pola ini sama dengan guard idempotensi di `PostSaasRevenueJob`.
4. **Akrual ≠ pembayaran.** Akrual (hak komisi muncul) dipisah dari payout (uang dikirim). Ini yang memungkinkan holding period, pembatalan, minimum payout, dan potong pajak.
5. **Perhitungan hanya di server.** Frontend tidak pernah mengirim nominal komisi; ia hanya menampilkan hasil.

---

## 3. Basis Perhitungan (Penting)

Komisi dihitung dari **`payment_orders.amount`**, *bukan* `total_amount`.

```
total_amount = amount (harga plan) + unique_code (kode unik 3 digit)
```

`unique_code` adalah artefak rekonsiliasi transfer, bukan pendapatan — `PostSaasRevenueJob` pun memposting `unique_code` ke akun `cash_variance`, terpisah dari `saas_revenue`. Menghitung komisi dari `total_amount` akan membuat komisi tidak pernah cocok dengan revenue di jurnal.

---

## 4. Model Domain

```
CentralUser (role: reseller)
   │ 1
   │
   ├──< ResellerProfile          (kode referral, rekening, status, tarif default)
   │
   ├──< ResellerCommissionRule   (tarif per plan / per event, berlaku sejak-sampai)
   │
   ├──< ResellerCommission        ◄── PaymentOrder (confirmed)   [LEDGER, imutabel]
   │         │
   │         └── payout_id ──► ResellerPayout  (batch pembayaran fee)
   │
   └──< Tenant (reseller_global_id)
```

---

## 5. Skema Database (semua di central DB)

### 5.1 `reseller_profiles`

Profil bisnis reseller. Dipisah dari `users` agar tabel user tetap bersih dan agar reseller punya identitas yang bisa di-suspend tanpa menyentuh akun login.

```sql
CREATE TABLE reseller_profiles (
    id                      BIGSERIAL PRIMARY KEY,
    reseller_global_id      UUID NOT NULL UNIQUE REFERENCES users(global_id) ON DELETE CASCADE,
    parent_global_id        UUID NULL REFERENCES users(global_id) ON DELETE SET NULL, -- reserved: multi-level
    referral_code           VARCHAR(32) NOT NULL UNIQUE,   -- dipakai di ?ref=CODE
    company_name            VARCHAR(255) NULL,
    status                  VARCHAR(20) NOT NULL DEFAULT 'active', -- active|suspended|terminated
    default_commission_type VARCHAR(10) NULL,   -- percent|flat  (null = ikut global default)
    default_commission_value NUMERIC(12,2) NULL,
    renewal_commission_value NUMERIC(12,2) NULL, -- null = sama dengan default
    payout_bank_name        VARCHAR(100) NULL,
    payout_account_number   VARCHAR(50) NULL,
    payout_account_name     VARCHAR(255) NULL,
    tax_id                  VARCHAR(30) NULL,    -- NPWP; menentukan tarif potong PPh
    minimum_payout          NUMERIC(12,2) NOT NULL DEFAULT 0,
    notes                   TEXT NULL,
    created_at TIMESTAMP, updated_at TIMESTAMP
);
```

### 5.2 `reseller_commission_rules`

Aturan tarif berlapis. Baris dengan `reseller_global_id = NULL` berarti aturan global platform.

```sql
CREATE TABLE reseller_commission_rules (
    id                 BIGSERIAL PRIMARY KEY,
    reseller_global_id UUID NULL REFERENCES users(global_id) ON DELETE CASCADE,
    plan_id            BIGINT NULL REFERENCES plans(id) ON DELETE CASCADE,
    applies_to         VARCHAR(10) NOT NULL DEFAULT 'all',   -- first|renewal|all
    billing_interval   VARCHAR(10) NULL,                     -- month|annual|null(semua)
    type               VARCHAR(10) NOT NULL,                 -- percent|flat
    value              NUMERIC(12,2) NOT NULL,               -- 15.00 = 15% atau Rp15.000
    max_occurrences    SMALLINT NULL,   -- mis. 12 = komisi hanya 12 siklus pertama; null = seumur hidup
    starts_at          TIMESTAMP NULL,
    ends_at            TIMESTAMP NULL,
    priority           SMALLINT NOT NULL DEFAULT 0,
    is_active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP, updated_at TIMESTAMP
);
CREATE INDEX ON reseller_commission_rules (reseller_global_id, plan_id, applies_to, is_active);
```

**Urutan resolusi tarif** (ambil yang pertama cocok, `priority` DESC sebagai tie-break):

| # | Cakupan |
|---|---------|
| 1 | reseller + plan + `applies_to` spesifik + interval spesifik |
| 2 | reseller + plan + `applies_to` spesifik |
| 3 | reseller + plan (`all`) |
| 4 | reseller (semua plan) |
| 5 | `reseller_profiles.default_commission_*` |
| 6 | rule global (`reseller_global_id IS NULL`) untuk plan tsb. |
| 7 | `config('reseller.default_rate')` — fallback terakhir |

Rule yang `starts_at`/`ends_at`-nya tidak mencakup `confirmed_at` diabaikan.

### 5.3 `reseller_commissions` — ledger

```sql
CREATE TABLE reseller_commissions (
    id                  BIGSERIAL PRIMARY KEY,
    reseller_global_id  UUID NOT NULL REFERENCES users(global_id),
    tenant_id           VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    payment_order_id    BIGINT NOT NULL UNIQUE REFERENCES payment_orders(id) ON DELETE CASCADE,
    subscription_id     BIGINT NULL REFERENCES subscriptions(id) ON DELETE SET NULL,
    plan_id             BIGINT NULL REFERENCES plans(id) ON DELETE SET NULL,

    -- snapshot perhitungan (imutabel)
    event               VARCHAR(10) NOT NULL,      -- first|renewal
    base_amount         NUMERIC(12,2) NOT NULL,    -- = payment_orders.amount
    rule_id             BIGINT NULL REFERENCES reseller_commission_rules(id) ON DELETE SET NULL,
    rate_type           VARCHAR(10) NOT NULL,      -- percent|flat
    rate_value          NUMERIC(12,2) NOT NULL,
    commission_amount   NUMERIC(12,2) NOT NULL,
    tax_withheld_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    net_amount          NUMERIC(12,2) NOT NULL,    -- commission_amount - tax_withheld_amount
    currency            VARCHAR(3) NOT NULL DEFAULT 'IDR',
    occurrence          SMALLINT NOT NULL DEFAULT 1, -- siklus ke-berapa untuk tenant ini

    status              VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending|approved|paid|void
    hold_until          TIMESTAMP NULL,     -- akhir masa refund; sebelum ini tak boleh dibayar
    approved_at         TIMESTAMP NULL,
    payout_id           BIGINT NULL REFERENCES reseller_payouts(id) ON DELETE SET NULL,
    paid_at             TIMESTAMP NULL,
    voided_at           TIMESTAMP NULL,
    void_reason         TEXT NULL,
    created_at TIMESTAMP, updated_at TIMESTAMP
);
CREATE INDEX ON reseller_commissions (reseller_global_id, status);
CREATE INDEX ON reseller_commissions (tenant_id);
CREATE INDEX ON reseller_commissions (payout_id);
```

`payment_order_id UNIQUE` adalah kunci idempotensi seluruh sistem.

### 5.4 `reseller_payouts`

```sql
CREATE TABLE reseller_payouts (
    id                  BIGSERIAL PRIMARY KEY,
    reseller_global_id  UUID NOT NULL REFERENCES users(global_id),
    reference           VARCHAR(30) NOT NULL UNIQUE,   -- PAY-2026-08-0001
    period_start        DATE NOT NULL,
    period_end          DATE NOT NULL,
    gross_amount        NUMERIC(12,2) NOT NULL,
    tax_withheld_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    net_amount          NUMERIC(12,2) NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'IDR',
    status              VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft|approved|paid|cancelled
    -- snapshot rekening saat payout dibuat
    bank_name           VARCHAR(100) NULL,
    account_number      VARCHAR(50) NULL,
    account_name        VARCHAR(255) NULL,
    transfer_proof_path VARCHAR(255) NULL,
    approved_by         BIGINT NULL REFERENCES users(id),
    approved_at         TIMESTAMP NULL,
    paid_by             BIGINT NULL REFERENCES users(id),
    paid_at             TIMESTAMP NULL,
    notes               TEXT NULL,
    created_at TIMESTAMP, updated_at TIMESTAMP
);
```

Tidak perlu tabel pivot: relasi payout → komisi cukup lewat `reseller_commissions.payout_id` (satu komisi hanya bisa masuk satu payout).

### 5.5 Perubahan tabel yang sudah ada

```sql
ALTER TABLE tenants
    ADD COLUMN reseller_attributed_at      TIMESTAMP NULL,
    ADD COLUMN reseller_attribution_ends_at TIMESTAMP NULL;  -- null = seumur hidup
```

`reseller_global_id` sudah ada. Dua kolom baru ini memungkinkan kebijakan "atribusi berlaku 24 bulan" tanpa menghapus relasi historis. Keduanya perlu didaftarkan di `Tenant::getCustomColumns()`.

---

## 6. Alur End-to-End

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ AKUISISI                                                                     │
│                                                                              │
│  (a) Reseller buat tenant  ──► CreateTenantAction(resellerGlobalId)          │
│  (b) Prospek klik https://app.test/register?ref=SRW-A7F3                     │
│         └─► cookie `reseller_ref` (30 hari) ─► RegisterController            │
│                └─► tenants.reseller_global_id + reseller_attributed_at       │
└──────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ TRANSAKSI                                                                    │
│                                                                              │
│  Tenant bayar ─► PaymentOrder(pending) ─► upload bukti ─► admin konfirmasi   │
│                                                                              │
│  PaymentOrderService::confirm()                                              │
│      ├─ PaymentOrder → confirmed                                             │
│      ├─ SubscriptionService::activate()                                      │
│      └─ event(new PaymentOrderConfirmed($order))                             │
│              ├─► PostSaasRevenueJob            (existing)                    │
│              └─► AccrueResellerCommissionJob   (baru)                        │
└──────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ AKRUAL                                                                       │
│                                                                              │
│  Tenant punya reseller? ─ tidak ─► selesai (tanpa baris ledger)              │
│         │ ya                                                                 │
│         ├─ atribusi masih berlaku? occurrence ≤ max_occurrences?             │
│         ├─ ResellerCommissionResolver::resolve(order) → rule + tarif         │
│         └─ ResellerCommission(pending, hold_until = confirmed_at + 7 hari)   │
└──────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ PAYOUT                                                                       │
│                                                                              │
│  Cron harian: hold_until lewat & tak ada refund ─► status: approved          │
│  Admin: Buat batch payout (pilih reseller + periode)                         │
│         ├─ ambil semua komisi `approved` milik reseller pada periode         │
│         ├─ hitung potong pajak, cek minimum_payout                           │
│         └─ ResellerPayout(draft) ─► approved ─► transfer ─► upload bukti     │
│                                          └─► komisi → paid, paid_at terisi   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. State Machine Komisi

```
                 ┌──────────────────────────────┐
   akrual ─────► │ pending  (dalam masa hold)   │
                 └───────┬──────────────┬───────┘
             hold lewat  │              │  refund / order dibatalkan / fraud
                         ▼              ▼
                 ┌───────────────┐  ┌──────────┐
                 │   approved    │  │   void   │ (terminal)
                 └───────┬───────┘  └──────────┘
             masuk payout│                ▲
                         ▼                │ clawback (payout belum dibayar)
                 ┌───────────────┐        │
                 │     paid      │────────┘
                 └───────────────┘
```

Aturan: komisi ber-`payout_id` yang payout-nya `paid` **tidak boleh** di-void; kompensasinya lewat baris koreksi negatif (`base_amount` negatif, `void_reason` berisi referensi) agar ledger tetap append-only.

---

## 8. Struktur Kode

Semuanya di control plane (central), sejajar dengan layanan billing yang sudah ada.

```
app/
├── Models/
│   ├── ResellerProfile.php
│   ├── ResellerCommission.php
│   ├── ResellerCommissionRule.php
│   └── ResellerPayout.php          ← semua pakai getConnectionName() = central
├── Events/
│   └── PaymentOrderConfirmed.php   ← event baru
├── Jobs/
│   ├── AccrueResellerCommissionJob.php
│   └── PostResellerCommissionJob.php   (akuntansi, fase 3)
├── Services/
│   ├── ResellerCommissionResolver.php  ← resolusi tarif (pure, mudah dites)
│   ├── ResellerCommissionService.php   ← accrue / void / approveMatured
│   └── ResellerPayoutService.php       ← buildDraft / approve / markPaid
├── Support/
│   └── ResellerAttribution.php     ← cookie ref, validasi kode, masa berlaku
├── Http/Controllers/
│   ├── Reseller/DashboardController.php
│   ├── Reseller/CommissionController.php
│   ├── Reseller/PayoutController.php
│   └── Admin/ResellerController.php, Admin/ResellerPayoutController.php
config/reseller.php
```

**Refactor kecil yang perlu:** `PaymentOrderService::confirm()` saat ini memanggil `PostSaasRevenueJob::dispatch()` langsung. Ganti menjadi `event(new PaymentOrderConfirmed($order))` dengan dua listener. Alasannya bukan estetika — akrual komisi harus berjalan setelah commit transaksi dan tidak boleh menggagalkan konfirmasi pembayaran kalau ada bug di perhitungan komisi.

Sketsa resolver:

```php
public function resolve(PaymentOrder $order, Tenant $tenant): ?CommissionQuote
{
    $reseller = $tenant->reseller;                       // null → tanpa komisi
    $profile  = $reseller?->resellerProfile;

    if (! $profile || $profile->status === 'terminated') {
        return null;
    }

    if ($tenant->reseller_attribution_ends_at?->isPast()) {
        return null;                                      // masa atribusi habis
    }

    $event      = $order->type === 'renew' ? 'renewal' : 'first';
    $occurrence = ResellerCommission::query()
        ->where('tenant_id', $tenant->id)
        ->whereIn('status', ['pending', 'approved', 'paid'])
        ->count() + 1;

    $rule = $this->findRule($profile, $order, $event);    // tabel presedensi §5.2
    if ($rule?->max_occurrences && $occurrence > $rule->max_occurrences) {
        return null;
    }

    $base   = round((float) $order->amount, 2);           // bukan total_amount
    $amount = $rule->type === 'percent'
        ? round($base * $rule->value / 100, 2)
        : min((float) $rule->value, $base);               // flat tak boleh > basis

    return new CommissionQuote($rule, $event, $occurrence, $base, $amount);
}
```

---

## 9. Atribusi & Kode Referral

| Kasus | Perilaku |
|-------|----------|
| Reseller membuat tenant dari panel | `reseller_global_id` di-set langsung (sudah berjalan) |
| Prospek daftar via `?ref=KODE` | Middleware menyimpan cookie `reseller_ref` 30 hari; dipakai saat tenant dibuat |
| Kode tidak valid / reseller suspended | Cookie diabaikan diam-diam; tenant jadi milik platform |
| Tenant sudah punya reseller | Kode referral baru **tidak** menimpa — first-touch menang |
| Admin memindahkan tenant antar reseller | Boleh, tapi hanya berlaku untuk komisi ke depan; baris ledger lama tak tersentuh |
| Reseller di-terminate | Akrual berhenti; komisi `approved` tetap dibayar sesuai kebijakan |

Kode referral: `SRW-` + 6 karakter base32 dari `global_id`, unik, bisa diganti admin.

---

## 10. Pajak & Ambang Payout

Fee reseller di Indonesia umumnya objek PPh 23 (2% ber-NPWP, 4% tanpa NPWP) untuk badan usaha, atau PPh 21 untuk orang pribadi. Desain tidak mengunci angka — taruh di config dan simpan hasil potongan pada baris ledger dan payout:

```php
// config/reseller.php
return [
    'default_rate'      => ['type' => 'percent', 'value' => 10],
    'renewal_rate'      => ['type' => 'percent', 'value' => 5],
    'hold_days'         => 7,
    'minimum_payout'    => 100_000,
    'attribution_months'=> null,   // null = seumur hidup
    'withholding'       => ['enabled' => true, 'with_npwp' => 2.0, 'without_npwp' => 4.0],
];
```

Komisi di bawah `minimum_payout` tetap `approved` dan otomatis ikut batch periode berikutnya sampai akumulasinya melewati ambang.

---

## 11. Integrasi Akuntansi

Mengikuti pola `PostSaasRevenueJob` (posting ke tenant operator, idempoten lewat `source_type` + `source_id` + `event`):

**Saat akrual** — `event: 'reseller.commission.accrued'`

```
Dr  reseller_commission_expense   commission_amount
Cr  reseller_commission_payable   net_amount
Cr  tax_withheld_payable          tax_withheld_amount
```

**Saat payout dibayar** — `event: 'reseller.payout.paid'`, `source_type: ResellerPayout::class`

```
Dr  reseller_commission_payable   net_amount
Cr  bank                          net_amount
```

Butuh tiga `system_role` akun baru di chart of accounts tenant operator: `reseller_commission_expense`, `reseller_commission_payable`, `tax_withheld_payable`. Kalau akun tidak ada, job hanya menulis log warning dan berhenti — persis perilaku `PostSaasRevenueJob` sekarang, sehingga ketiadaan modul Accounting tidak pernah memblokir bisnis.

---

## 12. Permission & Keamanan

Gate baru di `AppServiceProvider`:

```php
Gate::define('manage-resellers', fn (User $u) => $u->isAdmin());               // admin platform
Gate::define('view-reseller-earnings', fn (User $u) => $u->hasRole('reseller') || $u->isAdmin());
```

Aturan yang tidak boleh dilanggar:

- Setiap query di portal reseller **wajib** discope `where('reseller_global_id', $user->global_id)` — pola yang sudah dipakai `TenantController::scopedQuery()`.
- Reseller tidak boleh melihat data tenant milik reseller lain, tidak boleh melihat `reseller_commission_rules` milik orang lain, tidak boleh mengubah tarif atau status komisi apa pun.
- Nominal komisi tidak pernah datang dari request; hanya dari resolver.
- Perubahan rule dan status payout dicatat ke `TenantActivityLogger` / activity log admin.
- `reseller_profiles.payout_account_number` hanya tampil penuh bagi pemiliknya dan admin; di listing ditampilkan tersamar (`•••• 4821`).

---

## 13. UI

### Portal reseller (`/module/reseller/*`, domain central)

| Halaman | Isi |
|---------|-----|
| Dashboard | Kartu KPI: komisi bulan ini, saldo belum dibayar (`approved`), total dibayar, tenant aktif, conversion rate. Grafik 6 bulan. Link referral + tombol salin. |
| Komisi | Tabel ledger: tanggal, tenant, plan, jenis (aktivasi/perpanjang), basis, tarif, komisi, status, estimasi tanggal bayar. Filter status/periode, ekspor CSV. |
| Payout | Riwayat batch: referensi, periode, gross, potong pajak, net, status, bukti transfer. |
| Tenants | Halaman yang sudah ada, ditambah kolom status langganan & tanggal jatuh tempo. |

`dashboard_path` role reseller diubah dari `/module/tenants` → `/module/reseller/dashboard`, dan menu di `ModuleLayout.tsx` (blok `isReseller` yang sudah ada) ditambah entri Komisi & Payout.

### Panel admin

| Halaman | Isi |
|---------|-----|
| Resellers | Daftar reseller + jumlah tenant, komisi terutang, status. Detail: atur tarif khusus, rekening, suspend. |
| Aturan komisi | CRUD `reseller_commission_rules` global & per-reseller. |
| Antrean komisi | Komisi `pending`/`approved`, aksi void dengan alasan. |
| Payout | Buat batch, setujui, tandai dibayar + unggah bukti. |

---

## 14. Edge Case

| Kasus | Keputusan |
|-------|-----------|
| Tenant trial (belum bayar) | Tidak ada `PaymentOrder` → tidak ada komisi. Trial murni metrik akuisisi. |
| Order ditolak/kedaluwarsa | Tidak pernah `confirmed` → tidak ada akrual. |
| Refund setelah konfirmasi | `ResellerCommissionService::void()` bila masih `pending`/`approved`; kalau sudah `paid`, buat baris koreksi negatif. |
| Job dijalankan ulang | Ditolak unique index `payment_order_id`. |
| Reseller dihapus | `reseller_global_id` di ledger tetap (FK tanpa cascade ke ledger); UI menampilkan "reseller nonaktif". |
| Upgrade plan di tengah periode | Order baru bertipe `activate` → dihitung sebagai `first` untuk plan baru, `occurrence` tetap naik. |
| Tarif diubah admin | Hanya berlaku untuk order yang dikonfirmasi setelahnya — ledger menyimpan snapshot. |
| Flat fee > harga plan | Dibatasi `min(value, base)` agar komisi tak pernah melebihi uang yang masuk. |
| Multi-level (reseller merekrut reseller) | Di luar cakupan; kolom `parent_global_id` disiapkan agar penambahannya nanti tidak butuh migrasi struktur. |

---

## 15. Rencana Pengujian

Semua feature test, di `tests/Feature/Reseller/`, mengikuti pola `tests/Feature/Tenancy/ResellerTest.php`.

| File | Cakupan |
|------|---------|
| `CommissionAccrualTest` | Akrual terjadi saat confirm; basis = `amount` bukan `total_amount`; tenant tanpa reseller tidak menghasilkan baris; double-confirm hanya 1 baris; order ditolak tidak berkomisi; atribusi kedaluwarsa tidak berkomisi; `max_occurrences` terhormati. |
| `CommissionRuleResolutionTest` | Unit: seluruh 7 tingkat presedensi tarif, percent vs flat, flat dibatasi basis, rule kedaluwarsa diabaikan, tarif renewal berbeda dari first. |
| `CommissionLifecycleTest` | `pending` → `approved` setelah hold; void saat refund; komisi `paid` tak bisa di-void. |
| `PayoutTest` | Batch hanya mengambil `approved` milik reseller pada periode; minimum payout menahan batch; potong pajak dihitung dari NPWP; setelah `paid` komisi terkunci ke `payout_id`. |
| `ResellerPortalAccessTest` | Reseller hanya melihat komisi/payout miliknya (403/absen untuk milik orang lain); reseller tidak bisa mengubah tarif atau status; admin bisa. |
| `ReferralAttributionTest` | `?ref=` valid menempel ke tenant baru; kode invalid diabaikan; first-touch tidak tertimpa. |

---

## 16. Roadmap Implementasi

| Fase | Status | Lingkup | Hasil |
|------|--------|---------|-------|
| **1 — Ledger** | ✅ Selesai | Migrasi 4 tabel + 2 kolom, model, `config/reseller.php`, event `PaymentOrderConfirmed`, resolver + `AccrueResellerCommissionJob`, command `reseller:approve-commissions` | Komisi tercatat otomatis dari setiap pembayaran terkonfirmasi |
| **2 — Visibilitas** | ✅ Selesai | Portal reseller (dashboard, daftar komisi), admin: daftar reseller, detail + CRUD aturan, antrean komisi + void, `ResellerProfile` + kode referral | Reseller bisa melihat pendapatannya; admin bisa mengatur tarif |
| **3 — Payout** | ✅ Selesai | `ResellerPayoutService`, meja pembayaran admin (kandidat → draf → setujui → bayar + bukti transfer), riwayat payout reseller, notifikasi | Fee benar-benar terbayar dan terlacak |
| **4 — Integrasi** | Belum | `PostResellerCommissionJob` ke Accounting, potong pajak, ekspor CSV, atribusi `?ref=` self-serve | Pembukuan rapi & akuisisi mandiri |
| **5 — Opsional** | ⚙️ Sebagian | Tier volume ✅ dan halaman landing per reseller ✅ selesai; multi-level & kupon diskon milik reseller belum dikerjakan (di luar cakupan yang diminta) | Skala program |

### Catatan implementasi fase 5 (tier volume & landing page)

- **Tier volume** hanya menggantikan `config('reseller.default_rate')` — fallback paling akhir di rantai resolusi. Rule reseller/plan spesifik, default profil, dan rule platform tetap menang atas tier, persis seperti mereka menang atas tarif flat sebelumnya.
- Tier **sengaja tidak berlaku untuk perpanjangan** — ini insentif akuisisi (membawa pelanggan baru), bukan pengganda buku pelanggan yang sudah ada. Perpanjangan tetap memakai `renewal_rate` seperti biasa.
- "Jumlah tenant" dihitung dari tenant unik yang punya komisi *live* (pending/approved/paid) milik reseller tsb., dibaca **sebelum** baris komisi transaksi berjalan ditulis — sehingga tenant yang membuat hitungan menyentuh ambang batas tidak mendapat tarif barunya sendiri; tenant *berikutnya* yang mendapatkannya.
- **Halaman landing per reseller** (`/r/{kode_referral}`) sengaja hanya teks (headline, subheadline, teks CTA, hingga 4 poin unggulan) — tanpa unggah logo/gambar dan tanpa editor GrapesJS. Kontennya dikelola reseller sendiri lewat dashboard portalnya (`UpdateResellerLandingPageRequest`, gate `view-reseller-earnings`, discope ke identitas yang login), terpisah dari field sensitif (tarif/rekening) yang tetap admin-only.
- Halaman nonaktif, kosong headline, atau kode tidak dikenal semuanya me-render 404 yang sama — supaya tidak ada cara membedakan "kode tidak ada" dari "kode ada tapi dimatikan".
- CTA di halaman landing cukup tautan biasa ke `/register?ref={kode}` — atribusi referral (middleware `CaptureResellerReferral` dari fase 4) sudah menangkapnya tanpa perlu pengait tambahan.

### Catatan implementasi fase 1–2

- Tarif default platform hidup di `config/reseller.php`, bukan sebagai baris rule di database — presedensi #7 sudah menjadi fallback yang cukup, dan menyeed rule global hanya akan menduplikasi angka yang sama di dua tempat.
- Aplikasi ini tidak mengaktifkan event discovery di `bootstrap/app.php`, jadi listener `PostSaasRevenue` dan `AccrueResellerCommission` didaftarkan eksplisit di `AppServiceProvider`.
- Scope aturan komisi (reseller & paket) tidak bisa diubah lewat edit; controller membuangnya. Memindahkan aturan ke reseller lain diam-diam akan menulis ulang perjanjian yang sedang berjalan.
- Profil reseller dibuat saat pertama dibutuhkan (`ResellerProfile::ensureFor`) — memegang role sudah cukup untuk menjadi reseller, tanpa langkah pendaftaran terpisah. Nilai `status` dan `minimum_payout` diisi eksplisit, tidak mengandalkan default kolom: `firstOrCreate` mengembalikan model in-memory yang belum membawa default DB, dan status null terbaca sebagai "tidak aktif" di setiap pengecekan.

### Catatan implementasi fase 3

- Periode batch diukur pada `created_at` komisi (kapan fee **diperoleh**), bukan kapan hold-nya cair — sehingga satu batch adalah laporan atas bulan penjualan yang sebenarnya.
- Komisi dikunci `lockForUpdate()` saat batch dibentuk, supaya dua admin yang membuat batch bersamaan tidak bisa mengklaim baris yang sama.
- Total di bawah minimum tidak menghasilkan batch dan tidak menyentuh komisi apa pun — nilainya bergulir ke periode berikutnya. Minimum milik reseller menang atas default platform; nilai 0 berarti "ikut platform", bukan "tanpa minimum".
- Rekening tujuan disnapshot ke baris payout. Reseller mengganti rekening setelahnya tidak mengubah catatan ke mana uang benar-benar dikirim.
- Membatalkan batch melepas `payout_id` komisinya kembali ke antrean siap bayar; batch yang sudah dibayar tidak bisa dibatalkan sama sekali.
- Bukti transfer keluar disimpan di disk `payout_proofs` sendiri, terpisah dari `payment_proofs` milik tenant, agar jejak audit uang masuk dan uang keluar tidak bercampur.

Fase 1 sudah menghasilkan sistem yang benar secara finansial meski pembayarannya masih manual di luar aplikasi — ini urutan yang paling aman: catat dulu dengan akurat, otomatiskan pembayarannya belakangan.
