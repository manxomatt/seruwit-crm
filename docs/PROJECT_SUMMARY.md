# Seruwit CRM — Ringkasan Project

CRM multi-tenant berbasis SaaS: setiap perusahaan (tenant) mendapatkan workspace sendiri di subdomain sendiri, dengan CMS + modul bisnis yang datanya terisolasi penuh per tenant di level schema PostgreSQL. Fitur opsional dikemas sebagai **modul** yang bisa dipasang/dicopot per tenant, dan hak pasangnya ditentukan oleh **paket langganan**.

**Status snapshot (Juli 2026):** 28 modul terdaftar · ~217 halaman React modul · ~161 feature test modul · platform menyasar beberapa lini bisnis (distribusi/dagang, logistik, rental, field sales), bukan satu vertikal saja.

## Teknologi

| Lapisan | Teknologi |
|---|---|
| Backend | Laravel 12, PHP 8.4 |
| Frontend | React 18 + Inertia.js v2 + TypeScript, Tailwind CSS v3, Headless UI v2, Vite |
| Autentikasi | Laravel Breeze (login email/username), Sanctum |
| Database | PostgreSQL — **satu database, satu schema per tenant** |
| Cache | Redis — tenant-aware via `CacheTenancyBootstrapper` (tiap tenant punya namespace cache sendiri) |
| Multi-tenancy | `stancl/tenancy` v3.10 (`PostgreSQLSchemaManager`) |
| PDF | `barryvdh/laravel-dompdf` v3 — surat jalan, invoice, PO/GRN/SO/GIN |
| Peta | Leaflet + OpenStreetMap (komponen bersama `resources/js/Components/Map/`) |
| Editor | GrapesJS (Pages), TipTap |
| Testing | PHPUnit 11 — berjalan di PostgreSQL (database `seruwit_crm_testing`) |

## Arsitektur Multi-Tenant

