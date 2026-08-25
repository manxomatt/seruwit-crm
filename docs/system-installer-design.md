# Desain: System Installer — Instalasi Pertama Kali (Central Control Plane)

Dokumen ini mendesain **module system installer**: wizard sekali-jalan yang menyiapkan
**control-plane central** dan membuat **satu admin central** saat aplikasi di-deploy
pertama kali.

> **Batasan penting (ruang lingkup):** installer ini **bukan** `ModuleInstaller`
> (yang menginstal modul per-tenant). Installer **hanya** menyiapkan sisi *central*
> dan admin central. **Tenant** diprovisikan setelahnya via `CreateTenantAction` +
> pipeline tenant. **Modul** diinstal belakangan melalui registrasi / oleh admin
> tenant via `ModuleInstaller`. Installer tidak menyentuh schema tenant maupun modul.

> **Status:** dokumen desain (belum diimplementasikan). Ditulis 2026-08-25.
>
> **Konteks arsitektur:** multi-tenant Stancl multi-database. `database/migrations/`
> jalan di **central**; `database/migrations/tenant/` per **tenant**. Flag
> `CENTRAL_SERVES_APP` (default `true` di dev) membuat central melayani seluruh CRM;
> di produksi `false` → central hanya landing/auth/workspace/admin. Konfigurasi
> platform hidup di `platform_settings` (`PlatformSetting`), termasuk `SystemMode`
> (`general.system_mode`) dan `ai_features_enabled`.

---

## 1. Ruang lingkup

**Yang DILAKUKAN installer (central-only, one-shot):**

1. Preflight: cek requirement (PHP 8.4, ekstensi, izin folder, `APP_KEY`).
2. Konfigurasi koneksi database central + tulis `.env` (uji dulu, tulis setelah lolos).
3. Jalankan **migrasi central** (`database/migrations/`) + **seeder bootstrap platform**
   (permissions, module-registry, roles, menus, settings, plans, tiers, landing pages).
4. Profil platform: nama app, `APP_URL` / `TENANT_BASE_DOMAIN`, `CENTRAL_SERVES_APP`,
   `SystemMode`, mail, locale → `.env` + `platform_settings`.
5. Buat **1 admin central** (nama/email/password operator) + assign role `admin`.
6. Finalisasi: tulis **install-lock**, catat `general.installed_at`, cache config/route,
   arahkan ke login.

**Yang TIDAK dilakukan (sesuai batasan):**

| Bukan tugas installer | Ditangani oleh | Kapan |
| --- | --- | --- |
| Provisioning tenant / schema tenant | `CreateTenantAction` + pipeline `CreateDatabase→…→FinalizeTenantSetupJob` | setelah install, per workspace |
| `tenants:migrate` | pipeline tenant | saat tenant dibuat |
| Instalasi modul + migrasi modul | `ModuleInstaller` (per tenant) | via registrasi / admin tenant |
| Admin/user demo hardcoded (`admin@domain.com`) | seeder dev-only (lihat §6) | hanya lokal, bukan install produksi |

---

## 2. Posisi dalam arsitektur

Installer adalah **gerbang boot control-plane central**. Ia berjalan sebelum ada
tenant, sebelum ada admin, dan **harus tahan terhadap DB yang belum termigrasi**.
Karena itu deteksi status tidak boleh bergantung pada DB.

```
Fresh deploy ──▶ [InstallGate] ──not installed──▶ /install (wizard, central domain)
                     │                                   │ finalize
                     └──installed──▶ app normal ◀────────┘  (lock file ditulis)
```

---

## 3. Deteksi status & gating

**Sumber kebenaran: lock file**, bukan DB (DB mungkin belum ada saat langkah awal).

- `App\Support\Installer\InstallState`
  - `isInstalled(): bool` → `File::exists(storage_path('framework/installed'))`
  - `markInstalled(): void`, `lockPath(): string`
  - `token(): ?string` (anti-hijack, §8)
  - Nilai `general.installed_at` di `platform_settings` disimpan sebagai **jejak
    audit**, bukan gerbang.

- Middleware `EnsureApplicationInstalled` — **di-prepend ke priority list** (pola yang
  sama dengan `RequiresModule` di `bootstrap/app.php`) supaya jalan **sebelum**
  middleware yang menyentuh DB/tenancy (`EnsureCentralUserCanAccessModule`,
  `RedirectUnfinishedSignup`).
  - Belum install + path bukan `install.*` → redirect `install.index`.
  - Sudah install + path `install.*` → redirect `home` (404 juga boleh).
  - Cek hanya `file_exists` → murah, aman tanpa DB.

