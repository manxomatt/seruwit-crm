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
   (belum ada UI). ✅ **Selesai** (2026-08-25).
2. **Refactor seeder** — `PlatformInstallSeeder` + `DevAccountsSeeder`. ✅ **Selesai** (2026-08-25).
3. **Backend langkah** — requirements → database → migrate → platform → admin →
   finalize (+ Form Requests, Actions). ✅ **Selesai** (2026-08-25).
4. **CLI** — `app:install`, `app:install-token`. ✅ **Selesai** (2026-08-25).
5. **Frontend** — wizard Inertia + i18n. ✅ **Selesai** (2026-08-25).
6. **Test** — feature + unit sesuai §11. ✅ **Selesai** (dikerjakan per-fase).

### Catatan Fase 1 (implemented, 2026-08-25)

- `App\Support\Installer\InstallState` — lock file `storage/framework/installed`;
  cek DB-free. Override `config('app.installed')` (env `APP_INSTALLED`) menang atas
  lock file bila di-set (skip installer di deploy manual; melewatkan test suite).
- `App\Http\Middleware\EnsureApplicationInstalled` — di-prepend ke web group **dan**
  diurutkan sebelum `StartSession` di priority list, sehingga deploy fresh (session
  driver = database) redirect ke `/install` alih-alih fatal di tabel `sessions`.
- `routes/install.php` — grup middleware `install` yang ramping (hanya gerbang, tanpa
  web group), didaftarkan via `then:` di `bootstrap/app.php`; **tak** dibatasi domain
  central (APP_URL bisa belum terisi saat boot pertama). Fase 1 hanya route landing
  `install.index` (placeholder HTML polos, bukan Inertia — hindari Vite manifest trap).
- Test: `tests/Feature/Install/InstallationGateTest.php` (5 lolos, DB-free). Suite lama
  lolos gerbang via `APP_INSTALLED=true` di `phpunit.xml`.

### Catatan Fase 2 (implemented, 2026-08-25)

- `Database\Seeders\PlatformInstallSeeder` — bootstrap aman-produksi (Permission,
  ModuleRegistry, Role, Menu, Setting, Plan, SubscriptionTier, 6 landing page). Persis
  daftar seeder lama `DatabaseSeeder`, **tanpa** pembuatan akun. Inilah yang dipanggil
  installer (Fase 3, `CentralMigrator`).
- `Database\Seeders\DevAccountsSeeder` — `admin@domain.com` (role admin) +
  `test@domain.com` (role user). Hanya untuk lokal/test; installer tak pernah
  menjalankannya.
- `Database\Seeders\DatabaseSeeder` — kini hanya `call([PlatformInstallSeeder,
  DevAccountsSeeder])`. Perilaku `db:seed` lokal/test tak berubah. Muting event
  dipertahankan (`WithoutModelEvents` di ketiganya; `Model::withoutEvents` nested aman).
- Test: `tests/Feature/Install/SeederSplitTest.php` (1 lolos) — bootstrap platform = 0
  akun; `DevAccountsSeeder` menanam admin+test dengan role benar.

### Catatan Fase 3 (implemented, 2026-08-25)

- Services `app/Support/Installer/`: `RequirementsChecker` (DB-free — PHP/ekstensi/driver
  PDO/APP_KEY/izin tulis), `EnvironmentWriter` (update-in-place/append `.env`, quoting,
  tak echo secret), `DatabaseConnectionTester` (PDO throwaway pgsql/mysql/sqlite sebelum
  tulis `.env`).
- Actions `app/Actions/Install/`: `CentralMigrator` (`migrate --force` + `PlatformInstallSeeder`,
  **central-only**, tanpa tenant/modul), `CreateCentralAdminAction` (admin dari input
  operator, email terverifikasi, role `admin`; error bila role belum di-bootstrap),
  `InstallationFinalizer` (`InstallState::markInstalled()` + `config:cache` opsional; **tanpa**
  `route:cache` karena app punya closure route yang tak bisa diserialisasi).
- Form Requests `app/Http/Requests/Install/`: `DatabaseConnectionRequest`,
  `PlatformProfileRequest` (profil development/production → `CENTRAL_SERVES_APP` + `SystemMode`),
  `AdminAccountRequest`.
- Controller tipis `app/Http/Controllers/Install/`: Requirement (JSON), Database (test/store),
  Migration, Platform, AdminAccount, Finalize. Route di `routes/install.php`.
