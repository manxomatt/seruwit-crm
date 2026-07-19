# Seruwit CRM — Ringkasan Project

CRM multi-tenant berbasis SaaS: setiap perusahaan (tenant) mendapatkan workspace sendiri di subdomain sendiri, dengan CMS + modul CRM yang datanya terisolasi penuh per tenant di level schema PostgreSQL. Fitur opsional dikemas sebagai **modul** yang bisa dipasang/dicopot per tenant, dan hak pasangnya ditentukan oleh **paket langganan**.

## Teknologi

| Lapisan | Teknologi |
|---|---|
| Backend | Laravel 12, PHP 8.4 |
| Frontend | React 18 + Inertia.js v2 + TypeScript, Tailwind CSS v3, Headless UI v2, Vite |
| Autentikasi | Laravel Breeze (login email/username), Sanctum |
| Database | PostgreSQL — **satu database, satu schema per tenant** |
| Cache | Redis — tenant-aware via `CacheTenancyBootstrapper` (tiap tenant punya namespace cache sendiri) |
| Multi-tenancy | `stancl/tenancy` v3.10 (`PostgreSQLSchemaManager`) |
| Testing | PHPUnit 11 — berjalan di PostgreSQL (database `seruwit_crm_testing`) |

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
├─ View/Components/             # khusus Carousels — komponen Blade untuk landing page
└─ resources/{js/Pages,views}
```

(Modul yang lebih baru — Fleet, Customer, Product, Transportation Management, Orders, dan Billing — murni React/Inertia, tanpa `View/Components`/Blade; strukturnya `Database/{Migrations,Factories}`, `Http/{Controllers,Requests}`, `Models/`, `resources/js/Pages/` saja.)

Aturan main yang menentukan desainnya:

- **Route selalu terdaftar, penegakan di middleware** — registrasi bersyarat akan membekukan status install satu tenant ke dalam `route:cache`. Middleware `requires-module` yang menjaga (404 bila belum terpasang), berjalan sebelum `permission` dan **tanpa bypass admin**.
- **Modul murni konfigurasi saat boot** — `boot()` dan konstruktornya dipanggil jauh sebelum tenant diinisialisasi, jadi hanya boleh mendaftarkan (relasi, observer, komponen Blade), tidak boleh query.
- **Uninstall itu non-destruktif** — tabel & data modul tetap hidup; reinstall memulihkan semuanya. Data baru benar-benar dibuang oleh `modules:purge-expired` setelah masa tenggang `modules.purge_after_days` (default 30 hari), dijadwalkan tiap hari pukul 03:00.
- **Satu view-model** — `App\Modules\ModuleCatalog` dipakai bersama oleh katalog milik admin workspace, panel super admin per tenant, dan `modules:list`, supaya ketiganya tak mungkin berbeda pendapat soal status modul.
- **Halaman React modul menimpa core** — `resources/js/app.tsx` mencari `modules/<Nama>/resources/js/Pages/<name>.tsx` dulu, baru jatuh ke `./Pages/<name>.tsx`, sehingga sebuah halaman tetap bernama sama saat dipindahkan ke modul. `Modules::pageEntrypoint()` mengulang urutan yang sama di sisi server untuk preload `@vite` di `app.blade.php`; keduanya harus selalu sepakat, dan `ModulePageEntrypointTest` yang menjaganya.
- **Modul tak pernah tahu soal "konsumennya"** — sebuah modul hanya boleh tahu tentang modul yang ia `requires()`, tak pernah sebaliknya. Mis. `Fleet` (kendaraan & sopir) dan `Customer` sama sekali tak tahu soal `Trip` yang memakainya; relasi lintas modul (`vehicle_id`, `customer_id`, dst.) dilindungi lewat foreign key `constrained()` biasa (tanpa cascade) di migrasi milik modul **konsumen**, dan `QueryException` dari pelanggaran constraint itu ditangkap jadi pesan yang ramah, bukan lewat pengecekan level aplikasi.
- **Auto-install berantai** — `ModuleInstaller::install()` memasang lebih dulu setiap modul yang di-`requires()` (rekursif) sebelum memasang modul yang diminta, tetap menegakkan entitlement paket di tiap level. Memasang `transportation` misalnya otomatis ikut memasang `fleet`, `customers`, dan `products`.

Modul terdaftar saat ini:

| Modul (`key`) | Deskripsi | `requires()` |
|---|---|---|
| `carousels` | Carousel + manajemen & pengurutan gambar | `media` |
| `pages` | Page builder GrapesJS untuk situs publik tenant (homepage `/` + `/p/{slug}`) | `media` |
| `posts` | Blog untuk situs publik tenant (`/blog`) | `media` |
| `fleet` | Kendaraan & sopir, dipakai ulang oleh modul lain | `media` |
| `customers` | Data pelanggan lintas modul (`global_customer_id` disiapkan untuk aplikasi customer-facing lintas tenant di masa depan, belum dipakai) | — |
| `products` | Katalog produk; satuan (unit) dikelola lewat Settings grup `units` | — |
| `transportation` | Dispatch trip, tracking checkpoint, jadwal trip berulang + kalender, manifest kargo, laporan biaya/utilisasi | `fleet`, `customers`, `products` |
| `orders` | Delivery order pelanggan, konsolidasi ke trip, stop pengiriman, dan surat jalan cetak | `transportation` |
| `billing` | Tarif rute, invoice untuk order terkirim, dan uang jalan sopir per trip | `orders` |

**Wajah publik modul**: route publik Pages (`/`, `/p/{slug}`) dan Posts (`/blog`) tetap tinggal di core (`routes/app.php`) karena situs publik tenant ada terlepas dari modulnya — controller-nya (`PageController`, `BlogController`) yang menjaga diri dengan `Modules::available('pages'/'posts')`: homepage jatuh ke landing bawaan `Welcome`, `/p/{slug}` dan `/blog` menjadi 404, bukan 500. Pola yang sama dipakai GlobalSearch, Dashboard, dan Analytics untuk statistik/pencarian Page/Post (prop di-omit saat modul tak tersedia, seperti carousels).

## Paket Langganan & Entitlement

Paket menentukan modul apa yang **boleh** dipasang tenant; install/uninstall menentukan apa yang **sedang** dipasang. Keduanya terpisah:

- **Paket hidup di tabel `plans` (central)**, bukan di config — isi paket adalah keputusan komersial yang bergerak lebih cepat dari rilis, jadi diedit dari UI super admin (`/module/plans`, gate `manage-plans`). Yang tetap berupa kode adalah modul mana yang *ada* (`config/modules.php`).
- **Tenant menyimpan key paket** di kolom JSON `data->plan` yang memang sudah dimuat tenancy — tidak ada join untuk tahu paket sebuah tenant. Tenant tanpa key memakai paket default (`basic`).
- **Baca paket lewat `App\Modules\PlanRepository`**, jangan query telanjang. `Plan` dipatok ke koneksi central (entitlement dicek dari konteks tenant, di mana tabel central tak terjangkau), dan repository memoize seluruh set per request — satu query central per request, bukan satu per pengecekan. Tiap penyimpanan `Plan` otomatis mem-flush memo itu.
- **Downgrade ≠ uninstall** — kehilangan entitlement membuat modul terkunci (`locked_with_data`) tanpa menyentuh datanya dan tanpa memulai jam purge. Upgrade mengembalikannya persis seperti semula.

Status modul yang bisa muncul di katalog: `available`, `installed`, `uninstalled` (data masih ada, menunggu purge), `locked`, `locked_with_data`, `disabled`, `disabled_with_data` (lihat Module Registry di bawah).

Paket bawaan (`PlanSeeder`, re-runnable dan tidak pernah menimpa definisi yang sudah hidup):

| Key | Modul | Catatan |
|---|---|---|
| `free` | — | CMS inti saja |
| `basic` | `carousels`, `pages`, `posts` | **Default** — sama dengan yang dimiliki tenant sebelum paket ada (Pages/Posts dulunya fitur inti) |
| `pro` | `billing`, `carousels`, `customers`, `fleet`, `orders`, `pages`, `posts`, `products`, `transportation` | Seluruh modul yang tersedia |

## Module Registry — Saklar Modul Tingkat Platform

Sumbu ketiga, terpisah dari entitlement paket dan status install: `ModuleRegistry::platformEnabled($key)`, disokong tabel central `module_settings`. `available() = platformEnabled && entitled && installed` — mematikan sebuah modul di sini membuatnya 404 untuk **semua** tenant sekaligus, apa pun paket atau status install mereka, tanpa menyentuh data.

- **Halaman** `/module/registry` (gate `manage-module-registry`, central-only) — daftar semua modul terdaftar beserta toggle enable/disable.
- **Tak mengganggu data atau status install** — menonaktifkan lalu mengaktifkan kembali langsung memulihkan akses persis seperti semula (beda dari uninstall, yang punya masa tenggang purge).
- **Dicek di titik yang sama dengan entitlement** — `ModuleInstaller::install()` menolak memasang modul yang platform-disabled (termasuk saat kena lewat rantai auto-install), dan sidebar/`ModuleCatalog` otomatis menyembunyikannya lewat `available()` yang sama.
- **Halaman Paket** (`/module/plans`) menampilkan status nonaktif ini juga — modul yang dinonaktifkan platform tapi masih ada di daftar sebuah paket ditampilkan sebagai chip "Dinonaktifkan", checkbox-nya terkunci.

## Fitur yang Sudah Dikembangkan

### Aplikasi CRM / CMS (berjalan per tenant)
- **Dashboard** per peran + pencarian global
- **Katalog Modul** (`/module/modules`) — admin workspace memasang/mencopot modul yang dientitle paketnya; modul terkunci (paket) atau dinonaktifkan (platform) menampilkan alasannya
- **Pages** *(modul)* — page builder visual GrapesJS (editor drag-and-drop, set homepage, render publik di `/` dan `/p/{slug}`)
- **Posts** *(modul)* — blog dengan draft & publish, tampil publik di `/blog`
- **Carousels** *(modul)* — carousel beserta manajemen & pengurutan gambar
- **Fleet** *(modul)* — kendaraan & sopir; dipakai ulang modul lain lewat `requires()`, tak pernah sebaliknya
- **Customer** *(modul)* — data pelanggan standalone; `global_customer_id` disiapkan untuk aplikasi customer-facing lintas tenant di masa depan
- **Product** *(modul)* — katalog produk; satuan (unit) dipilih dari daftar terkelola di Settings grup `units`, bukan teks bebas
- **Transportation Management** *(modul, `requires: fleet, customers, products`)* — dispatch trip (deteksi bentrok kendaraan/sopir per tanggal), tracking checkpoint GPS saat trip berjalan, manifest kargo per trip (produk + kuantitas), jadwal trip berulang (hari-dalam-minggu + generate otomatis, idempoten), kalender (tampilan minggu/bulan/tahun), laporan biaya & utilisasi
- **Orders** *(modul, `requires: transportation`)* — delivery order pelanggan, item order, assignment/unassignment ke trip, dan cetak surat jalan
- **Billing** *(modul, `requires: orders`)* — manajemen tarif, charge per delivery order, invoice lifecycle (issue/pay/void + PDF), dan uang jalan per trip
- **Media Library** — upload, picker, bulk delete; file terisolasi per tenant
- **Menus** — menu dinamis per peran; entri modul ikut hilang saat modul dicopot
- **Settings** — pengaturan dikelompokkan per grup, satu halaman per grup, nilai diedit langsung sebagai form field (bukan tabel). Tenant boleh mengedit **nilai** setting miliknya sendiri (mis. tautan media sosial berbeda tiap tenant, lewat izin `settings:update` biasa); mendefinisikan/mengganti nama/menghapus sebuah setting adalah kapasitas **central-only** (gate `manage-settings`) yang otomatis menyebar ke semua tenant saat dibuat (idempoten — tenant yang sudah punya key yang sama tak tertimpa)
- **Users, Roles & Permissions** — RBAC custom per modul+aksi (view/create/update/delete); admin melewati semua cek
- **Todos, Live Updates, Analytics**
- **Profil** — edit profil, avatar, ganti password
- **Dropdown modern** — semua `<select>` di aplikasi memakai komponen `Select` berbasis Headless UI `Listbox` (panel animasi, opsi bisa dinonaktifkan per-item, checkmark pada pilihan aktif), bukan `<select>` native

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
- **Kelola Paket** (`/module/plans`) — CRUD paket beserta daftar modulnya; menampilkan jumlah tenant per paket dan status nonaktif dari Module Registry
- **Kelola Modul Platform** (`/module/registry`) — saklar enable/disable per modul untuk seluruh tenant sekaligus, lepas dari paket/status install (lihat Module Registry di atas) — gate `manage-module-registry`
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
| `config/tenancy.php` | Schema manager PostgreSQL, central domains, bootstrapper (database, filesystem, queue, dan cache — `CacheTenancyBootstrapper` — semuanya aktif; tiap tenant otomatis dapat namespace Redis sendiri) |
| Migrasi | `database/migrations/` = central; `database/migrations/tenant/` = per tenant; `modules/*/Database/Migrations/` = per modul (dijalankan ke schema tenant saat install) |
| Route | `routes/web.php` = central (prefix nama `central.`, plus `/module/tenants`, `/module/plans`, `/module/registry`, dan blok write-route Settings central-only — lihat catatan di bawah); `routes/tenant.php` = domain tenant; `routes/app.php` = aplikasi CRM bersama (dua kali ter-*require*, dari `web.php` **dan** `tenant.php`); route modul didaftarkan dari dalam grup `module.` |

> **Jebakan urutan route Settings**: blok central-only untuk `settings.create/store/edit/update/destroy` di `routes/web.php` **harus** didaftarkan sebelum grup central utama yang me-*require* `app.php` — `GET /settings/{group}` di `app.php` adalah wildcard satu-segmen yang akan "menelan" `GET /settings/create` kalau didaftarkan belakangan, karena Laravel mencocokkan rute domain+method yang sama menurut urutan registrasi, dan `"create"` adalah nilai `{group}` yang sah.

## Catatan Produksi

1. Wildcard DNS `*.domain.com` + wildcard SSL (Cloudflare/Caddy)
2. Ubah pipeline provisioning ke queued (`shouldBeQueued(true)`) + jalankan queue worker
3. PgBouncer harus *session mode* (schema separation bergantung `search_path`)
4. Jalankan scheduler (`php artisan schedule:work` / cron) — `modules:purge-expired` bergantung padanya
5. `modules:backfill` sekali setelah rilis sistem modul, agar tenant lama tidak kehilangan akses ke modul yang sudah mereka pakai
6. `SettingController::store()` menyebarkan setting baru ke **semua** tenant secara sinkron dalam satu request (`Tenant::query()->get()->each(...)`) — proporsional untuk jumlah tenant saat ini, tapi jadi kandidat kuat untuk di-queue kalau jumlah tenant sudah besar

## Pekerjaan yang Sedang Berjalan

- Tidak ada — ekstraksi Pages & Posts menjadi modul (pekerjaan tergantung terakhir) sudah selesai. Untuk tenant lama, jalankan `modules:backfill` sekali setelah deploy agar Pages/Posts tertandai terpasang; entitlement paket live diedit dari `/module/plans`.