- Route `/install/*` memakai **middleware stack minimal** (`web` saja, tanpa
  central-user/tenancy) dan **hanya di central domain**. Registrasi di
  `routes/install.php` (didaftarkan dari `bootstrap/app.php`).

> **Catatan integrasi:** shared props `HandleInertiaRequests` harus toleran DB belum
> termigrasi. Untuk route install, pakai root Inertia ramping atau bungkus query
> shared-props dengan guard `InstallState::isInstalled()` — `SystemMode` sudah
> memakai try/catch, ikuti pola itu.

---

## 4. Alur wizard

```
Welcome → Requirements → Database → Migrate(progress) → Platform → Admin → Complete
  (resumable: langkah terakhir disimpan; migrasi idempoten via tabel migrations)
```

| Langkah | Aksi backend | Efek |
| --- | --- | --- |
| **Welcome** | validasi install-token (opsional) | mulai sesi install |
| **Requirements** | `RequirementsChecker` | tampil ✓/✗ PHP, ekstensi, izin tulis `.env`/`storage` |
| **Database** | `DatabaseConnectionTester` uji PDO runtime → `EnvironmentWriter` tulis `DB_*` | `.env` DB terisi hanya jika koneksi sukses |
| **Migrate** | `CentralMigrator`: `migrate --force` + `PlatformInstallSeeder` | schema central + data bootstrap platform |
| **Platform** | tulis `APP_URL`,`TENANT_BASE_DOMAIN`,`CENTRAL_SERVES_APP`,mail; set `PlatformSetting` `system_mode`, `ai_features_enabled` | profil deploy (Dev vs Production) |
| **Admin** | `CreateCentralAdminAction` | 1 `User` admin central + role `admin`, email terverifikasi |
| **Complete** | `InstallationFinalizer`: lock, `installed_at`, `config:cache`,`route:cache` | installer tertutup permanen → link ke login |

Langkah **Platform** disederhanakan jadi pilihan profil:

- **Development** → `CENTRAL_SERVES_APP=true`, `system_mode=development` (central
  melayani seluruh CRM, mail off, OTP tampil).
- **Production** → `CENTRAL_SERVES_APP=false`, `system_mode=production` (central =
  thin control plane, mail on).

---

## 5. Komponen backend

```
routes/install.php                         # grup 'install.' di central domain, middleware minimal
app/Http/Controllers/Install/
  WelcomeController.php                     # + verifikasi install-token
  RequirementController.php
  DatabaseController.php                    # test() + store()
  MigrationController.php                   # run() (stream/poll progress)
  PlatformController.php
  AdminAccountController.php
  FinalizeController.php
app/Http/Requests/Install/                  # Form Request per langkah (konvensi proyek)
  DatabaseConnectionRequest.php
  PlatformProfileRequest.php
  AdminAccountRequest.php
app/Support/Installer/
  InstallState.php                          # lock + token + installed_at
  RequirementsChecker.php
  EnvironmentWriter.php                     # tulis key .env dengan aman, tak echo secret
  DatabaseConnectionTester.php
app/Actions/Install/
  CentralMigrator.php                       # migrate --force + PlatformInstallSeeder (central only)
  CreateCentralAdminAction.php              # User admin + role 'admin'
  InstallationFinalizer.php
```

Controller & command **tipis**; semua kerja nyata di `Support\Installer` +
`Actions\Install` sehingga web-wizard dan CLI berbagi jalur yang sama.

---

## 6. Refactor `DatabaseSeeder`

`DatabaseSeeder` saat ini mencampur **bootstrap platform** dengan **admin/user demo
hardcoded** (`admin@domain.com`, `test@domain.com`). Untuk installer produksi, pisahkan:

- **`PlatformInstallSeeder`** (baru) — rangkaian aman-produksi: `PermissionSeeder`,
  `ModuleRegistrySeeder`, `RoleSeeder`, `MenuSeeder`, `SettingSeeder`, `PlanSeeder`,
  `SubscriptionTierSeeder`, landing pages. Ini yang dipanggil `CentralMigrator`.
- **`DevAccountsSeeder`** (baru) — blok admin/test hardcoded, dipanggil **hanya** dari
  `DatabaseSeeder` untuk lokal/test.
- **`DatabaseSeeder`** = `PlatformInstallSeeder` + `DevAccountsSeeder` → perilaku
  test/lokal tak berubah, tapi installer tak pernah menanam kredensial default.

Admin sungguhan dibuat oleh `CreateCentralAdminAction` dengan kredensial operator.

---

## 7. Frontend (Inertia + React)

```
resources/js/Pages/Install/
  Layout.tsx        # stepper mandiri, TANPA ModuleLayout (belum ada auth/nav)
  Welcome.tsx  Requirements.tsx  Database.tsx  Migrate.tsx  Platform.tsx  Admin.tsx  Complete.tsx
lang/en/install.php   lang/id/install.php   # proyek dwibahasa (en/id)
```

