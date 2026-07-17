# Seruwit CRM — Ringkasan Project

CRM multi-tenant berbasis SaaS: setiap perusahaan (tenant) mendapatkan workspace sendiri di subdomain sendiri, dengan CMS + modul CRM yang datanya terisolasi penuh per tenant di level schema PostgreSQL. Fitur opsional dikemas sebagai **modul** yang bisa dipasang/dicopot per tenant, dan hak pasangnya ditentukan oleh **paket langganan**.

## Teknologi

| Lapisan | Teknologi |
|---|---|
| Backend | Laravel 12, PHP 8.5 |
| Frontend | React 18 + Inertia.js v2 + TypeScript, Tailwind CSS v3, Vite |
| Autentikasi | Laravel Breeze (login email/username), Sanctum |
| Database | PostgreSQL — **satu database, satu schema per tenant** |
| Multi-tenancy | `stancl/tenancy` v3.10 (`PostgreSQLSchemaManager`) |
| Testing | PHPUnit 11 — 277 test, berjalan di PostgreSQL (database `seruwit_crm_testing`) |

## Arsitektur Multi-Tenant

```
seruwit.com  (central)          PostgreSQL: 1 database
├─ Landing page marketing       ├─ schema public (central)
├─ Registrasi tenant (SaaS)     │   tenants, domains, users (identitas global),
├─ Portal workspace + SSO       │   tenant_users, invitations, impersonation
├─ Panel super admin            │   tokens, plans
│  ├─ Kelola Tenant             ├─ schema tenant_<id> per tenant
│  └─ Kelola Paket              │   users, roles, permissions, media, menus,
└─ Terima undangan              │   settings, todos, installed_modules, dst.
                                │
acme.seruwit.com (tenant)
└─ Aplikasi CRM lengkap + website publik milik tenant
```

Konsep kunci:

- **Identifikasi via domain** — request ke subdomain/custom domain tenant otomatis mengalihkan seluruh koneksi database ke schema tenant tersebut (`search_path`). Kode aplikasi (model, controller) tidak perlu tahu-menahu soal tenant.
- **Identitas terpusat + resource syncing** — satu akun (email) bisa menjadi anggota banyak perusahaan dengan **peran berbeda di tiap perusahaan**. Nama/email/password tersinkron otomatis antara central dan semua tenant; role tetap lokal per tenant.
- **Provisioning otomatis** — pembuatan tenant memicu pipeline: buat schema → migrasi → seeding (roles, permissions, menus, settings) → pasang modul sesuai paket. Workspace langsung siap pakai.
- **Isolasi menyeluruh** — data database (per schema), file upload (`storage/tenant_<id>/…`, disajikan via route asset tenancy), dan sesi login (cookie per domain).

## Sistem Modul

Fitur inti (users, roles, settings, analytics, media) ikut di setiap tenant dan tidak bisa dicopot. Selain itu adalah **modul opsional**: satu paket kode mandiri di `modules/<Nama>/` (model, controller, request, migrasi, halaman React, view Blade) yang didaftarkan di `config/modules.php` dan mengimplementasikan `App\Modules\ModuleContract`.

```
modules/Carousels/
├─ CarouselsModule.php          # key, label, permissions, menu, requires, boot, routes
├─ Database/{Migrations,Factories}
├─ Http/{Controllers,Requests}
├─ Models/
├─ View/Components/
└─ resources/{js/Pages,views}
```

Aturan main yang menentukan desainnya:

