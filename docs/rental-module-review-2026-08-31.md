# Review Proyek — Seruwit CRM (Fokus: Modul Rental)

> **Tanggal review:** 31 Agustus 2026
> **Reviewer:** Claude Code
> **Cakupan:** Arsitektur proyek secara umum + telaah mendalam modul `modules/Rental`
> **Metode:** Analisis statik kode, migrasi, test, i18n, dan riwayat git. Test suite **tidak** dijalankan (DB test remote, lihat §7).

---

## 1. Ringkasan Eksekutif

Seruwit CRM adalah **SaaS CRM multi-tenant** (Laravel 12 · PHP 8.4 · Inertia + React 18 · PostgreSQL schema-per-tenant via `stancl/tenancy`) dengan **28 modul** opsional. Modul **Rental** adalah salah satu vertikal terbesar dan yang paling aktif dikembangkan — **78 dari 92 commit** yang menyentuhnya terjadi dalam 30 hari terakhir.

Secara keseluruhan **kualitas modul Rental tinggi**: arsitektur berorientasi service, dependensi antar-modul dijaga secara *soft* (degradasi anggun bila Accounting/Receivables belum terpasang), logika keuangan hati-hati (pembulatan 2 desimal, transaksi DB, `lockForUpdate`, alokasi deposit FIFO, credit note), otorisasi konsisten, dan cakupan test luas (~38 file, 378 metode test). 

Namun modul ini menunjukkan **gejala pertumbuhan cepat**: tabel & model `Rental` sangat lebar (≈72 kolom, ≈130 field `fillable`), beberapa controller & komponen React monolitik (Show.tsx 2.245 baris), sejumlah string di-*hardcode* dalam Bahasa Indonesia yang melewati sistem i18n, dan logika "gate pra-pembayaran sebelum checkout" terduplikasi di 3 tempat. Tidak ada yang bersifat *blocker*, tetapi utang teknis ini akan menaikkan biaya perubahan bila tidak dirawat.

### Health scorecard

| Aspek | Nilai | Catatan |
|---|:---:|---|
| Arsitektur & modularitas | 🟢 Kuat | `ModuleContract`, soft-dependency, single-source pricing |
| Logika domain (lifecycle) | 🟢 Kuat | State machine 11 status dengan guard eksplisit |
| Integrasi keuangan | 🟢 Kuat | Transaksi, pembulatan, credit note, alokasi deposit |
| Keamanan & otorisasi | 🟢 Kuat | RBAC middleware, ownership portal, token+OTP publik |
| Cakupan test | 🟢 Baik | Luas — **tetapi status run terakhir perlu diverifikasi (§7)** |
| Kualitas frontend | 🟡 Sedang | Komponen monolitik, perlu dipecah |
| Konsistensi i18n | 🟡 Sedang | ~11 string ID di-hardcode melewati `__()` |
| Kesehatan skema/migrasi | 🟡 Sedang | Tabel `rentals` terlalu lebar; 35 migrasi additive |

**3 prioritas teratas:** (1) verifikasi test suite hijau dengan run bersih; (2) rapikan string hardcoded → i18n; (3) rencanakan pemecahan tabel/model & komponen React monolitik.

---

## 2. Konteks Proyek

- **Model:** SaaS multi-tenant. Central (`seruwit.com`) untuk marketing, registrasi, provisioning, super-admin; tiap tenant di subdomain sendiri dengan CRM + website publik.
- **Isolasi:** 1 database PostgreSQL, **1 schema per tenant** (`search_path`); file upload per `storage/tenant_<id>/`; sesi per domain; cache Redis tenant-aware.
- **Sistem modul:** paket kode mandiri di `modules/<Nama>/` mengimplementasikan `App\Modules\ModuleContract`; route selalu terdaftar, penegakan lewat middleware `requires-module` + `permission` (tanpa bypass admin); uninstall non-destruktif.
- **Tier modul Rental:** `Vertical`, `requires('fleet','partners','invoicing')`. Fleet tetap "buta" terhadap Rental — pengecekan ketersediaan mengalir ke bawah lewat `Rental::vehicleAvailabilityReasons()`.

---

## 3. Peta Modul Rental

**Skala:** 144 file PHP · ~21.244 baris TS/TSX (31 halaman React + komponen) · 32 service `Support/` (~5.022 baris) · 11 model · 35 migrasi · lang `en`+`id` (~1.000 kunci).

### 3.1 Lapisan backend