- `useForm` per langkah; langkah **Migrate** memakai polling/`WhenVisible` untuk
  progress migrasi (fitur Inertia v2), dengan skeleton berdenyut (aturan proyek untuk
  deferred).
- Aktifkan skill `inertia-react-development` + `tailwindcss-development` saat
  implementasi UI.

---

## 8. Keamanan (installer tak terautentikasi by design)

| Kontrol | Cara |
| --- | --- |
| **One-shot** | lock file → begitu selesai, `/install` tertutup permanen |
| **Anti-hijack first-run** | **install-token** wajib di langkah Welcome; dibuat `php artisan app:install-token` (disimpan `storage/framework/install-token` / `APP_INSTALL_TOKEN`). Mencegah orang lain merampas wizard di deploy publik |
| **CSRF** | sudah global (web group) |
| **Rate limit** | throttle di grup `install.` |
| **No secret echo** | `EnvironmentWriter` menulis `.env`, tak pernah mengirim balik nilai DB/mail password ke klien |
| **Uji sebelum tulis** | DB creds hanya ditulis `.env` setelah `DatabaseConnectionTester` sukses |

---

## 9. Paritas CLI (deploy/CI)

Laravel Prompts sudah terpasang → sediakan perintah headless yang berbagi Action layer:

- `php artisan app:install` — interaktif (Prompts), atau `--no-interaction` dengan opsi
  (`--db-*`, `--admin-email`, `--profile=production`).
- `php artisan app:install-token` — cetak/rotate token.

Ini melengkapi composer script `deploy` yang sudah ada, tanpa menduplikasi logika.

---

## 10. Idempotensi, resume & error

- Migrasi idempoten (tabel `migrations`); seeder pakai `firstOrCreate`/`updateOrCreate`
  — aman re-run.
- Langkah terakhir disimpan (`platform_settings general.install_step` setelah DB naik;
  sebelum itu di state file) → refresh melanjutkan.
- Kegagalan per langkah menampilkan output artisan yang sebenarnya (jangan menelan
  error) dan membiarkan operator mengulang langkah itu saja.

---

## 11. Testing

Feature test (central, sqlite test — perhatikan *config cache trap* & *Vite manifest
trap*):

- Belum install → semua route redirect ke `install.index`; `/install` dapat diakses.
- Requirements mengembalikan status yang benar.
- DB store menolak creds gagal, menerima yang valid.
- `CreateCentralAdminAction` membuat admin + role `admin`.
- Finalize menulis lock + `installed_at`; setelah itu `/install` tertutup, route normal
  jalan.
- Installer **tidak** menyentuh tenant/modul (assert tak ada provisioning).

Abstraksi `InstallState` memudahkan fake status installed/uninstalled di test.

---

## 12. Peta perubahan (ringkas)

**Baru:** `routes/install.php`, `app/Http/Controllers/Install/*`,
`app/Http/Requests/Install/*`, `app/Support/Installer/*`, `app/Actions/Install/*`,
`app/Http/Middleware/EnsureApplicationInstalled.php`, `app/Console/Commands/AppInstall*.php`,
`database/seeders/PlatformInstallSeeder.php` + `DevAccountsSeeder.php`,
`resources/js/Pages/Install/*`, `lang/{en,id}/install.php`.

**Diubah:** `bootstrap/app.php` (register route + prepend middleware),
`database/seeders/DatabaseSeeder.php` (delegasi ke dua seeder baru).

---

## 13. Risiko & mitigasi

| Risiko | Mitigasi |
| --- | --- |
| Middleware/booting menyentuh DB sebelum migrasi | Prepend `EnsureApplicationInstalled`; guard shared Inertia props; ikuti pola try/catch `SystemMode` |
| `config:cache` di finalize membekukan `.env` yang baru ditulis | Cache **setelah** semua `.env` final; sediakan langkah re-cache di CLI |
| Installer terekspos publik | install-token + lock one-shot + rate limit |
| Duplikasi logika CLI vs web | Semua di Action/Support; controller & command tipis |

---

## 14. Fase implementasi

1. **Gerbang & state** — `InstallState`, middleware, `routes/install.php`, redirect
   (belum ada UI).
2. **Refactor seeder** — `PlatformInstallSeeder` + `DevAccountsSeeder`.
3. **Backend langkah** — requirements → database → migrate → platform → admin →
   finalize (+ Form Requests, Actions).
4. **CLI** — `app:install`, `app:install-token`.
5. **Frontend** — wizard Inertia + i18n.
6. **Test** — feature + unit sesuai §11.
