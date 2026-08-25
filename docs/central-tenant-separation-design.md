# Desain: Pemisahan Schema Central vs Tenant — Audit Migrasi & Settings

Dokumen ini menjawab dua kebutuhan review arsitektur:

- **Bagian A** — Audit migrasi central: tabel mana yang seharusnya *central-only*, *tenant-only*, atau *genuinely-both*, plus target schema central yang ramping.
- **Bagian B** — Desain konkret pemisahan settings **global (central-admin)** vs **lokal (tenant-admin)**.

> **Konteks:** Tenancy Stancl multi-database (schema PostgreSQL per tenant). `database/migrations/` dijalankan di **central**; `database/migrations/tenant/` dijalankan per **tenant**. Flag `CENTRAL_SERVES_APP` (default `true` di dev) membuat domain central menjalankan seluruh CRM — itulah alasan central kini memuat banyak tabel domain-tenant. Di produksi disetel `false` → central hanya landing/auth/workspace/admin.

> **Status:** dokumen desain. Angka per 2026-08-25: central 95 migrasi (`database/migrations/`), tenant 56 (`database/migrations/tenant/`), **171 migrasi modul** (`modules/*/Database/Migrations/`); **40 tabel terduplikasi** antara central & tenant.
>
> **Sudah diimplementasikan (2026-08-25):** gating auto-load migrasi modul pada `CENTRAL_SERVES_APP` — lihat [A.0](#a0-sumber-ketiga-auto-load-migrasi-modul-implemented). Sisa Part A (pindah tabel domain `database/migrations/` → `tenant/`) dan seluruh Part B belum.

---

## Bagian A — Audit Migrasi Central

### A.0 Sumber ketiga: auto-load migrasi modul *(implemented)*

Penyebab **terbesar** "central gemuk" bukan folder `database/migrations/`, melainkan **migrasi modul** (`modules/*/Database/Migrations/`, 171 file). `ModuleServiceProvider::boot()` memanggil `loadMigrationsFrom()` untuk setiap modul opsional, sehingga `php artisan migrate` / `migrate:fresh` — yang menyasar koneksi **central/default** — membuat seluruh tabel modul (`products`, `canvassing_*`, `maintenance_*`, `vehicles`, `rentals`, `inventory_*`, `sales_*`, …) di schema central.

Tenant **tidak** mendapat tabel modul dari sini: `tenants:migrate` hanya menjalankan `database/migrations/tenant/`, dan tabel modul masuk ke schema tenant **on-demand** saat modul di-install via `ModuleInstaller` (`Artisan::call('migrate', ['--path' => $module->migrationsPath()])`).

**Gating yang diterapkan** ([`app/Providers/ModuleServiceProvider.php`](../../app/Providers/ModuleServiceProvider.php)): pendaftaran `loadMigrationsFrom` migrasi modul kini bergantung pada `config('app.central_serves_app')`.

```php
$loadModuleMigrations = (bool) config('app.central_serves_app');
foreach (Modules::all() as $module) {
    $this->bootModule($module, loadMigrations: $loadModuleMigrations);
}
```

- **`true` (default)** → perilaku lama; central & test tetap dapat semua tabel modul.
- **`false`** → migrasi modul tak didaftarkan ke migrator default → central migrate tanpa tabel modul. Tenant tak terpengaruh (tetap via `--path` saat install).

**Bukti (migrate:fresh nyata di DB testing):**

| Flag | Migrasi jalan | Total tabel | Tabel modul (products/canvassing/vehicles/rentals/…) |
| --- | --- | --- | --- |
| `true` | 266 | 207 | ada |
| `false` | 95 | **67** | **absent** |

> **Catatan:** 67 tabel sisa (saat `false`) **masih** memuat duplikasi domain dari `database/migrations/` (`partners`, `locations`, `media`, `menus`, `settings`, dll) — itu pekerjaan **A.3** di bawah, terpisah dari gating ini. Mengaktifkan `false` di environment nyata butuh: domain tenant untuk dev (central tak lagi melayani UI CRM) + install modul per tenant.

### Prinsip klasifikasi

| Kelas | Definisi | Aksi |
| --- | --- | --- |
| **CENTRAL-ONLY** | Hanya bermakna di level platform | Tetap di `database/migrations/` |
| **GENUINELY-BOTH** | Dibutuhkan central *dan* tenant (framework, identitas, RBAC, akuntansi platform) | Tetap di kedua folder |
| **MOVE → TENANT** | Domain tenant; ada di central hanya karena `CENTRAL_SERVES_APP` | Hapus dari `database/migrations/`, sisakan di `database/migrations/tenant/` |
| **TENANT-ONLY** | Sudah benar tenant-only | Tidak ada aksi |

### A.1 CENTRAL-ONLY — sudah benar (tetap)

Tenancy & manajemen platform. **55 migrasi**, antara lain:

- **Tenancy:** `tenants`, `domains`, `tenant_user_impersonation_tokens`, `tenant_users`, `add_global_id_to_users`, trial/reseller/payg fields on `tenants`, `tenant_activity_logs`
- **Langganan & billing platform:** `plans` (+ pricing/promo/payg/limits), `subscriptions` (+ renewals/reports), `subscription_tiers`, `payment_orders`, `price_histories`
- **Onboarding & undangan:** `onboarding_sessions`, `invitations`
- **Reseller:** `reseller_profiles`, `reseller_commission_rules`, `reseller_payouts`, `reseller_commissions`
- **Platform config:** `module_settings`, `page_components` (blok builder shared), `add_ai_features_enabled_to_central_settings`, `move_central_rental_settings_to_internal_group`

✅ Semua ini tepat di central. Tidak ada perubahan.

### A.2 GENUINELY-BOTH — dibutuhkan di kedua schema (tetap)

| Tabel | Alasan ada di central | Alasan ada di tenant |
| --- | --- | --- |
| `users`, `cache`, `jobs` | Framework + identitas central (`CentralUser`) | Framework + FK domain tenant |
| `roles`, `permissions`, `permission_role`, `role_user`, `user_profiles` | RBAC admin central | RBAC per-tenant (peran bisa beda per tenant) |
| `settings` | Setting global platform *(lihat Bagian B)* | Setting lokal tenant |
| `notifications` | Notifikasi admin central | Notifikasi tenant |
| `media` | Asset manager page builder (central) | Media tenant |
| **Akuntansi inti** — `accounting_tables`, `accounting_posting_rules`, `add_saas_revenue_account`, `seed_zero_opening_balances` | **Pembukuan platform** (revenue SaaS, komisi reseller) | Pembukuan tenant |

> **Catatan akuntansi:** sesuai model mentalmu, akuntansi memang milik central — tapi untuk **buku platform sendiri**. Tenant punya akuntansi sendiri di schema-nya. Jadi ini *genuinely-both* dengan tujuan berbeda, bukan duplikasi sia-sia.

### A.3 MOVE → TENANT — hapus dari central (cleanup)

Tabel domain tenant yang ada di central **hanya** demi `CENTRAL_SERVES_APP=true`. Di produksi jadi beban mati.

| Domain | Migrasi (di `database/migrations/` yang dihapus) | Catatan |
| --- | --- | --- |
| **Partners/CRM** | `create_partners_table`, `create_partner_supporting_tables`, `rename_customer_id_to_partner_id`, `add_json_translations_to_partner_industries`, `create_partner_types_table`, `add_picture_url_to_partners`, `add_rental_identity_..._to_partners`, `add_portal_user_id_to_partners` | Murni domain tenant |
| **Perbankan** | `create_company_bank_accounts_tables`, `create_bank_transactions_and_shift_rules`, `create_bank_reconciliations_tables`, `add_pos_shift_deposit_columns` | Operasional tenant. Bila buku platform butuh rekening, buat setup minimal terpisah |
| **Pajak** | `create_tax_codes_and_wht_support`, `create_tax_policies_table` | Tenant |
| **Fixed assets** | `create_fixed_assets_and_budgets_tables`, `ensure_fixed_asset_coa_roles` | Tenant (platform tak butuh) |
| **Lokasi** | `create_locations_table` | Tenant |
| **Navigasi & fitur app** | `create_menus_table`, `create_todos_table`, `create_live_updates_table` | Per-tenant; *verifikasi* tak dipakai admin central |
| **Akuntansi rental/shuttle** | `add_rental_deposit_accounting_support`, `add_shuttle_accounting_support` | Domain tenant (posting rule spesifik modul) |
| **Mail** | `create_mail_configs_table` | **Pindah ke Bagian B**: mail platform = setting global; mail tenant = lokal |

### A.4 TENANT-ONLY — sudah benar (tetap)

`installed_modules`, seluruh `update_*_menu_route_to_dashboard`, `add_polygon_support_to_tracking_geofences`. ✅

### A.5 Target schema central (ramping)

Setelah cleanup, central hanya memuat: **framework** (users/cache/jobs) · **identitas & RBAC central** · **tenancy** (tenants/domains/impersonation/tenant_users) · **manajemen platform** (plans/subscriptions/payment_orders/tiers/reseller/onboarding/invitations/module_settings) · **page_components** · **settings global** (Bagian B) · **akuntansi platform**.

### A.6 Strategi cleanup & risiko

Karena folder migrasi sudah terpisah, "MOVE → TENANT" = **hapus file dari `database/migrations/`** (tetap ada di `database/migrations/tenant/`).

1. **Prasyarat keputusan:** jadikan `CENTRAL_SERVES_APP=false` sebagai norma (termasuk dev pakai tenant). Selama `true`, central *butuh* tabel-tabel A.3 → jangan hapus. **Ini trade-off utama.**
2. **Install baru:** hapus migrasi A.3 dari central → central langsung ramping.
3. **Central DB existing:** buat satu migrasi central `drop`-only opsional untuk membuang tabel domain (setelah pastikan tak ada data platform di sana), atau biarkan (tidak berbahaya, hanya beban mati).
4. **Verifikasi wajib:** cek referensi central ke tabel A.3 (mis. controller central yang query `partners`/`locations`) sebelum menghapus. Jalankan test suite (⚠️ saat ini terblokir DB testing).

**Risiko: sedang.** Menyentuh apa yang jalan di central; harus diverifikasi menyeluruh. Rekomendasi: kerjakan setelah test bisa dijalankan.

---

## Bagian B — Pemisahan Settings Global vs Lokal

### B.1 Kondisi sekarang (dan masalahnya)

Ada **tiga** mekanisme yang tumpang tindih:

| Mekanisme | Koneksi | Dipakai untuk |
| --- | --- | --- |
| `Setting` (default) | Tenant | Setting lokal tenant (`rental.storefront.*`, dll) |
| `Setting::on('central')` | Central | Setting **global** — dipakai `CentralAiSettings::isEnabled()` & `SystemMode` |
| `ModuleSetting` | Central | Enablement/konfigurasi modul per tenant |

**Masalah:** setting global & lokal memakai **model dan tabel yang sama** (`Setting` + `settings`), hanya dibedakan oleh *koneksi mana yang di-query*. Ini implisit dan rawan:
- Mudah salah koneksi (baca global padahal maksudnya lokal, atau sebaliknya).
- UI settings tenant berpotensi mengekspos/menimpa key global.
- Tak ada batas tipe/otorisasi yang jelas antara "hanya admin central" vs "admin tenant".

### B.2 Desain target

**Dua konsep eksplisit, dua model, dua tabel:**

```
┌─────────────────────────────────────────────┐
│ PLATFORM (central)                            │
│  • PlatformSetting  (CentralConnection)       │  ← admin central saja
│    tabel: platform_settings                   │
│    contoh: ai_features_enabled, kredensial     │
│    gateway platform, SMTP platform,           │
│    feature flag, default plan, branding pusat │
│  • ModuleSetting (tetap) — enablement modul   │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ TENANT (schema tenant)                        │
│  • Setting  (koneksi default/tenant)          │  ← admin tenant
│    tabel: settings                            │
│    contoh: rental.storefront.*,               │
│    passenger_booking_enabled, SMTP tenant,    │
│    template dokumen, branding tenant          │
└─────────────────────────────────────────────┘
```

**Aturan akses:**
- `PlatformSetting::get('key')` — central; helper `platform_setting('key', $default)`.
- `Setting::getValue('key')` — tenant (tetap seperti sekarang).
- **Hapus** semua pemakaian `Setting::on('central')` → ganti `PlatformSetting`.
- `Setting` menjadi **tenant-scoped murni** (tak lagi dipakai lintas koneksi).

**Otorisasi & UI:**
- Setting global: route di **domain central**, gate `can:manage-platform-settings`. UI di panel admin central.
- Setting lokal: route tenant (`settings.*` yang sudah ada), gate `permission:...`. UI di panel tenant (mis. Rental → Settings).
- Policy memastikan admin tenant **tidak** bisa membaca/menulis `platform_settings`.

**Pola gate berlapis (sudah ada, dipertahankan):** fitur yang dikontrol platform tapi ditoggle tenant — mis. AI. `PlatformSetting: ai_features_enabled` = izin platform; `Setting: rental.ai_*` = toggle tenant yang hanya efektif bila platform mengizinkan (persis `centralAiEnabled` prop sekarang).

### B.3 Migrasi & langkah refactor

1. **Buat** `platform_settings` (central migration) + model `PlatformSetting` (`CentralConnection`, `get/set/all`), meniru API `Setting`.
2. **Pindahkan data:** migrasi memindahkan baris central `settings` yang bersifat global (grup `rental_internal`, `ai_features_enabled`) → `platform_settings`.
3. **Ganti konsumen:** `CentralAiSettings` & `SystemMode` → baca `PlatformSetting` (bukan `Setting::on(central)`).
4. **Bersihkan:** hapus `settings` dari migrasi **central** (masuk daftar A.3) — `Setting` kini tenant-only. Simpan tabel `settings` tenant apa adanya.
5. **UI/route:** tambah panel "Platform Settings" di admin central; pastikan gating.
6. **Uji:** unit test `PlatformSetting` + feature test gating (tenant tak bisa akses platform settings). ⚠️ Terblokir DB testing.

**Risiko: rendah–sedang.** Sebagian besar aditif (model/tabel baru + pemindahan data terbatas). Titik hati-hati: menemukan seluruh pembaca `Setting::on(central)` (audit: `CentralAiSettings`, `SystemMode` — konfirmasi tak ada lain).

---

## Ringkasan aksi

| # | Pekerjaan | Risiko | Status |
| --- | --- | --- | --- |
| A.0 | Gating auto-load migrasi modul pada `CENTRAL_SERVES_APP` | Rendah | ✅ **Selesai** (2026-08-25) |
| A.3 | Ramping migrasi central (pindah tabel domain `database/migrations/` → `tenant/`) | Sedang | ⬜ Belum — butuh `CENTRAL_SERVES_APP=false` + test hijau |
| B1 | `PlatformSetting` + tabel `platform_settings` + pindah data | Rendah–sedang | ⬜ Belum |
| B2 | Ganti `Setting::on(central)` → `PlatformSetting`; `Setting` jadi tenant-only | Sedang | ⬜ Belum |
| B3 | Panel & gating platform settings | Rendah | ⬜ Belum |

**Urutan disarankan:** A.0 (✅) → B1 → B2 → B3 → A.3 (settings dulu karena aditif & berisiko rendah; ramping folder migrasi central paling akhir karena butuh keputusan `CENTRAL_SERVES_APP` + verifikasi penuh). User (poin 3 review) sudah benar dan tidak diubah.

**Untuk mengaktifkan central ramping di environment nyata:** set `CENTRAL_SERVES_APP=false` → gating A.0 langsung menghilangkan tabel modul dari central. Prasyarat: domain tenant tersedia untuk dev (central tak lagi melayani UI CRM) + modul di-install per tenant. Kerjakan A.3 bila ingin menghapus juga duplikasi domain di `database/migrations/`.
