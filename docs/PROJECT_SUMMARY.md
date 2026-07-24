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
| PDF | `barryvdh/laravel-dompdf` v3 — surat jalan (Orders) & invoice (Invoicing), template Blade berbasis tabel |
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

(Modul yang lebih baru — Fleet, Partners, Product, Inventory, Transportation Management, Orders, Billing, Invoicing, Document, Maintenance, Rental, dan Canvassing — murni React/Inertia tanpa `View/Components`; strukturnya `Database/{Migrations,Factories}`, `Http/{Controllers,Requests}`, `Models/`, `resources/js/Pages/`, plus `Observers/` dan `resources/views/` untuk template PDF bila modulnya butuh.)

Aturan main yang menentukan desainnya:

- **Route selalu terdaftar, penegakan di middleware** — registrasi bersyarat akan membekukan status install satu tenant ke dalam `route:cache`. Middleware `requires-module` yang menjaga (404 bila belum terpasang), berjalan sebelum `permission` dan **tanpa bypass admin**.
- **Modul murni konfigurasi saat boot** — `boot()` dan konstruktornya dipanggil jauh sebelum tenant diinisialisasi, jadi hanya boleh mendaftarkan (relasi, observer, komponen Blade), tidak boleh query.
- **Uninstall itu non-destruktif** — tabel & data modul tetap hidup; reinstall memulihkan semuanya. Data baru benar-benar dibuang oleh `modules:purge-expired` setelah masa tenggang `modules.purge_after_days` (default 30 hari), dijadwalkan tiap hari pukul 03:00.
- **Satu view-model** — `App\Modules\ModuleCatalog` dipakai bersama oleh katalog milik admin workspace, panel super admin per tenant, dan `modules:list`, supaya ketiganya tak mungkin berbeda pendapat soal status modul.
- **Halaman React modul menimpa core** — `resources/js/app.tsx` mencari `modules/<Nama>/resources/js/Pages/<name>.tsx` dulu, baru jatuh ke `./Pages/<name>.tsx`, sehingga sebuah halaman tetap bernama sama saat dipindahkan ke modul. `Modules::pageEntrypoint()` mengulang urutan yang sama di sisi server untuk preload `@vite` di `app.blade.php`; keduanya harus selalu sepakat, dan `ModulePageEntrypointTest` yang menjaganya.
- **Modul tak pernah tahu soal "konsumennya"** — sebuah modul hanya boleh tahu tentang modul yang ia `requires()`, tak pernah sebaliknya. Mis. `Fleet` (kendaraan & sopir) dan `Partners` sama sekali tak tahu soal `Trip` yang memakainya; relasi lintas modul (`vehicle_id`, `partner_id`, dst.) dilindungi lewat foreign key `constrained()` biasa (tanpa cascade) di migrasi milik modul **konsumen**, dan `QueryException` dari pelanggaran constraint itu ditangkap jadi pesan yang ramah, bukan lewat pengecekan level aplikasi.
- **Auto-install berantai** — `ModuleInstaller::install()` memasang lebih dulu setiap modul yang di-`requires()` (rekursif) sebelum memasang modul yang diminta, tetap menegakkan entitlement paket di tiap level. Memasang `transportation` misalnya otomatis ikut memasang `fleet`, `partners`, dan `products`.

### Tier Modul — Lintas Lini Bisnis vs Spesifik

Setiap modul mendeklarasikan **tier**-nya lewat `tier(): ModuleTier` (`App\Modules\ModuleTier`). Ini yang menjadikan pemisahan "dipakai semua lini bisnis" vs "khusus satu lini" sebagai fakta yang dibawa kode, bukan konvensi di kepala orang:

| Tier | Arti | Modul |
|---|---|---|
| `Content` | Situs publik tenant; lepas dari lini bisnis apa pun | `pages`, `posts`, `carousels` |
| `Foundation` | Sumber daya lintas lini bisnis — dipakai ulang lini mana pun | `fleet`, `partners`, `products`, `inventory`, `document`, `maintenance`, `invoicing`, `tracking` |
| `Vertical` | Operasi khusus satu lini bisnis, dibangun di atas Foundation | `transportation`, `orders`, `billing`, `rental`, `canvassing` |