- **Route selalu terdaftar, penegakan di middleware** — registrasi bersyarat akan membekukan status install satu tenant ke dalam `route:cache`. Middleware `requires-module` yang menjaga (404 bila belum terpasang), berjalan sebelum `permission` dan **tanpa bypass admin**.
- **Modul murni konfigurasi saat boot** — `boot()` dan konstruktornya dipanggil jauh sebelum tenant diinisialisasi, jadi hanya boleh mendaftarkan (relasi, observer, komponen Blade), tidak boleh query.
- **Uninstall itu non-destruktif** — tabel & data modul tetap hidup; reinstall memulihkan semuanya. Data baru benar-benar dibuang oleh `modules:purge-expired` setelah masa tenggang `modules.purge_after_days` (default 30 hari), dijadwalkan tiap hari pukul 03:00.
- **Satu view-model** — `App\Modules\ModuleCatalog` dipakai bersama oleh katalog milik admin workspace, panel super admin per tenant, dan `modules:list`, supaya ketiganya tak mungkin berbeda pendapat soal status modul.
- **Halaman React modul menimpa core** — `resources/js/app.tsx` mencari `modules/<Nama>/resources/js/Pages/<name>.tsx` dulu, baru jatuh ke `./Pages/<name>.tsx`, sehingga sebuah halaman tetap bernama sama saat dipindahkan ke modul. `Modules::pageEntrypoint()` mengulang urutan yang sama di sisi server untuk preload `@vite` di `app.blade.php`; keduanya harus selalu sepakat, dan `ModulePageEntrypointTest` yang menjaganya.

Modul terdaftar saat ini: **Carousels**.

## Paket Langganan & Entitlement

Paket menentukan modul apa yang **boleh** dipasang tenant; install/uninstall menentukan apa yang **sedang** dipasang. Keduanya terpisah:

- **Paket hidup di tabel `plans` (central)**, bukan di config — isi paket adalah keputusan komersial yang bergerak lebih cepat dari rilis, jadi diedit dari UI super admin (`/module/plans`, gate `manage-plans`). Yang tetap berupa kode adalah modul mana yang *ada* (`config/modules.php`).
- **Tenant menyimpan key paket** di kolom JSON `data->plan` yang memang sudah dimuat tenancy — tidak ada join untuk tahu paket sebuah tenant. Tenant tanpa key memakai paket default (`basic`).
- **Baca paket lewat `App\Modules\PlanRepository`**, jangan query telanjang. `Plan` dipatok ke koneksi central (entitlement dicek dari konteks tenant, di mana tabel central tak terjangkau), dan repository memoize seluruh set per request — satu query central per request, bukan satu per pengecekan. Tiap penyimpanan `Plan` otomatis mem-flush memo itu.
- **Downgrade ≠ uninstall** — kehilangan entitlement membuat modul terkunci (`locked_with_data`) tanpa menyentuh datanya dan tanpa memulai jam purge. Upgrade mengembalikannya persis seperti semula.

Status modul yang bisa muncul di katalog: `available`, `installed`, `uninstalled` (data masih ada, menunggu purge), `locked`, `locked_with_data`.

Paket bawaan (`PlanSeeder`, re-runnable dan tidak pernah menimpa definisi yang sudah hidup):

| Key | Modul | Catatan |
|---|---|---|
| `free` | — | CMS inti saja |
| `basic` | `carousels` | **Default** — sama dengan yang dimiliki tenant sebelum paket ada |
| `pro` | `carousels` | Seluruh modul yang tersedia |

## Fitur yang Sudah Dikembangkan

### Aplikasi CRM / CMS (berjalan per tenant)
- **Dashboard** per peran + pencarian global
- **Katalog Modul** (`/module/modules`) — admin workspace memasang/mencopot modul yang dientitle paketnya; modul terkunci menampilkan paket mana yang membukanya
- **Carousels** *(modul)* — carousel beserta manajemen & pengurutan gambar
- **Media Library** — upload, picker, bulk delete; file terisolasi per tenant
- **Menus** — menu dinamis per peran; entri modul ikut hilang saat modul dicopot
- **Settings** — pengaturan situs per tenant (nama, logo, kontak, dsb.)
- **Users, Roles & Permissions** — RBAC custom per modul+aksi (view/create/update/delete); admin melewati semua cek
- **Todos, Live Updates, Analytics**
- **Profil** — edit profil, avatar, ganti password

### Landing Page (central)
- Tema CRM segar & minimalis, warna utama biru terang (sky blue): header sticky, hero dengan mockup dashboard pipeline, 6 kartu fitur, strip keunggulan, CTA gradasi biru, footer — konten diambil dari Settings.

