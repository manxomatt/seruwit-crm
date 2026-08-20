# Implementation Plan: Alur Pembayaran Sebelum Tenant Dibuat & Perbaikan Info Trial 7 Hari

## Problem & Background

1. **Paket Berbayar Tanpa Trial (Pro)**: Pengguna yang mendaftar paket Pro (`trial_days = 0`) seharusnya masuk ke alur pembayaran/checkout **sebelum tenant (database workspace) dibuat**, sehingga database workspace hanya dibuat setelah pembayaran dikonfirmasi.
2. **Bug "7 Hari Tersisa di Trial"**: Pada halaman daftar workspace (`Workspaces.tsx`), muncul badge sisa trial 7 hari padahal paket Pro/Free tidak memiliki masa trial. Hal ini terjadi karena:
   - Nilai default fallback `addDays(7)` pada kode terdahulu sempat tersimpan di kolom `trial_ends_at` tenant.
   - Pengecekan `isOnTrial` pada `Tenant` dan `WorkspaceController` belum memeriksa apakah paket tersebut benar-benar memiliki kuota `trial_days > 0`.

---

## User Review Required

> [!IMPORTANT]
> - **Pre-Provisioning Payment Flow**:
>   1. Calon pengguna mengisi form pendaftaran & onboarding (Nama perusahaan, subdomain, dan memilih paket **Pro**).
>   2. Sistem **TIDAK** langsung memproses pembuatan tenant/database, melainkan membuat `PaymentOrder` dan mengarahkan pengguna ke halaman pembayaran Central (`/onboarding/payment`).
>   3. Pengguna melihat rincian tagihan (Paket Pro: Rp 299.xxx dengan kode unik) dan nomor rekening bank tujuan, lalu mengunggah bukti transfer.
>   4. Setelah Admin Pusat/Reseller mengonfirmasi pembayaran di panel admin (`/module/payment-orders`), job `ProvisionSelfServeTenantJob` dijalankan untuk membuat database workspace dan langsung mengaktifkan status langganan berbayar.
> - **Paket Gratis (Free) & Paket dengan Trial (Starter 30 Hari)**:
>   Tetap langsung membuat workspace tanpa hambatan pembayaran di muka.

---

## Proposed Changes

### 1. Database & Migrations

#### [NEW] `database/migrations/2026_08_21_000001_make_tenant_id_nullable_and_add_onboarding_session_to_payment_orders_table.php`
- Mengubah kolom `tenant_id` pada tabel `payment_orders` menjadi `nullable` agar order dapat dibuat sebelum record tenant ada.
- Menambahkan kolom `onboarding_session_id` (foreign key nullable ke `onboarding_sessions`).

---

### 2. Backend Models & Services

#### [MODIFY] [`app/Models/OnboardingSession.php`](file:///Users/meyga/DEV/LARAVEL/seruwit-crm/app/Models/OnboardingSession.php)
- Menambahkan konstanta status:
  - `STATUS_AWAITING_PAYMENT = 'awaiting_payment'`
  - `STATUS_PAYMENT_SUBMITTED = 'payment_submitted'`
- Menambahkan relasi `paymentOrders()` dan helper `latestPaymentOrder()`.

#### [MODIFY] [`app/Models/PaymentOrder.php`](file:///Users/meyga/DEV/LARAVEL/seruwit-crm/app/Models/PaymentOrder.php)
- Menambahkan `onboarding_session_id` ke `$fillable` dan relasi `onboardingSession()`.

#### [MODIFY] [`app/Services/PaymentOrderService.php`](file:///Users/meyga/DEV/LARAVEL/seruwit-crm/app/Services/PaymentOrderService.php)
- Menambahkan method `createOnboardingOrder(OnboardingSession $session, Plan $plan, string $billingInterval = 'month'): PaymentOrder`.
- Memperbarui method `confirm()`: Jika order berasal dari onboarding (`tenant_id === null && onboarding_session_id !== null`), maka saat dikonfirmasi sistem otomatis men-dispatch `ProvisionSelfServeTenantJob` untuk mem-provisioning workspace dan mengaktifkan langganan.

#### [MODIFY] [`app/Jobs/ProvisionSelfServeTenantJob.php`](file:///Users/meyga/DEV/LARAVEL/seruwit-crm/app/Jobs/ProvisionSelfServeTenantJob.php)
- Menghubungkan record `PaymentOrder` (yang dibuat saat onboarding) dengan `tenant_id` yang baru dibuat dan mengaktifkan subscription.

#### [MODIFY] [`app/Models/Tenant.php`](file:///Users/meyga/DEV/LARAVEL/seruwit-crm/app/Models/Tenant.php)
- Memperbaiki accessor `getIsOnTrialAttribute()` agar memeriksa apakah paket tenant memang memiliki `trial_days > 0`. Jika paket `free` atau `trial_days <= 0`, otomatis mengembalikan `false`.

---

### 3. Central Controllers, Routes & Views

#### [MODIFY] [`app/Http/Controllers/Central/OnboardingController.php`](file:///Users/meyga/DEV/LARAVEL/seruwit-crm/app/Http/Controllers/Central/OnboardingController.php)
- Pada `store()`:
  - Jika paket berbayar tanpa trial (`price > 0 && trial_days == 0`): Simpan session dengan status `awaiting_payment`, buat `PaymentOrder`, dan redirect ke `central.onboarding.payment` (tanpa membuat tenant).
  - Jika paket gratis / trial: Dispatch `ProvisionSelfServeTenantJob` dan redirect ke `central.onboarding.status`.
- Menambahkan action `payment()` dan `submitPayment()` untuk menangani halaman transfer bank dan upload bukti bayar di domain central.

#### [MODIFY] [`app/Http/Controllers/Central/WorkspaceController.php`](file:///Users/meyga/DEV/LARAVEL/seruwit-crm/app/Http/Controllers/Central/WorkspaceController.php)
- Memperbaiki mapping `is_on_trial` dan `trial_days_left` agar hanya bernilai positif untuk paket yang valid memiliki masa trial aktif.

#### [NEW] [`resources/js/Pages/Central/OnboardingPayment.tsx`](file:///Users/meyga/DEV/LARAVEL/seruwit-crm/resources/js/Pages/Central/OnboardingPayment.tsx)
- Halaman UI checkout & pembayaran transfer bank di domain central lengkap dengan kode unik, detail rekening, upload bukti transfer, dan status verifikasi admin.

---

## Verification Plan

### Automated Tests
- Menjalankan test feature:
  `php artisan test --compact tests/Feature/Tenancy/TenantOnboardingPaymentTest.php`
- Menjalankan seluruh test tenancy & subscription:
  `php artisan test --compact tests/Feature/SubscriptionTest.php`

### Database Cleanup
- Membersihkan nilai `trial_ends_at` lama pada tenant paket Pro / Free di database lokal.