**Aturan lapisnya keras**: dependency hanya boleh mengalir ke tier yang **lebih rendah atau sama**. Vertical boleh me-`requires()` Foundation; Foundation tak pernah boleh menarik Vertical — itu akan mengelas satu lini bisnis ke dalam basis bersama yang seharusnya dipakai ulang lini lain. Ini pernyataan level-lapisan dari aturan "modul tak pernah tahu konsumennya", dan ditegakkan oleh `App\Modules\ModuleLayering` + `ModuleLayeringTest`, yang juga menolak `requires()` yang tak bisa di-resolve (`ModuleInstaller` diam-diam melewati key tak dikenal sebagai "fitur core", jadi salah ketik akan lolos tanpa penjaga ini).

Grup sidebar diturunkan dari tier ini (prop `moduleTiers`), bukan daftar hardcoded — modul baru otomatis masuk grup yang benar.

Modul terdaftar saat ini:

| Modul (`key`) | Tier | Deskripsi | `requires()` |
|---|---|---|---|
| `carousels` | Content | Carousel + manajemen & pengurutan gambar | `media` |
| `pages` | Content | Page builder GrapesJS untuk situs publik tenant (homepage `/` + `/p/{slug}`) | `media` |
| `posts` | Content | Blog untuk situs publik tenant (`/blog`) | `media` |
| `fleet` | Foundation | Kendaraan & sopir, dipakai ulang oleh modul lain | `media` |
| `partners` | Foundation | Manajemen kontak terpadu (pelanggan, vendor, supplier) lintas modul — menggantikan modul `customers` yang lama | — |
| `products` | Foundation | Katalog produk lengkap: principals, brands, product types, attributes, tags — taksonomi penuh. Satuan (unit) dikelola lewat Settings grup `units` | — |
| `inventory` | Foundation | Gudang (warehouses), lokasi penyimpanan, stok level, pergerakan stok (ledger), stock opname, dan alert stok rendah | `products` |
| `document` | Foundation | Dokumen kepatuhan kendaraan & sopir, tracking kedaluwarsa + pengingat | `fleet`, `media` |
| `maintenance` | Foundation | Work order perawatan kendaraan: jadwal, biaya, pengingat servis | `fleet` |
| `invoicing` | Foundation | **Dokumen invoice generik**: baris invoice, lifecycle draft/issued/paid, PDF. Sengaja tak tahu apa pun tentang *apa* yang ditagih | `partners` |
| `tracking` | Foundation | **Integrasi GPS Traccar**: pairing device↔kendaraan, tarik posisi live (polling per menit), peta armada Leaflet, odometer otomatis. Sengaja tak tahu apa pun tentang *trip* — konsumen berlangganan event | `fleet` |
| `transportation` | Vertical | Dispatch trip, stop multi-titik (pickup/dropoff berurutan), checkpoint (manual **atau** GPS otomatis), jarak & geofence dari telemetri, jadwal trip berulang + kalender, manifest kargo, laporan biaya/utilisasi | `fleet`, `partners`, `products` |
| `orders` | Vertical | Delivery order pelanggan, konsolidasi banyak order ke satu trip (stop dropoff dibuat otomatis), dan surat jalan cetak (PDF) | `transportation` |
| `billing` | Vertical | Tarif rute, harga per delivery order (charge), penerbitan invoice dari order terkirim (dokumennya milik Invoicing), dan uang jalan sopir per trip | `orders`, `invoicing` |
| `rental` | Vertical | Booking rental kendaraan dengan lifecycle (draft → confirmed → active → returned → completed), tarif harian/mingguan/bulanan, limit km, pelaporan kerusakan, perpanjangan | `fleet`, `partners`, `invoicing` |
| `canvassing` | Vertical | Monitoring field sales: salesperson, kunjungan (visit) dengan check-in/check-out GPS, rencana kunjungan harian, target performa, dan portal mobile untuk salesperson | `partners` |