- Grup `install` diperluas: `ConfigureInstallerEnvironment` (paksa session/cache = **file**)
  → cookies → StartSession → CSRF → SubstituteBindings → gate. Keduanya (gate +
  ConfigureInstallerEnvironment) diurutkan sebelum `StartSession` di priority list.
- Test: `RequirementsCheckerTest`, `EnvironmentWriterTest`, `InstallEndpointsTest` (ringan,
  DB-free — termasuk uji koneksi PDO valid/invalid), `InstallStepsTest` (RefreshDatabase —
  migrator bootstrap tanpa akun, admin endpoint→admin terverifikasi, finalizer→lock+audit).
  Semua lolos.

### Catatan Fase 4 (implemented, 2026-08-25)

- `App\Support\Installer\InstallToken` — token anti-hijack (file `storage/framework/install-token`;
  override env `APP_INSTALL_TOKEN` menang). `config('app.install_token')` ditambah. *Enforcement*
  di alur web menyusul (Fase 5, langkah Welcome); CLI tak butuh token (shell terpercaya).
- `app/Console/Commands/AppInstall.php` (`app:install`) — kembaran headless installer web,
  berbagi Service/Action Fase 3. Interaktif default; `--no-interaction` baca dari options
  (`--db-*`, `--app-name/url`, `--tenant-base-domain`, `--profile`, `--ai-features`,
  `--admin-*`, `--optimize`, `--force`, `--skip-database`). Menjalankan requirements → (opsional
  konfig DB: uji + tulis `.env` + reconfigure runtime `DB::purge`) → key:generate bila kosong →
  `CentralMigrator` → profil platform (`.env` + `PlatformSetting`) → `CreateCentralAdminAction`
  → `InstallationFinalizer`. **Central-only** — tak menyentuh tenant/modul.
- `app/Console/Commands/AppInstallToken.php` (`app:install-token`) — cetak token (mint bila
  belum ada); `--rotate` regenerasi.
- Test: `AppInstallTokenTest` (2 lolos, DB-free), `AppInstallCommandTest` (2 lolos — tolak bila
  sudah terinstal; install penuh via CLI dengan `EnvironmentWriter` di-rebind ke file temp
  sehingga `.env` proyek tak tersentuh). Tak ada residu lock/token/config-cache.

### Catatan Fase 5 (implemented, 2026-08-25)

- **Root view DB-free** `resources/views/install.blade.php` — tanpa `Appearance::resolve()`
  / `Modules::pageEntrypoint` (keduanya query DB); default `--color-primary-rgb`. Dipakai
  `HandleInstallerInertiaRequests` (`$rootView = 'install'`).
- **Middleware Inertia ramping** `HandleInstallerInertiaRequests` — hanya share `errors`,
  `translations.install`, `locale`, `availableLocales`, `flash.status` (tanpa menu/auth/settings
  DB-berat). Ditambah ke grup `install`.
- **Token gate web** `EnsureInstallerUnlocked` — bila token dikonfigurasi, langkah mutasi butuh
  sesi ter-unlock; inert bila tak ada token. `UnlockController` (`POST /install/unlock`) verifikasi
  token → sesi `installer_unlocked`.
- **Halaman** `resources/js/Pages/Install/Wizard.tsx` — stepper client-side (Welcome→Requirements
  →Database→Migrate→Platform→Admin→Complete), `useForm` + `preserveState` agar step bertahan
  melewati redirect Inertia; `useTrans('install.*')`; toggle bahasa EN/ID. `WelcomeController`
  kini render `Install/Wizard`.
- **i18n** `lang/{en,id}/install.php`. Butuh `npm run build` (Vite manifest untuk halaman baru).
- **Gerbang jadi aktif di dev:** tanpa lock/`APP_INSTALLED`, seluruh app redirect ke `/install`.
  Marker `storage/framework/installed` (+`install-token`) ditambah ke `storage/framework/.gitignore`
  agar tak ke-commit (kalau ke-commit, tiap clone/deploy salah dianggap terinstal).
- **Verifikasi visual (Herd):** Welcome, Requirements (semua cek hijau), dan toggle ID semua
  render benar; gerbang redirect `/` → `/install`.
- Test: `InstallWizardTest` (2 lolos — render Inertia + token gate), `InstallationGateTest`
  landing diperbarui ke assert komponen `Install/Wizard`.
