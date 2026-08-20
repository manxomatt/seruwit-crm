# Implementation Plan: Menghubungkan Checkout Pembayaran di Akhir Registrasi untuk Paket Berbayar Tanpa Trial (Pro)

Menghubungkan alur checkout pembayaran langsung ke langkah akhir pendaftaran (*onboarding*) ketika pengguna memilih paket berbayar yang tidak memiliki masa uji coba (`trial_days = 0`, contohnya paket **Pro**).

## User Review Required

> [!IMPORTANT]
> - **Paket Tanpa Trial (`price > 0 && trial_days = 0`)**: Workspace/tenant tetap diprovisioning secara aman dan terisolasi, namun status awal diset `is_trial_expired = true` dan sistem otomatis menerbitkan `PaymentOrder` (Pesanan Pembayaran dengan kode unik & instruksi transfer bank).
> - **Alur Masuk (Enter Workspace)**: Setelah proses pembuatan database selesai di halaman status onboarding, pengguna akan langsung dialihkan ke halaman **Checkout & Pembayaran** (`/module/subscription/payment/{orderId}` atau `/module/subscription`) untuk menyelesaikan transfer dan upload bukti bayar sebelum dapat mengakses modul operasional lainnya.
> - **Paket Gratis (Free) & Paket dengan Trial (Starter 30 Hari)**: Tetap berjalan normal seperti sebelumnya (langsung masuk ke dashboard tanpa tagihan di muka).

---

## Proposed Changes

Grouped by component:

### 1. Backend Provisioning & Subscription Pipeline

#### [MODIFY] [`app/Jobs/ProvisionSelfServeTenantJob.php`](file:///Users/meyga/DEV/LARAVEL/seruwit-crm/app/Jobs/ProvisionSelfServeTenantJob.php)
- Memperbaiki logika penentuan `trial_ends_at` dan `is_trial_expired`:
  - Jika paket gratis (`price <= 0`): `trial_ends_at = null`, `is_trial_expired = false`.
  - Jika paket berbayar dengan trial (`price > 0 && trial_days > 0`): `trial_ends_at = now()->addDays($trial_days)`, `is_trial_expired = false`.
  - Jika paket berbayar **tanpa trial** (`price > 0 && trial_days == 0`):
    - `trial_ends_at = null`
    - `is_trial_expired = true`
    - Memanggil `PaymentOrderService::createOrder($tenant, $plan, 'activate', 'month')` untuk membuat order pembayaran perdana secara otomatis.

#### [MODIFY] [`app/Http/Controllers/Central/WorkspaceController.php`](file:///Users/meyga/DEV/LARAVEL/seruwit-crm/app/Http/Controllers/Central/WorkspaceController.php)
- Memperbaiki method `enter()`:
  - Ketika pengguna masuk ke workspace yang `is_trial_expired = true` atau status membutuhkan aktivasi, buat impersonation token dengan target URL `/module/subscription` (atau order checkout) di domain tenant, sehingga pengguna dapat melihat instruksi bayar dan upload bukti transfer secara langsung.

---

### 2. Frontend Onboarding & Status Experience

#### [MODIFY] [`resources/js/Pages/Central/Onboarding.tsx`](file:///Users/meyga/DEV/LARAVEL/seruwit-crm/resources/js/Pages/Central/Onboarding.tsx)
- Pada **Step 3 (Pilihan Paket)**:
  - Jika paket yang dipilih memiliki `trial_days === 0 && price > 0`:
    - Tampilkan badge informasi: `Tanpa Trial • Bayar Langsung`.
    - Ubah teks tombol submit menjadi: `Lanjut ke Pembayaran & Aktivasi →`.
  - Jika paket memiliki `trial_days > 0`:
    - Tampilkan badge `Trial {days} Hari` dan tombol `Luncurkan Workspace Gratis`.

#### [MODIFY] [`resources/js/Pages/Central/OnboardingStatus.tsx`](file:///Users/meyga/DEV/LARAVEL/seruwit-crm/resources/js/Pages/Central/OnboardingStatus.tsx)
- Menyesuaikan pesan status saat database tenant selesai dibuat:
  - Jika paket memerlukan pembayaran langsung: Tampilkan teks "Workspace Siap! Mengalihkan ke Halaman Pembayaran..." sebelum redirect otomatis ke checkout.

---

### 3. Automated Tests & Verification

#### [NEW] [`tests/Feature/Tenancy/TenantOnboardingPaymentTest.php`](file:///Users/meyga/DEV/LARAVEL/seruwit-crm/tests/Feature/Tenancy/TenantOnboardingPaymentTest.php)
- Menguji skenario:
  1. Registrasi & Onboarding pada paket **Pro** (`trial_days = 0`):
     - Memverifikasi tenant dibuat dengan `is_trial_expired = true`.
     - Memverifikasi record `PaymentOrder` berstatus `pending` otomatis dibuat untuk tenant tersebut.
     - Memverifikasi redirect `enter` mengarahkan ke halaman pembayaran langganan.
  2. Registrasi pada paket **Starter** (`trial_days = 30`):
     - Memverifikasi tenant dibuat dengan `trial_ends_at` 30 hari ke depan dan `is_trial_expired = false`.

---

## Verification Plan

### Automated Tests
- Menjalankan test feature:
  `php artisan test --compact tests/Feature/Tenancy/TenantOnboardingPaymentTest.php`
- Menjalankan seluruh test subscription:
  `php artisan test --compact tests/Feature/SubscriptionTest.php`

### Code Quality & Build
- Menjalankan format Pint: `vendor/bin/pint --dirty --format agent`
- Menjalankan build frontend: `npm run build`