**Invoicing vs Billing**: keduanya dulu satu modul, yang membuat penagihan hanya mungkin bila tenant menjalankan logistik. Sekarang `invoicing` memegang dokumennya dan `billing` memegang kosakata logistiknya (tarif, rute, delivery order). Sebuah `invoice_line` membawa deskripsi + jumlah + `source` polimorfik opsional yang menunjuk balik ke apa pun yang menerbitkannya — `OrderCharge` hari ini, booking travel nanti. Konsekuensinya, "sudah ditagih atau belum" dijawab oleh **ada/tidaknya invoice line** yang menunjuk charge itu; `order_charges` sengaja tak menyimpan `invoice_id` agar tak ada jawaban kedua yang bisa berbeda pendapat.

**Tracking (GPS) sebagai Foundation, bukan Vertical**: pelacakan kendaraan dipakai ulang lini bisnis mana pun (logistik sekarang, rental nanti), dan tier-nya melarang `tracking` mengenal `transportation`. Karena itu integrasi trip **dibalik lewat event**: perintah `tracking:poll` (jadwal per menit, satu HTTP call per tenant, pola `$tenant->run()` seperti `modules:purge-expired`) menarik posisi dari server Traccar tenant, lalu men-*dispatch* `VehiclePositionsRecorded` yang berisi DTO polos + ambang batas. `TransportationManagementModule::boot()` mendaftarkan listener `TrackTripProgress` yang menuliskan jejak checkpoint (ter-throttle → arsip trip permanen), mengakumulasi `trips.distance_km`, dan meng-*arrive*-kan stop yang masuk radius geofence — **hanya arrived, tak pernah completed**, karena meng-complete dropoff-lah yang menandai delivery order terkirim (fakta yang memicu tagihan) dan false-positive GPS tak boleh menyelesaikan pengiriman. Transportation **tidak** me-`requires('tracking')` sehingga tetap jalan tanpa GPS; event-nya diam saja. Kredensial Traccar per tenant disimpan terenkripsi di tabel milik modul (`tracking_configs`), bukan di `settings` yang plaintext. `vehicle_positions` (satu baris/kendaraan/menit) adalah tabel terbesar sistem — dipangkas `tracking:prune` ke jendela retensi; odometer memakai skema akumulator meter agar delta sub-kilometer tak terus dibulatkan ke nol. Peta memakai **Leaflet + OpenStreetMap** (komponen bersama di `resources/js/Components/Map/`, tanpa API key; self-host tile jadi follow-up sebelum menskala).

**Wajah publik modul**: route publik Pages (`/`, `/p/{slug}`) dan Posts (`/blog`) tetap tinggal di core (`routes/app.php`) karena situs publik tenant ada terlepas dari modulnya — controller-nya (`PageController`, `BlogController`) yang menjaga diri dengan `Modules::available('pages'/'posts')`: homepage jatuh ke landing bawaan `Welcome`, `/p/{slug}` dan `/blog` menjadi 404, bukan 500. Pola yang sama dipakai GlobalSearch, Dashboard, dan Analytics untuk statistik/pencarian Page/Post (prop di-omit saat modul tak tersedia, seperti carousels).

**Notifikasi in-app sebagai core, bukan modul**: banyak modul perlu memberi tahu staf, jadi tabel `notifications` (standar Laravel) ada di path migrasi core — di **kedua** `database/migrations/` (central + test) dan `database/migrations/tenant/` (per tenant), sama seperti users/settings — dan menjangkau tenant lama lewat `tenants:migrate`. Data bell dibagikan lewat prop `notificationCenter` di `HandleInertiaRequests` (dinamai beda dari prop halaman `notifications` agar tak bertabrakan). Perubahan status kiriman di-emit dari `TripObserver` (bukan observer model `DeliveryOrder`), karena transisi status memakai bulk `update()` yang tak memicu Eloquent event — pola yang sama menjadi alasan notifikasi & event `ShipmentStatusChanged` diletakkan di titik yang mengubah status, bukan di model.

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
| `pro` | `billing`, `carousels`, `fleet`, `inventory`, `invoicing`, `orders`, `pages`, `partners`, `posts`, `products`, `tracking`, `transportation` | Hampir seluruh modul |