```
seruwit.com  (central)          PostgreSQL: 1 database
├─ Landing page marketing       ├─ schema public (central)
├─ Registrasi tenant (SaaS)     │   tenants, domains, users (identitas global),
├─ Portal workspace + SSO       │   tenant_users, invitations, impersonation
├─ Panel super admin            │   tokens, plans, module_settings
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

Fitur inti (users, roles, settings, analytics, media, notifications) ikut di setiap tenant dan tidak bisa dicopot. Selain itu adalah **modul opsional**: satu paket kode mandiri di `modules/<Nama>/` yang didaftarkan di `config/modules.php` dan mengimplementasikan `App\Modules\ModuleContract`.

```
modules/<Nama>/
├─ <Nama>Module.php             # key, label, tier, permissions, menu, requires, boot, routes
├─ Database/{Migrations,Factories}
├─ Http/{Controllers,Requests}
├─ Models/
├─ Observers/ / Support/ / Listeners/   # bila perlu
└─ resources/{js/Pages,views}           # React/Inertia; Blade untuk PDF bila ada
```

Aturan desain yang wajib dihormati:

- **Route selalu terdaftar, penegakan di middleware** — `requires-module` menjaga akses (404 bila belum terpasang), berjalan sebelum `permission` dan **tanpa bypass admin**.
- **Modul murni konfigurasi saat boot** — `boot()` hanya boleh mendaftarkan (relasi, observer, listener), tidak boleh query tenant.
- **Uninstall non-destruktif** — data tetap hidup sampai `modules:purge-expired` setelah masa tenggang (`purge_after_days`, default 30).
- **Satu view-model** — `ModuleCatalog` dipakai bersama katalog workspace, panel super admin, dan `modules:list`.
- **Halaman React modul menimpa core** — `app.tsx` mencari `modules/<Nama>/resources/js/Pages/` dulu.
- **Modul tak pernah tahu konsumennya** — dependency hanya ke modul yang di-`requires()`; FK lintas modul hidup di migrasi konsumen.
- **Auto-install berantai** — `ModuleInstaller` memasang dependensi rekursif sambil menegakkan entitlement paket.

### Tier Modul

| Tier | Arti | Contoh |
|---|---|---|
| `Content` | Situs publik tenant | `pages`, `posts`, `carousels` |
| `Foundation` | Sumber daya lintas lini bisnis | `fleet`, `partners`, `products`, `inventory`, `sales`, `accounting`, … |
| `Vertical` | Operasi khusus satu lini | `transportation`, `orders`, `billing`, `rental`, `canvassing`, `routing`, … |

**Aturan lapis keras**: dependency hanya boleh ke tier yang lebih rendah atau sama. Ditegakkan `ModuleLayering` + test.

---

## Katalog Modul (28)

### Content — situs publik

| Key | Untuk apa | Cara pakai singkat |
|---|---|---|
| `pages` | Page builder GrapesJS | Buat halaman, set homepage → render di `/` dan `/p/{slug}` |
| `posts` | Blog tenant | Draft/publish → publik di `/blog` |
| `carousels` | Slider gambar | Kelola slide + urutan; dipakai komponen Blade di landing |

Semua Content me-`requires('media')` (fitur core).

### Foundation — dipakai ulang lintas lini

| Key | `requires()` | Untuk apa | Cara pakai singkat |
|---|---|---|---|
| `partners` | — | Kontak terpadu (customer / vendor / supplier) | Master data mitra; ganti modul `customers` lama. Dipakai hampir semua modul dagang & finance |
| `products` | — | Katalog + taksonomi (principal, brand, type, attribute, tag, packaging) | Definisikan SKU & UOM dulu sebelum Inventory/Sales/POS |
| `inventory` | `products` | Gudang, lokasi, stok, ledger, transfer, batch/expiry, opname, reservasi | Siapkan warehouse + lokasi STOCK sebelum SO/PO/POS |
| `fleet` | `media` | Kendaraan & sopir + fuel log / status board | Master armada untuk Transportation, Rental, Tracking, Document, Maintenance |
| `document` | `fleet`, `media` | Dokumen kepatuhan (STNK/KIR/SIM) + reminder | Pasang + jalankan scheduler `document:scan-expiring` |
| `maintenance` | `fleet` | Work order & jadwal servis | WO perawatan; bisa potong stok sparepart bila Inventory ada |
| `tracking` | `fleet` | GPS Traccar: pairing, poll posisi, peta, odometer | Isi kredensial Traccar terenkripsi; event posisi dikonsumsi Transportation & Scoring |
| `scoring` | `fleet`, `tracking` | Skor perilaku sopir + leaderboard + insentif | Aktif setelah Tracking hidup; konsumsi `VehiclePositionsRecorded` |
| `invoicing` | `partners` | Dokumen invoice generik (draft → issued → paid/void) + PDF | Dipakai Billing, Sales, Receivables, Rental — **bukan** modul tarif logistik |
| `receivables` | `partners`, `invoicing` | Pembayaran AR, alokasi, aging, credit limit | Catat DP/angsuran/pelunasan terhadap invoice |
| `purchasing` | `partners`, `products`, `inventory` | PO → GRN → stok masuk + cost moving average | Alur inbound distributor; feed Payables & Accounting |
| `payables` | `partners`, `purchasing` | Supplier bill dari GRN + pembayaran + 3-way match | Tutup hutang supplier setelah GRN |
| `sales` | `partners`, `products`, `inventory` | SO → GIN (stock out) → invoice opsional; return; reservasi | Alur outbound dagang (bukan Delivery Order logistik) |
| `pos` | `products`, `inventory` | Kasir toko: jual, bayar, stock out, shift | Terminal toko/cabang; variance shift bisa masuk Accounting |
| `approvals` | — | Workflow multi-level approve/reject | Soft-integrasi ke PO besar, override kredit, diskon, dll. |
| `accounting` | `partners` | COA, periode fiskal, jurnal, bank, laporan, FA, anggaran | Lapisan GL di atas dokumen operasional via `AccountingPoster` |

### Vertical — lini bisnis spesifik

| Key | `requires()` | Untuk apa | Cara pakai singkat |
|---|---|---|---|
| `transportation` | `fleet`, `partners`, `products` | Dispatch trip, multi-stop, checkpoint, jadwal, kalender, laporan | Inti operasi logistik; opsional konsumsi GPS Tracking via event |
| `orders` | `transportation` | Delivery Order, konsolidasi ke trip, surat jalan PDF, POD, portal driver, tracking publik | DO pelanggan; bridge dari Sales GIN; `/track/{token}` tanpa login |
| `billing` | `orders`, `invoicing` | Tarif rute, charge per DO, uang jalan sopir | Penerbitan invoice dari order terkirim; dokumen invoice milik `invoicing` |
| `outbound` | `orders`, `inventory`, `products` | Pick list → pack/label → dispatch | Gudang outbound sebelum barang naik ke trip |
| `routing` | `transportation`, `orders` | Optimasi rute (VRP-style) + apply ke trip/order | Rencana rute otomatis sebelum/saat dispatch |
| `promotions` | `partners`, `products`, `inventory` | Program promo distributor (volume, free goods, rebate) | Realisasi vs target; terintegrasi Sales/POS pricing |
| `rental` | `fleet`, `partners`, `invoicing` | Booking sewa kendaraan + checkout/return/damage | Vertikal rental; **belum** masuk paket default |
| `canvassing` | `partners` | Field sales: visit GPS, rencana harian, target, portal mobile | Soft-integrasi Sales/Inventory/Promotions; **belum** masuk paket default |
| `bi` | — (soft deps) | Dashboard eksekutif (OTD, utilisasi, aging AR, turnover, revenue/route) | KPI muncul sesuai modul sumber yang terpasang |

### Pemisahan konsep penting

| Konsep | Modul | Bukan |
|---|---|---|
| Invoice (dokumen) | `invoicing` | `billing` (tarif & charge logistik) |
| Sales Order / GIN (dagang) | `sales` | `orders` (Delivery Order logistik) |
| Delivery Order / surat jalan | `orders` | `sales` GIN |
| Partner bank account | `partners` | Company bank di `accounting` |
| GPS posisi | `tracking` | Trip logic di `transportation` (listener event) |

**Invoicing vs Billing:** `invoice_line` membawa deskripsi + jumlah + `source` polimorfik. “Sudah ditagih?” = ada/tidaknya invoice line yang menunjuk charge; `order_charges` sengaja tak menyimpan `invoice_id`.

**Tracking sebagai Foundation:** Transportation **tidak** me-`requires('tracking')`. `tracking:poll` men-dispatch `VehiclePositionsRecorded`; listener di Transportation menulis checkpoint / jarak / geofence-arrival (**arrived saja, tidak auto-complete** dropoff — complete = DO delivered = trigger tagihan).

---

## Panduan Penggunaan per Lini Bisnis

Modul dipasang dari **Katalog Modul** workspace (`/module/modules`) selama paket tenant meng-entitle-nya. Auto-install akan menarik dependensi.

### 1) Distributor / perdagangan (tanpa armada)

**Rantai inti:**
`partners` → `products` → `inventory` → `purchasing` + `sales` → `invoicing` → `receivables` + `payables` → `accounting`

| Langkah | Modul | Hasil |
|---|---|---|
| Master mitra & SKU | Partners, Products | Customer/supplier + katalog |
| Gudang | Inventory | Warehouse, lokasi, stok |
| Beli | Purchasing | PO → GRN → stok masuk + moving avg cost |
| Hutang | Payables | Bill dari GRN → bayar |
| Jual | Sales | SO → GIN → stock out; return bila perlu |
| Tagih & terima | Invoicing, Receivables | Invoice dari SO/GIN → pembayaran & aging |
| Kasir cabang | POS | Penjualan counter + shift |
| Promo dagang | Promotions | Diskon volume / free goods / rebate |
| Buku besar | Accounting | Posting otomatis + laporan keuangan |
| Kontrol | Approvals | Override kredit / PO besar |
| Pantau | BI | KPI turnover, aging, revenue |

### 2) Logistik / transportasi

**Rantai inti:**
`fleet` (+ `document`, `maintenance`, `tracking`, `scoring`) → `partners` + `products` → `transportation` → `orders` → `billing` + `invoicing`  
Opsional: `outbound`, `routing`, bridge dari `sales` (GIN → DO)

| Langkah | Modul | Hasil |
|---|---|---|
| Armada & kepatuhan | Fleet, Document, Maintenance | Unit siap jalan; STNK/SIM/KIR terpantau |
| GPS | Tracking | Peta live, odometer, auto-checkpoint trip |
| Perilaku sopir | Scoring | Skor & insentif dari telemetri |
| Dispatch | Transportation | Trip multi-stop + jadwal + kalender |
| Order kirim | Orders | DO → assign trip → surat jalan → POD → `/track/{token}` |
| Gudang pick | Outbound | Pick/pack sebelum dispatch |
| Optimasi | Routing | Susun rute hemat jarak/BBM |
| Tagih ongkos | Billing + Invoicing | Tarif rute → charge → invoice |
| Uang jalan | Billing | Kasbon → expense → settlement |
| BI | BI | OTD, utilisasi, revenue per rute |

### 3) Rental kendaraan

`fleet` + `partners` + `invoicing` + `rental`  
(opsional Tracking untuk pantau unit sewa; soft-cek bentrok dengan Transportation)

Alur: tarif → booking (draft→confirmed→active→returned→completed) → damage/extension → invoice.

> Paket **Pro** meng-entitle `rental` (Juli 2026).

### 4) Field sales / canvassing

`partners` + `canvassing`  
(opsional Sales, Inventory, Products, Promotions untuk konversi visit → SO)

Alur: salesperson → rencana harian → check-in/out GPS → target → portal mobile.

> Paket **Pro** meng-entitle `canvassing` (Juli 2026).

### 5) CMS / website tenant saja

Paket `basic`: `pages` + `posts` + `carousels` (+ Media core). Cukup untuk situs publik tanpa operasi bisnis.

---

## Paket Langganan & Entitlement

- **Paket** di tabel central `plans` — diedit dari `/module/plans` (gate `manage-plans`).
- **Tenant** menyimpan key paket di `data->plan`; default `basic`.
- Baca lewat `PlanRepository` (bukan query telanjang).
- **Downgrade ≠ uninstall** — modul menjadi `locked` / `locked_with_data` tanpa purge.

Paket bawaan (`PlanSeeder`, `firstOrCreate` — tidak menimpa definisi hidup):

| Key | Modul | Catatan |
|---|---|---|
| `free` | — | CMS inti saja |
| `basic` | `carousels`, `pages`, `posts` | **Default** |
| `pro` | Semua modul operasional termasuk `rental` + `canvassing` | Accounting, sales, purchasing, AR/AP, POS, outbound, routing, promotions, scoring, BI, rental, canvassing, dll. |

> `rental` dan `canvassing` masuk paket **Pro** (keputusan Juli 2026). Tenant Pro bisa memasangnya dari Katalog Modul.

## Module Registry

Sumbu ketiga: `ModuleRegistry::platformEnabled($key)` via tabel central `module_settings`.  
`available() = platformEnabled && entitled && installed`.  
Halaman `/module/registry` (gate `manage-module-registry`) mematikan modul untuk **semua** tenant tanpa menyentuh data.

---

## Fitur Core (bukan modul)

- Dashboard per peran + Global Search
- Katalog Modul, Media Library, Menus dinamis, Settings per grup
- Users / Roles / Permissions (RBAC `module`+`action`; admin bypass permission, **bukan** module gate)
- Pusat Notifikasi in-app (`notificationCenter` prop; `GenericNotification` + `NotificationRecipients`)
- Todos, Live Updates, Analytics, Profil
- Tracking publik pelanggan (route di Orders): `/track/{token}`
- Landing marketing central, registrasi perusahaan, portal `/workspaces` + SSO, undangan 7 hari
- Super admin: tenants, plans, registry; reseller scoped ke tenant miliknya (`reseller_global_id`)

### Model akses central tiga tier

| Role | Akses `/module/*` | Kelola tenant |
|---|---|---|
| Super Admin | Seluruh control plane | Semua |
| Reseller | `/module/tenants` saja | Tenant miliknya |
| SaaS Customer | Portal workspace | Tidak |

---

## Integrasi Lintas Modul (yang sudah hidup)

```
Purchasing ──GRN──► Inventory ──GIN/POS──► Sales / POS
                │                              │
                ▼                              ▼
             Payables                      Invoicing ──► Receivables
                │                              │
                └──────────► AccountingPoster ◄┘
                                   ▲
POS shift / stock opname / promo CN ┘

Sales GIN ──bridge──► Orders(DO) ──► Transportation(Trip)
                         │                  ▲
                      Outbound           Tracking (event)
                         │                  │
                      Routing            Scoring

Orders delivered ──► Billing charge ──► Invoicing
Trip ──► Billing uang jalan
```

Accounting memposting peristiwa final (idempotent per source+event); void = jurnal reverse. Soft-depend: tenant tanpa Accounting tetap jalan.

---

## Perintah Penting

```bash
composer dev              # server + queue + log + vite sekaligus
php artisan test --compact
composer deploy           # migrate central + migrate semua tenant + cache

# Modul
php artisan modules:list {tenant}
php artisan modules:install {tenant} {module}
php artisan modules:uninstall {tenant} {module}
php artisan modules:backfill [--tenant=]
php artisan modules:migrate [--tenant=] [--pretend]   # wajib di setiap deploy
php artisan modules:purge-expired                     # terjadwal 03:00

# GPS
php artisan tracking:poll [--tenant=]                 # per menit
php artisan tracking:prune [--tenant=]                # 03:30

# Kepatuhan
php artisan document:scan-expiring [--tenant=]        # 06:00
```

## Konfigurasi Penting

| Kunci | Keterangan |
|---|---|
| `CENTRAL_SERVES_APP` | `true` di dev; **`false` di produksi** |
| `config/modules.php` | Kelas modul terdaftar + `purge_after_days` |
| `config/tenancy.php` | Schema manager, central domains, bootstrapper DB/FS/queue/cache |
| Migrasi | `database/migrations/` = central; `…/tenant/` = per tenant; `modules/*/Database/Migrations/` = saat install + `modules:migrate` |
| Route | `web.php` central · `tenant.php` domain tenant · `app.php` CRM bersama · route modul di grup `module.` |

## Catatan Produksi

1. Wildcard DNS + SSL
2. Provisioning tenant di-queue + jalankan worker
3. PgBouncer **session mode** (`search_path`)
4. Scheduler wajib: purge modul, poll/prune tracking, scan dokumen
5. `modules:migrate` di setiap deploy (celah migrasi modul yang sudah terpasang)
6. `SettingController::store()` sync ke semua tenant sinkron — kandidat queue saat skala besar
7. Polling GPS sinkron per tenant — fan-out ke queue sebelum ~100 tenant
8. Tile OSM: self-host sebelum beban komersial berat

---

## Review Status Fitur (Juli 2026)

### Roadmap logistik lama (5 fase)

| Fase | Isi | Status |
|---|---|---|
| 1 | GPS live + auto-checkpoint + geofence + odometer | ✅ `tracking` + listener Transportation |
| 2 | Delivery Order + multi-stop + surat jalan | ✅ `orders` |
| 3 | Proof of Delivery + portal driver | ✅ POD + `DriverPortal` (PWA/offline penuh belum) |
| 4 | Tarif → invoice → uang jalan | ✅ `billing` + `invoicing` |
| 5 | Notifikasi in-app + tracking publik + gating dispatch | ✅ core notifications + `/track/{token}` |

### Gelombang dagang & finance (setelah logistik)

| Area | Status |
|---|---|
| Partners menggantikan Customers | ✅ |
| Products + Inventory lengkap (batch, reservasi, transfer, putaway) | ✅ |
| Purchasing (PO/GRN) + Payables | ✅ |
| Sales (SO/GIN) + Receivables + GIN→DO bridge | ✅ |
| POS kasir + shift | ✅ MVP |
| Approvals workflow | ✅ |
| Trade Promotions | ✅ core (e-commerce channel belum) |
| Outbound pick/pack | ✅ |
| Route optimization | ✅ |
| Driver Scoring | ✅ |
| Executive Dashboard (BI) | ✅ thin/read-only |
| Accounting GL (COA → jurnal → bank → FS → FA/budget) | ✅ hampir penuh; Phase E (cash flow, GL detail, partner statement, FA, budget) sedang dilengkapi |
| Rental / Canvassing | ✅ kode siap; ✅ entitle paket Pro |

### Hutang teknis / gap yang masih terbuka

- ✅ **Master lokasi + matching tarif Billing** — `locations` di Partners; tarif & DO memakai location FK (fallback teks tetap ada)
- ✅ **Cutover Accounting pilot** — dashboard readiness + `accounting:preflight`; COA/rules/bank/period di-seed saat install; opening balance tetap wizard manual
- ✅ **`rental` / `canvassing` di paket Pro** — entitle via `PlanSeeder` + migrasi additive ke row Pro yang sudah ada
- Push email/WA ke pelanggan: event `ShipmentStatusChanged` ada, listener channel belum
- Time-overlap dispatch sejati: masih per-tanggal; butuh `scheduled_end_at` / durasi
- ✅ **Time-window dispatch** — `scheduled_end_at` + overlap nyata; schedule `duration_minutes`; Routing apply mengisi end dari jarak
- Portal driver: berfungsi, tapi belum PWA offline-first
- Rental → auto-invoice & payment terms master: gap ops sebelum “finance sempurna”
- Accounting: WHT/PPh, e-Faktur DJP, multi-currency, cost center — masih fase lanjut
- Promotions: channel e-commerce di luar scope
- Skala `tracking:poll` & retensi `vehicle_positions`
- Odometer: belum read-only saat device ter-pair (risiko drift bila diedit manual)

Dokumentasi desain terkait: `docs/modules/*.md` (accounting, sales-order, po-grn, gin-do-transport, pos, promotions).

---

## Saran Arah Pengembangan Selanjutnya

Urutan di bawah menyeimbangkan **nilai bisnis**, **utang teknis yang menghambat go-live**, dan **kekuatan diferensiasi** platform modular yang sudah ada.

### Prioritas P0 — go-live & moneterisasi (1–2 sprint)

| # | Item | Status |
|---|---|---|
| 1 | Master lokasi + matching tarif Billing | ✅ Selesai — `locations` + matching by location ID |
| 2 | Cutover Accounting di tenant pilot | ✅ Selesai — readiness dashboard + `accounting:preflight` |
| 3 | Keputusan paket (`rental` / `canvassing` → Pro) | ✅ Selesai — entitle di paket Pro |
| 4 | Channel notifikasi pelanggan (email dulu, WA belakangan) | Listener ke `ShipmentStatusChanged` + mail driver produksi |

### Prioritas P1 — lengkapi siklus yang sudah hampir tutup (1–2 bulan)

5. **Driver PWA offline** — service worker + antrian POD saat sinyal lemah (fase 3 “sejati”).
6. ✅ **Time-window dispatch** — `scheduled_end_at` + overlap waktu nyata; schedule `duration_minutes`; Routing apply isi end dari jarak.
7. **Payment terms + giro/clearing** — due date standar di invoice/bill; status `pending_clearance` untuk bank recon.
8. **Rental invoice otomatis** — tutup gap `requires: invoicing` yang belum dimanfaatkan penuh; lalu mapping Accounting.
9. **Canvassing → SO conversion UX** — alur satu ketukan dari visit sukses ke Sales Order + promo.

### Prioritas P2 — diferensiasi & compliance (kuartal berikutnya)

10. **Accounting compliance ID** — tax codes penuh, WHT (PPh 23), ekspor e-Faktur/SPT (bukan blocker GL, tapi penjualan enterprise).
11. **Cost center / analytic dimensions** — journal lines + budget vs actual per gudang/rute/projek.
12. **Self-host map tiles + queue fan-out GPS** — sebelum skala tenant/device.
13. **HR/Payroll ringan** — atau cukup posting insentif Scoring → GL dulu.
14. **Multi-currency** — hanya setelah IDR-stable di lapangan.

### Prioritas P3 — produk platform

15. **Paket vertikal + onboarding wizard** — “pasang set modul Distributor / Logistik” satu klik + data sample.
16. **Audit log & immutable document trail** — terutama journal posted, invoice issued, GRN/GIN confirm.
17. **API/Sanctum publik terbatas** — partner portal, driver app native, integrasi WMS pihak ketiga.
18. **Observability** — metrik poll GPS gagal, posting Accounting gagal, queue lag per tenant.

### Yang sebaiknya *tidak* dikerjakan dulu

- Rewrite modul Foundation yang sudah stabil (Partners/Products/Inventory) demi “kerapian”
- Memecah `accounting` menjadi banyak modul kecil sebelum ada kebutuhan paket komersial
- E-commerce storefront penuh (Promotions design sudah menandai ini out of scope)
- Intercompany / multi-entity consolidation

---

## Prinsip yang Harus Dipertahankan

1. **Dokumen operasional = master**; Accounting = proyeksi berimbang.
2. **Foundation tidak mengenal Vertical** — integrasi lewat event/FK konsumen.
3. **Entitlement paket ≠ install ≠ platform registry** — tiga sumbu terpisah.
4. **Uninstall non-destruktif** sampai purge terjadwal.
5. **Satu jawaban untuk satu pertanyaan bisnis** (contoh: “sudah ditagih?” hanya lewat invoice line, bukan kolom ganda).

Dengan fondasi itu, arah paling sehat ke depan adalah: **kunci paket & cutover finance → rapikan alamat/dispatch/notifikasi → PWA driver & vertikal rental/canvassing yang bisa dijual → compliance & skala**.