| Lapisan | Isi utama |
|---|---|
| **Models** (11) | `Rental` (agregat), `RentalRate` + `RentalRateTier`, `RentalCharge`, `RentalDamage`, `RentalExtension(+Request)`, `RentalVehicleSwap`, `RentalInsurancePackage`, `RentalAiInspection`, `RentalReminder` |
| **Controllers** (14+3) | Web: Dashboard, `Rental`, `RentalAction`, Rate, Availability, Calendar, ReservationWizard, Settings, Pdf, PublicRentalBooking, PartnerPortal, 3× AI. Mobile API: Catalog, Quote, Booking |
| **Support/** (32) | `RentalPriceEngine`, `RentalRateResolver`, `RentalConfirmationService`, `RentalInvoiceService`, `RentalAccountingService`, `RentalBookingPolicy`, `RentalExtensionService`, `RentalStatusBoard`, `RentalAvailabilityBoard`, `MobileRentalBookingService`, `DocumentTemplateManager`, dll. |
| **AI/** | Kontrak + DTO + 4 service Gemini: vision inspection, KYC/OCR dokumen, dynamic pricing, rate generator |
| **Console** | `RentalScanEnding`, `RentalExpirePendingReserved` (cron) |

### 3.2 Kanal (channels)

Model mengenali 3 kanal: `staff`, `mobile` (Capacitor), `web` (PWA publik). Empat permukaan pengguna:

1. **Staff back-office** — dashboard, reservation wizard, checkout/return, settings, rates.
2. **Public web booking** (`PublicRentalBookingController`, 1.092 baris) — self-service tanpa auth staff; tenant via domain; akses via `public_token` tak-tertebak + OTP.
3. **Mobile API** (`Api/Mobile/*`) — catalog, quote, booking untuk aplikasi.
4. **Partner portal B2B** — partner terhubung via `partners.portal_user_id`, hanya melihat data miliknya.

### 3.3 Lifecycle (state machine)

11 status: `draft → pending / pending_reserved → confirmed → active → returned → completed`, plus `cancelled(_paid)`, `no_show(_paid)`. Transisi dijaga guard eksplisit (`abort_if` atas status) di `RentalActionController`, dengan status "blocking" (`pending_reserved`, `confirmed`, `active`) yang menahan kalender kendaraan — lihat [Rental::blockingStatuses()](modules/Rental/Models/Rental.php).

---

## 4. Kekuatan (yang perlu dipertahankan)

- **Single-source pricing.** [`RentalPriceEngine::calculate()`](modules/Rental/Support/RentalPriceEngine.php) menjadi satu-satunya jalur harga (mobile quote, wizard staff, ekstensi) dengan *stacking* tier volume→loyalty dan **snapshot breakdown per-periode** untuk transparansi invoice. Loyalty di-*scope* ke `rental_class` & hanya menghitung sewa `COMPLETED` sehingga tidak bisa "digame".
- **Soft-dependency yang disiplin.** Pola `class_exists()` + `Schema::hasTable()` + `Modules::available()` dipakai konsisten (mis. [`RentalInvoiceService::isAvailable()`](modules/Rental/Support/RentalInvoiceService.php), [`RentalAccountingService`](modules/Rental/Support/RentalAccountingService.php)). Tenant tanpa Accounting/Receivables tetap berjalan; GL/pembayaran hanya di-*post* bila jembatan tersedia.
- **Kehati-hatian keuangan.** Pembulatan 2 desimal di mana-mana, `DB::transaction`, `lockForUpdate` saat mencatat pembayaran ([`RentalActionController::payInvoices()`](modules/Rental/Http/Controllers/RentalActionController.php:342)), alokasi deposit FIFO ([`allocateDepositToInvoices`](modules/Rental/Support/RentalAccountingService.php:446)), dan **credit note** untuk invoice yang sudah dibayar saat pembatalan ([`createCreditNoteForPaidInvoices`](modules/Rental/Support/RentalAccountingService.php:315)) — termasuk penanganan partial-paid.
- **Idempotensi charge→invoice.** [`ensureCharge()`](modules/Rental/Support/RentalInvoiceService.php:252) mencegah duplikasi baris charge/invoice dan menolak mengubah charge yang invoicenya sudah keluar dari `draft`.
- **Otorisasi berlapis & benar.** Setiap route memakai `permission:rental,<aksi>`. Portal B2B memverifikasi kepemilikan objek ([`ResolvesActivePartner`](modules/Rental/Http/Controllers/Concerns/ResolvesActivePartner.php) → `ensureRentalBelongsToPartner`/`ensureInvoiceBelongsToPartner`) sehingga aman dari IDOR. Booking publik memakai `public_token` + OTP untuk aksi sensitif (bayar deposit, riwayat).
- **Rahasia dikelola benar.** Kunci Gemini via `config('services.gemini.api_key')`, melempar `RuntimeException` bila kosong; tidak ada key hardcoded.
- **i18n & test.** Infrastruktur i18n `en`+`id` (~1.000 kunci), dan cakupan test luas (~38 file khusus rental / 378 metode) mencakup lifecycle, pricing, akunting, PDF, wizard, mobile, publik, storefront, AI.

---

## 5. Temuan & Rekomendasi

Diurutkan berdasarkan tingkat keparahan. Setiap temuan menyertakan lokasi dan tindakan yang disarankan.

### 🔴 Tinggi

**H1 — Status test-run terakhir perlu diverifikasi.**
Cache hasil PHPUnit hari ini ([`.phpunit.result.cache`](.phpunit.result.cache), sudah gitignored) mencatat **2.052 Error / 46 Failure / 36 Risky** (hanya status non-sukses yang disimpan). Skala error yang hampir menyeluruh **sangat mungkin bersifat lingkungan**, bukan cacat logika per-test — cocok dengan jebakan yang sudah terdokumentasi pada memori proyek: DB Postgres test remote yang lambat, `config:cache` yang membuat test tenancy "lulus semu", dan manifest Vite hilang yang menyamar sebagai *PHP OOM* sebelum `npm run build`.
→ **Aksi:** jalankan run bersih sebelum menyimpulkan apa pun: `php artisan config:clear` → `npm run build` → `php artisan test --compact`. Pastikan hijau, lalu jadikan sinyal CI. Jangan asumsikan kode rusak dari cache ini saja.

**H2 — Tabel & model `Rental` terlalu lebar ("God table/model").**
Tabel `rentals` menerima **≈72 penambahan kolom di 15 file migrasi** terpisah; model punya **≈130 entri `fillable`** yang mencampur booking, deposit, bukti transfer, handover checkout, handover return, lokasi, tier snapshot, dan KYC. Ini menaikkan beban kognitif, memperluas permukaan mass-assignment, dan membuat migrasi rapuh.
→ **Aksi:** rencanakan ekstraksi bertahap — mis. pindahkan blok `checkout_*`/`return_*` ke tabel `rental_handovers`, `deposit_proof_*`/`pickup_*` ke tabel/relasi tersendiri, atau bungkus sebagai cast objek (value object). Tidak mendesak, tapi jadwalkan sebelum modul makin bertambah lebar.

### 🟡 Sedang

**M1 — String Bahasa Indonesia di-hardcode melewati i18n.**
Meski `__()` dipakai secara menyeluruh, ada ~11 string yang di-hardcode dan **akan salah bahasa di locale `en`**:
[RentalActionController.php:122](modules/Rental/Http/Controllers/RentalActionController.php:122), [:738](modules/Rental/Http/Controllers/RentalActionController.php:738), [:760](modules/Rental/Http/Controllers/RentalActionController.php:760), [:771](modules/Rental/Http/Controllers/RentalActionController.php:771), [:783](modules/Rental/Http/Controllers/RentalActionController.php:783); [RentalController.php:607](modules/Rental/Http/Controllers/RentalController.php:607); [PublicRentalBookingController.php:436](modules/Rental/Http/Controllers/PublicRentalBookingController.php:436), [:616](modules/Rental/Http/Controllers/PublicRentalBookingController.php:616); serta beberapa di service AI.
→ **Aksi:** pindahkan ke `lang/{en,id}/rental.php` (grup `errors`/`messages` yang sudah ada) dan panggil via `__()`.

**M2 — Logika "pra-pembayaran wajib lunas sebelum checkout/pickup" terduplikasi 3×.**
Aturan yang sama muncul di `RentalActionController::checkout()` ([:118](modules/Rental/Http/Controllers/RentalActionController.php:118)), `RentalController` ([:607](modules/Rental/Http/Controllers/RentalController.php:607)), dan `PublicRentalBookingController` ([:616](modules/Rental/Http/Controllers/PublicRentalBookingController.php:616)) — string errornya pun disalin. Duplikasi seperti ini mudah menyimpang seiring waktu.
→ **Aksi:** ekstrak ke satu guard, mis. `RentalBookingPolicy::assertPrepaymentSettled($rental)` atau method di `RentalInvoiceService`, lalu panggil dari ketiga tempat.

**M3 — Komponen React monolitik.**
`Show.tsx` **2.245 baris / 17 hook**, `Public/Booking.tsx` 1.200, `Availability/Index.tsx` 1.174, `Settings/DocumentsPanel.tsx` 1.082. Halaman `Show` menangani seluruh detail sewa + semua modal lifecycle sekaligus — sulit dirawat & berpotensi re-render berat.
→ **Aksi:** pecah per-panel (checkout, return, deposit, addon, damage, AI) menjadi subkomponen; sebagian sudah dirintis lewat `ShowUi.tsx`, lanjutkan pola itu.

**M4 — Controller gemuk.**
`PublicRentalBookingController` 1.092 baris & `RentalActionController` 785 baris. Logika presentasi (kartu kendaraan, SEO, brand) dan orkestrasi bercampur.
→ **Aksi:** pindahkan penyusunan payload ke Resource/Presenter, dan orkestrasi lifecycle ke service (sebagian besar sudah, teruskan).

### 🟢 Rendah / Pemeliharaan

**L1 — Higiene migrasi.** 35 migrasi modul yang hampir semua *additive*; dua di antaranya berbagi prefix timestamp identik (`2026_08_07_084345_*`). Urutan tetap deterministik (alfabetis nama file), tapi rapuh. → Pertimbangkan *squash* baseline untuk fresh install dan hindari timestamp kembar ke depan.

**L2 — Kunci Gemini di query string.** URL Google `...:generateContent?key=<API_KEY>` menaruh key di query string (standar Google, panggilan server-to-server). Aman secara fungsi, tapi pastikan URL penuh tidak ikut ter-*log*. → Redaksi saat logging; gunakan header auth bila didukung.

**L3 — Otorisasi hanya via middleware.** Tidak ada kelas Laravel Policy; cek level-objek tersebar ad-hoc di controller/concern (untuk portal sudah benar). → Bila aturan kepemilikan meluas, pertimbangkan `RentalPolicy` agar terpusat. (Catatan: `RentalBookingPolicy` adalah policy *aturan bisnis*, bukan otorisasi.)

> **Sudah diverifikasi konsisten (bukan temuan):** biaya *one-way* dan paket asuransi masuk sebagai `RentalCharge` KIND_ADDON via [`RentalBookingExtrasService::applyOnConfirm()`](modules/Rental/Support/RentalBookingExtrasService.php), sehingga terhitung di `total_amount` lewat `recalculateTotalAmount()`. `.phpunit.result.cache` sudah gitignored.

---

## 6. Rencana Aksi (prioritas)

| # | Aksi | Dampak | Usaha |
|---|---|:---:|:---:|
| 1 | Run test bersih (`config:clear` → `npm run build` → `test`) & pastikan hijau; sambungkan ke CI | Tinggi | Rendah |
| 2 | Pindahkan ~11 string hardcoded ke i18n (M1) | Sedang | Rendah |
| 3 | Ekstrak guard pra-pembayaran bersama (M2) | Sedang | Rendah |
| 4 | Pecah `Show.tsx` & halaman monolitik lain (M3) | Sedang | Sedang |
| 5 | Ramping-kan `PublicRentalBookingController`/`RentalActionController` (M4) | Sedang | Sedang |
| 6 | Rancang pemecahan tabel/model `Rental` (H2) | Tinggi | Tinggi |
| 7 | Squash baseline migrasi + higiene timestamp (L1) | Rendah | Sedang |

---

## 7. Catatan Metodologi

- **Test suite tidak dijalankan** karena memori proyek mencatat DB test = Postgres remote yang lambat dan run yang di-*kill* dapat men-*deadlock* koneksi. Kesehatan test disimpulkan dari cakupan statik + cache hasil, bukan eksekusi. Verifikasi eksekusi diserahkan ke pemilik (aksi #1).
- Angka LOC/kolom/commit dihitung dari kondisi *working tree* pada tanggal review (branch `main`, status bersih).
- Review ini menelaah representatif file terbesar/terpenting secara menyeluruh dan menyampel sisanya; bukan audit baris-per-baris atas 144 file.

---

## Lampiran — Inventaris & metrik

| Metrik | Nilai |
|---|---|
| File PHP modul | 144 |
| Baris TS/TSX | ~21.244 (31 halaman + komponen) |
| Service `Support/` | 32 (~5.022 baris) |
| Model | 11 |
| Migrasi modul | 35 |
| Kolom tabel `rentals` (kumulatif) | ≈72 (di 15 file migrasi) |
| Field `fillable` model `Rental` | ≈130 |
| Status lifecycle | 11 |
| Controller | 14 web + 3 mobile API |
| Service AI (Gemini) | 4 (~1.497 baris) |
| File test khusus rental | ~38 |
| Metode test menyebut Rental | 378 |
| Kunci i18n | `en` 999 · `id` 1.020 baris |
| Commit menyentuh rental | 92 total · 78 dalam 30 hari |
| Controller/file terbesar | `PublicRentalBookingController.php` 1.092 · `Show.tsx` 2.245 |

**Dokumen desain terkait** (di `docs/modules/`): `public-rental-booking-design.md`, `rental-payment-design.md`, `rental-storefront-design.md`, `mobile-rental-app-design.md`.