> **Celah entitlement (sudah ditutup)**: `document` dan `maintenance` kini masuk paket `pro` di `PlanSeeder`. Untuk instalasi lama yang barisnya sudah ada (`firstOrCreate`), tambahkan keduanya ke paket lewat `/module/plans`.

> **`rental` dan `canvassing` belum masuk paket mana pun** — keputusan komersial (pricing) belum ditetapkan. Kedua modul aktif di kode tapi hanya bisa dipasang manual oleh super admin per tenant sampai ada paket yang meng-entitle-nya.

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
- **Partners** *(modul)* — manajemen kontak terpadu (pelanggan, vendor, supplier) lintas modul; menggantikan modul Customer yang lama
- **Product** *(modul)* — katalog produk lengkap dengan taksonomi: principals, brands, product types, attributes, tags; satuan (unit) dipilih dari daftar terkelola di Settings grup `units`
- **Inventory** *(modul, `requires: products`)* — gudang (warehouses), lokasi penyimpanan, stok level, pergerakan stok (ledger), stock opname, dan alert stok rendah
- **Rental** *(modul, `requires: fleet, partners, invoicing`)* — booking rental kendaraan dengan lifecycle (draft → confirmed → active → returned → completed), tarif harian/mingguan/bulanan, limit km, pelaporan kerusakan, perpanjangan
- **Canvassing** *(modul, `requires: partners`)* — monitoring field sales: salesperson, kunjungan (visit) dengan check-in/check-out GPS, rencana kunjungan harian, target performa, dan portal mobile untuk salesperson
- **Transportation Management** *(modul, `requires: fleet, partners, products`)* — dispatch trip (deteksi bentrok kendaraan/sopir per tanggal), stop multi-titik per trip (pickup/dropoff berurutan dengan status pending → arrived → completed), tracking checkpoint GPS saat trip berjalan, manifest kargo per trip (produk + kuantitas), jadwal trip berulang (hari-dalam-minggu + generate otomatis, idempoten), kalender (tampilan minggu/bulan/tahun), laporan biaya & utilisasi
- **Orders** *(modul, `requires: transportation`)* — delivery order pelanggan dengan lifecycle draft → confirmed → assigned → in_transit → delivered, item order, konsolidasi banyak order ke satu trip (stop dropoff dibuat otomatis dari alamat kiriman; status order tersinkron dengan lifecycle trip via observer), dan cetak surat jalan PDF
- **Tracking** *(modul, `requires: fleet`)* — integrasi GPS Traccar: pairing device↔kendaraan (sync dari Traccar), tarik posisi live via `tracking:poll` per menit, peta armada Leaflet + OSM dengan refresh polling, odometer kendaraan otomatis, dan jejak rute + geofence-arrival + jarak trip yang di-feed ke Transportation lewat event (Foundation → tak mengenal trip)
- **Document** *(modul, `requires: fleet, media`)* — dokumen kepatuhan kendaraan & sopir (tipe dokumen terkelola), tracking kedaluwarsa + pengingat otomatis (DocumentReminder via observer)
- **Maintenance** *(modul, `requires: fleet`)* — work order perawatan kendaraan: kategori, item pekerjaan + biaya, dan jadwal servis preventif
- **Invoicing** *(modul, `requires: partners`)* — dokumen invoice generik: baris invoice dengan `source` polimorfik, lifecycle issue/pay/void, dan PDF ber-kop perusahaan dari Settings. Dipakai bersama modul mana pun yang menagih
- **Billing** *(modul, `requires: orders, invoicing`)* — master tarif rute (umum/per pelanggan, tarif spesifik menang), harga per delivery order terisi otomatis saat confirm (bisa di-override sampai tertagih), penerbitan invoice dari order terkirim (PPN dari Settings `ecommerce.*`), dan uang jalan sopir per trip (kasbon → pengeluaran per kategori → settlement dengan saldo dua arah)
- **Media Library** — upload, picker, bulk delete; file terisolasi per tenant
- **Menus** — menu dinamis per peran; entri modul ikut hilang saat modul dicopot
- **Settings** — pengaturan dikelompokkan per grup, satu halaman per grup, nilai diedit langsung sebagai form field (bukan tabel). Tenant boleh mengedit **nilai** setting miliknya sendiri (mis. tautan media sosial berbeda tiap tenant, lewat izin `settings:update` biasa); mendefinisikan/mengganti nama/menghapus sebuah setting adalah kapasitas **central-only** (gate `manage-settings`) yang otomatis menyebar ke semua tenant saat dibuat (idempoten — tenant yang sudah punya key yang sama tak tertimpa)
- **Users, Roles & Permissions** — RBAC custom per modul+aksi (view/create/update/delete); admin melewati semua cek
- **Pusat Notifikasi** *(core)* — notifikasi in-app via database channel Laravel + lonceng di topbar (badge unread, dropdown, halaman `/module/notifications`). Satu kelas `GenericNotification` generik; penerima dipilih `NotificationRecipients::forPermission($module,$action)` (admin ∪ pemegang izin). Dipakai alert kedaluwarsa dokumen & perubahan status kiriman
- **Tracking Publik Pelanggan** *(Orders)* — halaman `/track/{token}` tanpa login (token acak per DO, bukan kode berurutan): timeline status + posisi kendaraan di peta saat trip berjalan. Payload minimal (tanpa harga/data driver); draft/cancelled → 404. Perubahan status juga men-*dispatch* event `ShipmentStatusChanged` sebagai seam push email/WA ke pelanggan nanti
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
- **Tiga pintu pembuatan/pengelolaan tenant**: registrasi mandiri (SaaS), panel super admin (`/module/tenants`: list, buat untuk pelanggan, tangguhkan/aktifkan), dan panel reseller (scope terbatas ke tenant miliknya) — gate `manage-tenants` (admin atau reseller)
- **Reseller Management** — reseller punya akses central terbatas ke `/module/tenants` untuk tenant miliknya; lihat bagian Reseller Management di atas
- **Super admin workspace entry** — super admin dapat memasuki workspace tenant mana pun tanpa perlu keanggotaan (impersonates admin pertama)
- **Panel per tenant** — super admin mengganti paket sebuah tenant dan memasang/mencopot modulnya langsung dari halaman detail tenant
- **Kelola Paket** (`/module/plans`) — CRUD paket beserta daftar modulnya; menampilkan jumlah tenant per paket dan status nonaktif dari Module Registry
- **Kelola Modul Platform** (`/module/registry`) — saklar enable/disable per modul untuk seluruh tenant sekaligus, lepas dari paket/status install (lihat Module Registry di atas) — gate `manage-module-registry`
- **Penangguhan tenant**: seluruh request ke tenant suspended diblokir (403)
- **Sistem undangan**: admin workspace mengundang via email + pilihan peran; undangan berlaku 7 hari; penerima baru cukup set nama+password, penerima lama tinggal menerima — keduanya berakhir SSO langsung masuk workspace

