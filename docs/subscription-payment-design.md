# Desain: Aktivasi & Perpanjangan Langganan — Manual Transfer + Midtrans

> **Konteks:** Tenant yang telah melewati masa trial perlu mengaktifkan paket berbayar (Pro, dst.) agar workspace tetap aktif. Pembayaran saat ini dilakukan via transfer bank manual. Arsitektur didesain agar penambahan payment gateway (Midtrans) di kemudian hari tidak memerlukan perombakan besar.

---

## 1. State Saat Ini

| Aspek | Kondisi |
|-------|---------|
| `plans` table | Sudah ada `price`, `currency`, `interval`, `is_trial` |
| `subscriptions` table | Sudah ada, tapi diaktifkan **langsung** tanpa verifikasi pembayaran |
| `SubscriptionController::activate` | POST → `SubscriptionService::activate()` → plan aktif seketika |
| Payment proof | **Tidak ada** |
| Admin approval | **Tidak ada** |

**Gap:** Tidak ada jembatan antara intent membayar dengan konfirmasi aktual bahwa pembayaran diterima.

---

## 2. Konsep: PaymentOrder sebagai Jembatan

```
┌─────────────────────────────────────────────────────────────────────┐
│  Alur Aktivasi                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Tenant                           Admin                             │
│                                                                     │
│  [Pilih Plan]                                                       │
│       │                                                             │
│       ▼                                                             │
│  POST /order ──► PaymentOrder (status: pending)                     │
│       │                                                             │
│       ▼                                                             │
│  [Halaman Payment]                                                  │
│  · Nomor rekening + kode unik                                       │
│  · Upload bukti transfer                                            │
│       │                                                             │
│       ▼                                                             │
│  POST /proof ──► status: awaiting_confirmation ──────────► [List]  │
│                                                                │    │
│                                                    [Konfirmasi]│    │
│                                                                ▼    │
│                                         PaymentOrder: confirmed     │
│                                         Subscription: active        │
│                                         Tenant.plan: 'pro'          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Skema Database

### Tabel Baru: `payment_orders` (central DB)

```sql
CREATE TABLE payment_orders (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id         BIGINT NOT NULL REFERENCES plans(id),
    type            VARCHAR(20) NOT NULL DEFAULT 'activate',   -- activate | renew
    payment_method  VARCHAR(30) NOT NULL DEFAULT 'manual_transfer',
    status          VARCHAR(30) NOT NULL DEFAULT 'pending',

    -- Nominal
    amount          DECIMAL(14, 2) NOT NULL,   -- harga plan
    unique_code     SMALLINT NOT NULL DEFAULT 0, -- kode unik 100–999
    total_amount    DECIMAL(14, 2) NOT NULL,   -- amount + unique_code
    currency        CHAR(3) NOT NULL DEFAULT 'IDR',

    -- Instruksi transfer manual
    bank_name       VARCHAR(100) NULL,
    bank_account_number VARCHAR(50) NULL,
    bank_account_name   VARCHAR(100) NULL,

    -- Bukti dari tenant
    transfer_proof_path VARCHAR NULL,
    transfer_note   TEXT NULL,

    -- Konfirmasi admin
    confirmed_at    TIMESTAMP NULL,
    confirmed_by    BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
    subscription_id BIGINT NULL REFERENCES subscriptions(id) ON DELETE SET NULL,

    -- Penolakan
    rejected_at     TIMESTAMP NULL,
    rejected_by     BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
    rejection_reason TEXT NULL,

    -- Kadaluarsa (48 jam dari created_at, cron bersihkan)
    expires_at      TIMESTAMP NOT NULL,

    -- Data gateway (Midtrans snap_token, transaction_id, dll.)
    gateway_data    JSONB NULL,

    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

CREATE INDEX payment_orders_tenant_id_idx ON payment_orders (tenant_id);
CREATE INDEX payment_orders_status_idx ON payment_orders (status);
CREATE INDEX payment_orders_expires_at_idx ON payment_orders (expires_at);
```

### Kolom Baru: `plans.bank_transfer_instructions`

Instruksi rekening tujuan disimpan per-plan (atau di config sentral). Untuk fleksibilitas per-plan:

```sql
ALTER TABLE plans ADD COLUMN bank_instructions JSONB NULL;
-- Contoh: [{"bank":"BCA","account":"1234567890","name":"PT Seruwit Digital"}]
```

Alternatif lebih sederhana: simpan di `config/payment.php` sebagai array statis sampai multi-bank diperlukan.

---

## 4. Status & Transisi PaymentOrder

```
pending
  │
  ├── [tenant upload bukti]  ──► awaiting_confirmation
  │       │
  │       ├── [admin konfirmasi]  ──► confirmed  (→ subscription aktif)
  │       └── [admin tolak]      ──► rejected    (tenant bisa re-upload)
  │
  ├── [tenant batal]         ──► cancelled
  └── [48 jam lewat, cron]   ──► expired
```

| Status | Aksi yang Tersedia |
|--------|-------------------|
| `pending` | Upload bukti, batalkan |
| `awaiting_confirmation` | Re-upload bukti (jika salah), batalkan |
| `confirmed` | — (terminal) |
| `rejected` | Re-upload bukti (membuat order baru atau re-submit) |
| `expired` | — (terminal, order baru diperlukan) |
| `cancelled` | — (terminal) |

---

## 5. Kode Unik

Setiap PaymentOrder mendapat **kode unik 3 digit (100–999)** yang ditambahkan ke nominal transfer:

```
Harga plan    : Rp 299.000
Kode unik     : 456
Total transfer: Rp 299.456
```

**Manfaat:**
- Admin bisa mencocokkan mutasi bank dengan order tanpa nama pengirim
- Satu tenant bisa punya dua order bersamaan (edge case) tanpa ambiguitas

**Generasi:** `random_int(100, 999)` saat order dibuat. Jika ada collision pada `(amount, unique_code)` aktif, draw ulang (sangat jarang).

---

## 6. Arsitektur Backend

### 6.1 Model: `PaymentOrder`

```
app/Models/PaymentOrder.php
```

- `getConnectionName()` → central
- Status constants: `PENDING`, `AWAITING_CONFIRMATION`, `CONFIRMED`, `REJECTED`, `EXPIRED`, `CANCELLED`
- Relasi: `tenant()`, `plan()`, `subscription()`, `confirmedBy()`, `rejectedBy()`
- Helper: `isPending()`, `isAwaitingConfirmation()`, `isTerminal()`, `isExpired()`
- Scope: `scopePending()`, `scopeActive()` (pending + awaiting)
- Cast: `gateway_data` → `array`, semua timestamp → `datetime`
- Accessor: `proofUrl()` (via `Storage::disk('public')->url(...)`)

### 6.2 Service: `PaymentOrderService`

```
app/Services/PaymentOrderService.php
```

```php
class PaymentOrderService
{
    public function createOrder(Tenant $tenant, Plan $plan, string $type = 'activate'): PaymentOrder;
    public function submitProof(PaymentOrder $order, UploadedFile $proof, ?string $note): void;
    public function confirm(PaymentOrder $order, User $admin): Subscription;
    public function reject(PaymentOrder $order, User $admin, string $reason): void;
    public function expireStale(): int;  // dipanggil dari cron
    public function cancelActive(Tenant $tenant): void;  // cancel semua order aktif tenant
}
```

`confirm()` memanggil `SubscriptionService::activate()` di dalam transaksi database yang sama.

### 6.3 Interface: `PaymentGateway` (untuk Midtrans nanti)

```
app/Contracts/PaymentGateway.php
```

```php
interface PaymentGateway
{
    public function initiate(PaymentOrder $order): GatewayResponse;
    public function verify(PaymentOrder $order): bool;
    public function handleWebhook(Request $request): void;
}
```

Implementasi saat ini:

```
app/Gateways/ManualTransferGateway.php
```

— Hanya mengisi instruksi bank dari config dan mengembalikan `GatewayResponse` dengan `payment_url = null`.

Masa depan:

```
app/Gateways/MidtransGateway.php
```

— Membuat Snap token, menyimpan `snap_token` di `gateway_data`, mengembalikan `payment_url` = URL Snap Midtrans.

### 6.4 Routes

**Tenant (dalam tenant context):**

```
GET  /module/subscription              → SubscriptionController::index
POST /module/subscription/order        → SubscriptionController::createOrder
GET  /module/subscription/payment/{order}  → SubscriptionController::payment
POST /module/subscription/payment/{order}/proof → SubscriptionController::submitProof
POST /module/subscription/payment/{order}/cancel → SubscriptionController::cancelOrder
```

**Admin central:**

```
GET  /central/payment-orders           → Admin\PaymentOrderController::index
GET  /central/payment-orders/{order}   → Admin\PaymentOrderController::show
POST /central/payment-orders/{order}/confirm → Admin\PaymentOrderController::confirm
POST /central/payment-orders/{order}/reject  → Admin\PaymentOrderController::reject
```

**Webhook (Midtrans, masa depan):**

```
POST /webhooks/payment/midtrans        → WebhookController::midtrans
```

### 6.5 Middleware & Authorization

- Semua route tenant diproteksi oleh `permission:subscription,update`
- Route admin dilindungi oleh `Gate::authorize('manage-tenants')`
- Model binding memvalidasi kepemilikan: tenant hanya bisa akses PaymentOrder miliknya

### 6.6 Command: `subscription:expire-payment-orders`

```
app/Console/Commands/ExpirePaymentOrdersCommand.php
```

Dijadwalkan daily, memanggil `PaymentOrderService::expireStale()`.

---

## 7. Halaman Frontend (Tenant)

### 7.1 `/module/subscription` — Hub Langganan (sudah ada, perlu diperbarui)

Tampilkan:
- Status trial / langganan aktif / kedaluwarsa
- Jika ada PaymentOrder aktif → banner "Pembayaran dalam proses" + link ke halaman payment
- Pilih plan (card grid) → tombol "Pesan & Bayar"

### 7.2 `/module/subscription/payment/{order}` — Halaman Payment (BARU)

Struktur halaman:

```
┌─────────────────────────────────────────────────────┐
│  Paket yang Dipilih                                  │
│  Pro Plan — Rp 299.000 / bulan                      │
├─────────────────────────────────────────────────────┤
│  Instruksi Transfer                                  │
│                                                     │
│  Bank  : BCA                                        │
│  No. Rek : 1234 5678 90                             │
│  Atas Nama : PT Seruwit Digital Nusantara           │
│                                                     │
│  ⚠ Transfer tepat Rp 299.456                        │
│    (Rp 299.000 + kode unik 456)                     │
│                                                     │
│  Berlaku hingga: 14 Agustus 2026, 12:00 WIB         │
│  [Countdown timer]                                  │
├─────────────────────────────────────────────────────┤
│  Upload Bukti Transfer                              │
│  [Drag & drop / klik untuk memilih file]            │
│  Catatan opsional: [textarea]                       │
│                                                     │
│  [Kirim Bukti Transfer]      [Batalkan]             │
└─────────────────────────────────────────────────────┘
```

State:
- `pending` → tampilkan form upload
- `awaiting_confirmation` → tampilkan "Bukti diterima, sedang diverifikasi" + tombol re-upload
- `confirmed` → redirect ke dashboard dengan success banner
- `rejected` → tampilkan alasan penolakan + form re-upload
- `expired` / `cancelled` → tampilkan pesan + CTA kembali ke halaman subscription

### 7.3 Banner Perpanjangan di Dashboard

Tampilkan banner kuning `N hari lagi berakhir` ketika `ends_at` < 14 hari:

```
⚠ Langganan Anda berakhir dalam 7 hari (21 Ags 2026).
  [Perpanjang Sekarang →]
```

---

## 8. Halaman Admin (Central)

### 8.1 `/central/payment-orders` — Daftar

Tabel dengan kolom:
- Tenant, Plan, Amount (+ kode unik), Status (badge), Tanggal, Aksi

Filter: status, tanggal, cari nama tenant.

### 8.2 `/central/payment-orders/{order}` — Detail

Tampilkan:
- Info tenant (nama, subdomain, status, trial_ends_at)
- Info plan (nama, harga, modul)
- Nominal: amount, kode unik, total
- Bukti transfer: image preview (click to zoom)
- Catatan dari tenant
- Riwayat status

Aksi:
- **Konfirmasi** → modal konfirmasi → `POST /confirm`
- **Tolak** → modal + input alasan → `POST /reject`

---

## 9. Notifikasi Email

| Event | Penerima | Isi |
|-------|----------|-----|
| Order dibuat | Tenant (owner) | Instruksi transfer + nominal + kode unik + deadline |
| Bukti diunggah | Admin platform | Notif ada bukti baru yang menunggu konfirmasi |
| Dikonfirmasi | Tenant | Langganan aktif, tanggal berakhir, fitur yang bisa diakses |
| Ditolak | Tenant | Alasan penolakan, instruksi re-upload |
| Mendekati expired (H-7, H-1) | Tenant | Reminder perpanjang |
| Order expired | Tenant | Order kedaluwarsa, CTA buat order baru |

---

## 10. Perpanjangan (Renewal)

Alur identik dengan aktivasi, perbedaan:
- `type = 'renew'` di PaymentOrder
- `SubscriptionService::activate()` dimodifikasi: jika sudah ada subscription aktif, perpanjang `ends_at` (tambah 1 bulan/tahun dari `max(now(), ends_at)`)
- Tenant bisa perpanjang sejak H-30 sebelum berakhir (tidak harus menunggu expired)

---

## 11. Rencana Integrasi Midtrans (Masa Depan)

Ketika siap integrasi Midtrans:

1. **Tambah kolom:** `payment_orders.gateway_reference` (Midtrans order ID)
2. **Implementasi** `MidtransGateway`:
   - `initiate()` → buat Snap token → simpan `snap_token` di `gateway_data` → kembalikan `payment_url`
   - `handleWebhook()` → verifikasi signature Midtrans → jika `transaction_status = settlement` → `PaymentOrderService::confirm()`
3. **Halaman payment** deteksi `payment_method`:
   - `manual_transfer` → tampilan instruksi bank seperti sekarang
   - `midtrans` → tampilkan tombol "Bayar dengan Midtrans" yang membuka Snap popup (atau redirect ke hosted page)
4. **Route webhook** sudah disiapkan (`POST /webhooks/payment/midtrans`)
5. **Tidak ada perubahan** pada `SubscriptionService`, `PaymentOrder` model, atau halaman admin — hanya gateway baru ditambahkan

```
config/payment.php
└── 'driver' => env('PAYMENT_DRIVER', 'manual_transfer')
               // 'midtrans' ketika siap
```

---

## 12. Urutan Implementasi

### Fase 1 — Manual Transfer (Sekarang)

1. **Migration:** `create_payment_orders_table` + `add_bank_instructions_to_plans_table`
2. **Model & Service:** `PaymentOrder`, `PaymentOrderService`
3. **Gateway:** `ManualTransferGateway` + `PaymentGateway` interface
4. **Backend tenant:** ubah `SubscriptionController` (createOrder, payment, submitProof, cancelOrder)
5. **Backend admin:** `Admin\PaymentOrderController` (index, show, confirm, reject)
6. **Frontend tenant:** update `Activate.tsx` + buat `Payment.tsx`
7. **Frontend admin:** buat `PaymentOrders/Index.tsx` + `PaymentOrders/Show.tsx`
8. **Email notifications:** `PaymentOrderCreated`, `PaymentOrderConfirmed`, `PaymentOrderRejected`
9. **Cron:** `ExpirePaymentOrdersCommand`
10. **Tests**

### Fase 2 — Midtrans (Masa Depan)

1. Install `midtrans/midtrans-php`
2. `MidtransGateway` + config
3. `WebhookController::midtrans` + route
4. Update `Payment.tsx` untuk handle dua mode
5. Tests

---

## 13. Keputusan Desain

| Keputusan | Pilihan | Alasan |
|-----------|---------|--------|
| Satu tabel `payment_orders` vs tabel terpisah per metode | **Satu tabel** | Cukup untuk skala saat ini; `gateway_data` JSON mengakomodasi data spesifik gateway |
| Simpan instruksi bank di `plans` vs `config` | **`config/payment.php`** | Satu rekening untuk semua plan; mudah diubah tanpa migration |
| Kode unik: per-order vs. per-tenant | **Per-order** | Tenant bisa punya dua order (aktif + renewal) sekaligus |
| Proof upload: tenant DB vs central storage | **Tenant storage** (public disk) | Sesuai pola `Media` yang sudah ada; URL via Herd |
| Akses admin ke bukti transfer | Melalui `Storage::disk('public')` dengan path | Cukup untuk sekarang; bisa dipindah ke S3 nanti |
| Satu subscription per tenant | **Ya** (`unique tenant_id`)  | Sesuai skema yang ada; renewal = update `ends_at` |