### Autentikasi & Identitas
- Login dengan email **atau** username; pencatatan `last_login_at`
- Registrasi = **pendaftaran perusahaan** (nama, email, password, nama perusahaan, subdomain) → tenant dibuat → langsung SSO masuk workspace; registrasi dinonaktifkan di domain tenant
- Validasi subdomain: format, daftar reserved (`www`, `admin`, `api`, …), ketersediaan

### Portal Workspace & SSO
- `/workspaces` (central): daftar perusahaan milik user, klik → token impersonation sekali-pakai (TTL 60 detik) → sesi login terbuka di domain tenant
- Tenant switcher lintas domain tanpa login ulang

### Onboarding & Administrasi Platform
- **Dua pintu pembuatan tenant**: registrasi mandiri (SaaS) dan panel super admin (`/module/tenants`: list, buat untuk pelanggan, tangguhkan/aktifkan) — gate `manage-tenants`
- **Panel per tenant** — super admin mengganti paket sebuah tenant dan memasang/mencopot modulnya langsung dari halaman detail tenant
- **Kelola Paket** (`/module/plans`) — CRUD paket beserta daftar modulnya; menampilkan jumlah tenant per paket
- **Penangguhan tenant**: seluruh request ke tenant suspended diblokir (403)
- **Sistem undangan**: admin workspace mengundang via email + pilihan peran; undangan berlaku 7 hari; penerima baru cukup set nama+password, penerima lama tinggal menerima — keduanya berakhir SSO langsung masuk workspace

## Perintah Penting

```bash
composer dev              # server + queue + log + vite sekaligus
php artisan test --compact
composer deploy           # migrate central + migrate semua tenant + cache config/route/view
php artisan tenants:migrate   # migrasi seluruh schema tenant
pg_dump -n 'tenant<id>' seruwit_crm   # backup satu tenant

# Modul
php artisan modules:list {tenant}                 # entitlement + status install satu tenant
php artisan modules:install {tenant} {module}     # pasang (memulihkan data bila pernah dicopot)
php artisan modules:uninstall {tenant} {module}   # copot, data disimpan sampai masa tenggang habis
php artisan modules:backfill [--tenant=]          # tandai modul lama sebagai terpasang (idempotent)
php artisan modules:purge-expired                 # buang data modul yang tenggangnya lewat (terjadwal 03:00)
```

## Konfigurasi Penting

| Kunci | Keterangan |
|---|---|
| `CENTRAL_SERVES_APP` | `true` (default, dev): CRM juga disajikan di central. **Set `false` di produksi** — central hanya landing, auth, portal, admin |
| `config/modules.php` | Daftar kelas modul terdaftar + `purge_after_days` |
| `config/tenancy.php` | Schema manager PostgreSQL, central domains, bootstrapper (database, filesystem, queue aktif; cache menunggu Redis) |
| Migrasi | `database/migrations/` = central; `database/migrations/tenant/` = per tenant; `modules/*/Database/Migrations/` = per modul (dijalankan ke schema tenant saat install) |
| Route | `routes/web.php` = central (prefix nama `central.`, plus `/module/tenants` & `/module/plans`); `routes/tenant.php` = domain tenant; `routes/app.php` = aplikasi CRM bersama; route modul didaftarkan dari dalam grup `module.` |

## Catatan Produksi

1. Wildcard DNS `*.domain.com` + wildcard SSL (Cloudflare/Caddy)
2. Ubah pipeline provisioning ke queued (`shouldBeQueued(true)`) + jalankan queue worker
3. PgBouncer harus *session mode* (schema separation bergantung `search_path`)
4. Aktifkan `CacheTenancyBootstrapper` saat pindah ke Redis (`CACHE_STORE=redis`)
5. Jalankan scheduler (`php artisan schedule:work` / cron) — `modules:purge-expired` bergantung padanya
6. `modules:backfill` sekali setelah rilis sistem modul, agar tenant lama tidak kehilangan akses ke modul yang sudah mereka pakai

## Pekerjaan yang Sedang Berjalan

- **Ekstraksi Pages & Posts menjadi modul** — halaman React-nya sudah dihapus, tapi controller, route, dan entri MenuSeeder-nya masih ada, sehingga kedua fitur ini belum bisa dipakai sampai ekstraksinya selesai.