### Reseller Management — Model Akses Tiga Tier

Platform menerapkan model akses central tiga tier:

| Role | Akses central `/module/*` | Kelola tenant |
|---|---|---|
| Super Admin | Seluruh control plane platform | Semua tenant |
| Reseller | `/module/tenants` saja | Tenant miliknya (`reseller_global_id`) |
| SaaS Customer | Diarahkan ke portal workspace | Tidak ada |

Detail implementasi:
- `reseller_global_id`: nullable UUID di tabel `tenants`, FK ke `users.global_id` — menandai tenant mana yang "dimiliki" reseller
- Gate `manage-tenants` sekarang terbuka untuk admin **atau** reseller
- `TenantController` men-scope seluruh query berdasarkan `reseller_global_id` untuk user dengan role reseller
- Reseller dikecualikan dari middleware redirect ke portal workspace (tetap di central)
- Role `reseller` didaftarkan di `RoleSeeder`
- Super admin dapat memasuki workspace tenant mana pun tanpa keanggotaan (impersonates admin pertama tenant tersebut)

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
php artisan modules:migrate [--tenant=] [--pretend] # jalankan migrasi modul yang ditambahkan SETELAH tenant meng-install modulnya (idempotent)
php artisan modules:purge-expired                 # buang data modul yang tenggangnya lewat (terjadwal 03:00)

# GPS Tracking
php artisan tracking:poll [--tenant=]             # tarik posisi terbaru dari Traccar tiap tenant (terjadwal per menit)
php artisan tracking:prune [--tenant=]            # pangkas vehicle_positions ke jendela retensi (terjadwal 03:30)

# Notifikasi & kepatuhan
php artisan document:scan-expiring [--tenant=]    # buat reminder + alert in-app dokumen mau/telah habis (terjadwal 06:00)
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
4. Jalankan scheduler (`php artisan schedule:work` / cron) — `modules:purge-expired`, `tracking:poll` (per menit), `tracking:prune`, dan `document:scan-expiring` bergantung padanya
5. `modules:backfill` sekali setelah rilis sistem modul, agar tenant lama tidak kehilangan akses ke modul yang sudah mereka pakai
6. **`modules:migrate` di setiap deploy** — migrasi modul hanya jalan saat modul di-*install* ke sebuah tenant, jadi migrasi yang ditambahkan ke modul yang **sudah** terpasang tak pernah menyusul ke tenant yang meng-install-nya lebih dulu (`tenants:migrate` dari stancl hanya menangani `database/migrations/tenant/`, bukan path modul). `modules:migrate` menutup celah itu: idempoten, jalankan setelah `tenants:migrate` di `composer deploy`.
7. `SettingController::store()` menyebarkan setting baru ke **semua** tenant secara sinkron dalam satu request (`Tenant::query()->get()->each(...)`) — proporsional untuk jumlah tenant saat ini, tapi jadi kandidat kuat untuk di-queue kalau jumlah tenant sudah besar

## Pekerjaan yang Sedang Berjalan

Aplikasi kini menyasar **beberapa industri** (transportasi/logistik, rental kendaraan, field sales/canvassing), bukan hanya logistik. Roadmap awal 5 fase tetap relevan untuk lini logistik, sementara `rental` dan `canvassing` adalah vertikal baru di luar fase tersebut.

### Roadmap Logistik (5 Fase)

| Fase | Isi | Status |
|---|---|---|
| 1 | Integrasi server GPS: live tracking, auto-checkpoint, geofencing, odometer | ✅ Selesai (modul `tracking` + listener di `transportation`) |
| 2 | Delivery Order + multi-stop trip + surat jalan | ✅ Selesai (modul `orders` + stop di `transportation`) |
| 3 | Proof of Delivery + tampilan driver (PWA) | Belum |
| 4 | Tarif → invoice → uang jalan | ✅ Selesai (modul `billing` + `invoicing`) |
| 5 | Notifikasi in-app, tracking publik pelanggan, gating dispatch lanjutan | ✅ Selesai (pusat notifikasi core, alert kedaluwarsa dokumen, halaman `/track/{token}`, gating status/kedaluwarsa) |

Semua 5 fase inti sudah jalan. Kandidat lanjutan: **Fase 3 (Proof of Delivery + tampilan driver/PWA)** — satu-satunya fase roadmap yang belum dikerjakan; menutup siklus dengan bukti serah terima yang diinput driver.

### Vertikal Baru (di luar roadmap logistik)

| Vertikal | Status | Catatan |
|---|---|---|
| `rental` | Modul tersedia, belum masuk paket | Booking rental kendaraan lengkap; keputusan pricing pending |
| `canvassing` | Modul tersedia, belum masuk paket | Field sales monitoring + portal mobile; keputusan pricing pending |

Catatan terbuka:

- **Push notifikasi ke pelanggan ditunda**: Fase 5 hanya membangun halaman tracking publik (pull) + event `ShipmentStatusChanged`; belum ada listener yang mengirim email/WA (mail driver `log`, WA belum ada). Saat channel dikonfigurasi, cukup tambah listener ke event itu.
- **Time-overlap dispatch ditunda**: gating baru mengecek status kendaraan/driver + kedaluwarsa STNK/KIR/SIM + bentrok per-tanggal; overlap waktu sebenarnya butuh kolom durasi/`scheduled_end_at` di trip.
- **Notifikasi kedaluwarsa dokumen** butuh scheduler jalan (`document:scan-expiring` harian) dan tenant memasang modul `document`.
- Pencocokan tarif Billing memakai alamat free-text (exact, case-insensitive) — typo alamat menghasilkan charge 0 yang harus diisi manual; master lokasi + dropdown alamat di form order adalah perbaikan strukturalnya. Master lokasi yang sama juga akan mempermudah mengisi lat/lng stop trip, yang saat ini prasyarat geofence-arrival GPS.
- Menghapus trip yang punya uang jalan / partner yang direferensikan invoice muncul sebagai `QueryException` mentah di UI modul hulunya (by design — modul hulu tak boleh kenal konsumennya); handler pesan ramah bisa ditambahkan per pola Fleet.
- **GPS Tracking — terverifikasi terhadap server Traccar asli (sky-track.net, 2026-07-20)**: akun tenant biasanya **admin/manager** reseller GPS, jadi `TraccarClient::devices()` memakai `?all=true` (fallback ke `/devices` polos untuk akun user biasa yang menolaknya), dan `latestPositions()` mengambil via positionId per-device (`/positions?id=…`) — bukan `/api/positions` polos yang untuk admin selalu `[]`. Batch di-chunk 50 dan **memecah diri saat 400**, karena satu positionId basi (posisi lama yang sudah dipangkas Traccar untuk device offline) mem-400-kan seluruh batch. `PositionPayload` **tidak** menolak `valid=false` (kendaraan parkir melapor valid=false dengan koordinat terakhir yang sah); hanya null-island 0,0 & di luar rentang yang dibuang. Terbukti: 260 device → 253 posisi masuk.
- **Skala polling GPS**: `tracking:poll` sinkron per tenant per menit — sepele di ~5 tenant, melewati jendela 60 detik di ~100. `QueueTenancyBootstrapper` sudah aktif, jadi perbaikannya operasional (satu queued job per tenant + jalankan worker), bukan arsitektur. `vehicle_positions` tumbuh ~26 juta baris/tahun per 50 kendaraan; retensi dipangkas `tracking:prune`.
- **Tile OSM**: dipakai untuk Fase 1 (tanpa API key), tapi kebijakan OSMF membatasi penggunaan komersial berat — self-host tile (bisa lewat box Traccar) sebelum jumlah tenant/beban naik. URL template ada di satu tempat (`resources/js/Components/Map/LeafletMap.tsx`) agar mudah diganti.
- **Otoritas odometer**: saat device ter-pair, `tracking:poll` menulis `vehicles.odometer_km`. Form edit Fleet dan fuel log juga bisa menulisnya — belum dijadikan read-only saat ter-pair; kalau operator mengeditnya, baseline device perlu di-re-pair agar tak melenceng.
- **Layout baru**: `CanvassingLayout` (portal mobile salesperson untuk modul canvassing) dan `DriverLayout` (disiapkan untuk portal driver di masa depan/Fase 3 PoD) ditambahkan di samping layout utama aplikasi.
- **Rantai dependensi billing yang diperbarui**: `billing` → `orders` → `transportation` → `fleet` + `partners` + `products`; dan `billing` → `invoicing` → `partners`. Perubahan dari `customers` ke `partners` berdampak ke seluruh rantai ini.
- **`rental` dan `canvassing` belum masuk paket** — kedua modul perlu keputusan komersial sebelum di-entitle ke paket tertentu.
