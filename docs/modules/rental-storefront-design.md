# Desain: Arsitektur Storefront Front-End Tenant Rental

Dokumen ini menjawab tiga pertanyaan strategis untuk front-end publik tenant rental kendaraan:

1. Halaman apa saja yang dibutuhkan storefront tenant.
2. Apakah cukup memakai satu modul page builder (GrapesJS/`Pages`) atau perlu membuat modul template baru untuk landing page, store catalog, dan online reservation.
3. Cetak biru (arsitektur) terbaik sebelum implementasi.

> **Ditelaah dari kode aktual:** rute publik `book.rental.*` di `routes/app.php`, `Modules\Rental\Http\Controllers\PublicRentalBookingController`, halaman `Public/*.tsx` (Search, VehicleShow, Booking, History), modul GrapesJS `Pages` dengan render `pages::render`, dan tenancy per-domain (Stancl Tenancy).

> **Status implementasi (per 2026-08-25): Fase 1–3 selesai; Fase 4 sebagian** (template landing ✅, i18n storefront ◑, custom domain/SSR/analytics belum). Rincian per fase ada di [Roadmap Bertahap](#4-roadmap-bertahap). Catatan: `brand()` kini **dinamis** (bukan lagi `#0f766e` hardcoded) — lihat Fase 1. Test untuk Fase 1–3 sudah ditulis; jalankan `php artisan test --compact --filter='RentalStorefront|RentalVehicleSeo|RentalPaymentResult|RentalTestimonials'`.

---

## Rekomendasi Utama (TL;DR)

**Jangan membuat modul template baru. Jembatani dua sistem yang sudah ada.**

Aplikasi ini **sudah punya** dua fondasi yang tepat:

- **Pages (GrapesJS)** — page builder untuk konten marketing bebas-edit (homepage, tentang, promo, FAQ, S&K, kontak).
- **Rental Public** (`/book/rental`) — storefront transaksional yang **sudah lengkap**: pencarian dengan ketersediaan real-time, quote harga, OTP WhatsApp, deposit, integrasi Midtrans, dan self-service kelola booking (±2.800 baris React yang sudah berjalan).

Pola terbaik adalah **"CMS + reservation engine"**: pertahankan keduanya, lalu tambahkan dua komponen penghubung:

1. **Storefront Theme Layer** — menggantikan `brand()` yang masih hardcoded.
2. **Bridge Blocks** — blok GrapesJS dinamis yang menarik data rental ke dalam landing page.

Membuat modul template yang mengulang landing + catalog + reservation hanya akan menduplikasi kode pembayaran yang sudah teruji dan menciptakan dua sumber kebenaran.

---

## 1. Halaman yang Dibutuhkan Storefront Tenant

Peta lengkap front-end publik sebuah tenant rental, dikelompokkan menurut sistem yang *seharusnya* memilikinya. Sebagian besar sudah ada; yang perlu perhatian ditandai sebagai **Gap**.

### A. Marketing / CMS — konten bebas-edit, SEO

| Halaman | Fungsi | Pemilik sistem | Status |
| --- | --- | --- | --- |
| **Landing / Homepage** | Hero, value proposition, armada unggulan, cara sewa, CTA "cari mobil" | GrapesJS + blok dinamis | Ada · butuh blok |
| **Tentang / Profil usaha** | Kredibilitas, legalitas, cerita brand | GrapesJS (`/p/{slug}`) | Ada |
| **Promo / Kampanye** | Landing khusus diskon musiman, paket, corporate | GrapesJS | Ada |
| **FAQ / Syarat sewa** | Persyaratan, dokumen, cara sewa, kebijakan | GrapesJS | Ada |
| **S&K / Privasi** | Halaman legal wajib | GrapesJS | Ada |
| **Kontak / Lokasi cabang** | Alamat, peta, jam operasional, WhatsApp | GrapesJS (blok map) | Ada |
| **Blog / Artikel** | SEO organik, tips perjalanan | Core (`/blog`) | Ada |

### B. Transaksional / App — data live, tidak boleh dibangun di page builder

| Halaman | Fungsi | Pemilik sistem | Status |
| --- | --- | --- | --- |
| **Katalog & Pencarian** | Filter tanggal / lokasi / kelas + ketersediaan real-time, anti double-booking | Rental Public (`Search.tsx`) | Ada |
| **Detail Kendaraan** | Foto, spesifikasi, quote harga per periode, mulai booking | Rental Public (`VehicleShow.tsx`) | Ada |
| **Checkout / Buat booking** | Data penyewa, verifikasi OTP WhatsApp, hold TTL | Rental Public (`store` + `quote`) | Ada |
| **Kelola booking (self-service)** | Verifikasi OTP, bayar deposit, upload bukti, bayar tagihan, batal, perpanjang, minta pickup, upload dokumen | Rental Public (`Booking.tsx`) | Ada |
| **Riwayat booking** | "Sewa saya" per nomor WhatsApp | Rental Public (`History.tsx`) | Ada |
| **Hasil pembayaran** | Halaman sukses / pending / gagal setelah redirect Midtrans | Rental Public | Cek / Gap |

### C. Gap — yang belum ada & direkomendasikan

| Halaman / Kapabilitas | Fungsi | Pemilik sistem | Status |
| --- | --- | --- | --- |
| **Storefront Theme & Settings** | Logo, warna, kontak/WA, hero, sosial, jam buka | Layer baru | ✅ Ada (Fase 1) — `RentalStorefrontSettings` + tab Settings. *Custom domain menyusul (Fase 4).* |
| **Ulasan / Testimoni** | Social proof di landing & detail kendaraan | Blok dinamis | ✅ Ada (Fase 3) — testimoni terkurasi + blok `<rental-reviews>` |
| **SEO per-kendaraan** | Meta, Open Graph, JSON-LD structured data agar terindeks Google | Rental Public | ✅ Ada (Fase 3) — meta/OG/JSON-LD via `<Head>`. *SSR untuk scraper non-JS = Fase 4.* |
| **Halaman hasil pembayaran** | Sukses/pending/gagal setelah redirect Midtrans | Rental Public | ✅ Ada (Fase 3) — `PaymentResult` |
| **Storefront multi-bahasa** | Copy publik id/en; locale sudah ada tapi teks storefront banyak hardcoded ID | i18n | Parsial — belum dikerjakan (Fase 4) |

---

## 2. Keputusan: Satu GrapesJS, Modul Template Baru, atau Hybrid?

Tiga opsi dibandingkan pada kriteria yang paling menentukan untuk bisnis rental. Storefront rental berputar di sekitar **uang & ketersediaan** — di situlah page builder gagal dan mesin kode menang.

| Kriteria | A · Semua GrapesJS | B · Modul template baru | C · Hybrid (jembatani) |
| --- | --- | --- | --- |
| Ketersediaan real-time & anti double-booking | Tidak bisa | Bisa, tapi tulis ulang | **Sudah jalan** |
| Integrasi bayar (Midtrans, deposit, OTP) | Tidak bisa | Duplikasi | **Sudah jalan** |
| Kebebasan kustomisasi tenant | Penuh | Terbatas template | **Penuh (CMS)** |
| Duplikasi kode | Sedang | Tinggi | **Minimal** |
| Kecepatan ke produksi | — | Lambat | **Cepat** |
| **Pilihan** | Tolak | Tolak | **✅ Rekomendasi** |

### Kenapa bukan A (semua di GrapesJS)

Page builder drag-and-drop menghasilkan HTML statis. Ia tidak bisa — dan tidak boleh — memegang state ketersediaan, kalkulasi quote, OTP, dan state machine pembayaran. Risiko double-booking dan uang salah hitung terlalu besar untuk diserahkan ke editor visual.

### Kenapa bukan B (modul template baru)

Membangun modul yang mengulang landing + catalog + reservation berarti menduplikasi `Rental Public` (yang sudah terintegrasi Midtrans, deposit, OTP) **dan** GrapesJS sekaligus. Hasilnya: dua sumber kebenaran untuk katalog/booking, beban maintenance ganda, dan tetap butuh backend yang sama persis. Effort tinggi, nilai tambah nol.

---

## 3. Cetak Biru: Satu Brand, Dua Mesin, Dijembatani

Empat lapisan. Satu **Theme Layer** di atas menyatukan identitas; di bawahnya CMS dan reservation engine berjalan masing-masing; **Bridge Blocks** mengalirkan data live dari mesin ke halaman CMS.

```
              Tenant Public Domain — rental.namatenant.com
              (resolusi tenant per-domain, Stancl Tenancy)
                              │
   ┌──────────────────────────────────────────────────────────┐
   │  LAYER 1 · STOREFRONT THEME  (baru)                        │
   │  Logo · Warna · Kontak/WA · Hero · Sosial · Custom domain  │
   │  → satu identitas, menggantikan brand() hardcoded          │
   └──────────────────────────────────────────────────────────┘
                              │  diwarisi oleh
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
 ┌───────────────┐   ┌──────────────────┐   ┌────────────────────┐
 │ LAYER 2a      │   │ LAYER 3 · jembatan│   │ LAYER 2b           │
 │ CMS/Marketing │   │ Bridge Blocks     │   │ Reservation Engine │
 │ Pages·GrapesJS│   │ blok GrapesJS     │   │ Rental Public      │
 │               │   │ dinamis           │   │ /book/rental       │
 │ homepage,     │   │ • search widget   │   │ • Search+avail.    │
 │ tentang,      │   │ • armada unggulan │   │ • VehicleShow+quote│
 │ promo, FAQ,   │   │ • fleet grid      │   │ • Booking+Midtrans │
 │ S&K, kontak   │   │ • CTA booking/WA  │   │ • History          │
 │               │   │                   │   │                    │
 │ HTML statis   │   │ deep-link & data  │   │ data live          │
 │ SEO·bebas-edit│   │ live ───────────► │   │ React/Inertia      │
 └───────────────┘   └──────────────────┘   └────────────────────┘
```

### Layer 1 — Storefront Theme (fondasi paling berdampak)

Ganti `brand()` yang mengembalikan warna hardcoded (`PublicRentalBookingController::brand()`) dengan grup setting `rental.storefront.*` yang dikelola tenant. Nilainya mengalir ke tiga tempat:

- **Ke app React** — `brand()` membaca setting; komponen `Public/*` memakai warna & kontak tenant, bukan teal tetap.
- **Ke render GrapesJS** — inject sebagai CSS variables di `modules/Pages/resources/views/render.blade.php` sehingga halaman page-builder otomatis ikut warna brand.
- **Panel admin** — perluas *Rental Settings* yang sudah ada (tempat toggle `passenger_booking_enabled` berada di `RentalSettingsController` + `Settings/Index.tsx`).

Setting minimum yang disarankan: `logo_url`, `primary_color`, `secondary_color`, `support_phone` / WhatsApp, `hero_title`, `hero_subtitle`, `hero_image`, tautan sosial, jam operasional, dan `custom_domain` (opsional).

### Layer 3 — Bridge Blocks (kunci "landing page bisa dikustom penuh")

Bridge Blocks **bukan langkah transaksi** (lihat kotak "Batas transaksi" di bawah). Mereka adalah etalase + pintu masuk yang dipasang di halaman CMS untuk mengarahkan pengunjung ke reservation engine. Sifatnya read-only atau link-out.

Perlu dipisah dua hal: **(a) cara blok muncul di panel editor**, dan **(b) apa yang disimpan di halaman + cara render-nya.**

**(a) Pendaftaran blok — pakai mekanisme yang sudah ada, malah ideal.**
`PageComponent` memakai `CentralConnection` (`modules/Pages/Models/PageComponent.php`) — tabel `page_components` berada di database **central, bukan per-tenant**. Jadi Bridge Block cukup didefinisikan **sekali di platform** dan **semua tenant otomatis dapat**. Ini justru pas untuk blok yang disediakan platform.

**(b) Yang disimpan di halaman — di sinilah bedanya dari `PageComponent` biasa.**
`PageComponent` biasa menyimpan **HTML statis final** di kolom `content`; saat di-drag, HTML itu disalin apa adanya ke `Page.html` dan **dibekukan**. Bridge Block yang data-live **tidak boleh** membekukan data — yang disimpan di `Page.html` hanya **penanda ringan** (mis. `<rental-fleet type="featured" limit="6">`), dan daftar mobil-nya dirender **server-side saat halaman dibuka**.

> **Preseden sudah ada di kodebase — tidak ada pola baru yang perlu ditemukan.**
> `render.blade.php` sudah melakukan persis ini:
> - **Carousel** — `preg_replace_callback` menemukan tag `<carousel slug="...">` di HTML halaman lalu menggantinya dengan view **live** `carousels::carousel` (data dari model `Carousel`), digate `Modules::available('carousels')`. Di sisi editor, blok ini didaftarkan via `DomComponents.addType('carousel-component')` dengan trait `slug` + placeholder (`Editor.tsx`).
> - **Pricing table** — token `{{pricing_table}}` diganti HTML pricing live saat render.
>
> Bridge Blocks tinggal **menambah satu handler `rental-*`** pada pola yang sama.
>
> *(Koreksi atas draf awal: rendering data-live memakai penggantian penanda server-side seperti Carousel — bukan hydration JavaScript di sisi klien. Server-side lebih andal dan lebih baik untuk SEO.)*

**Peta konkret per blok:**

| Blok | Cara daftar (implementasi) | Yang disimpan di `Page.html` | Render | Status |
| --- | --- | --- | --- | --- |
| **Search widget** | `BlockManager.add` di `Editor.tsx` | `<form action="/book/rental" method="GET">…</form>` statis | Tidak perlu hydration | ✅ Fase 2 |
| **Armada unggulan** | `addType` + trait `limit` (pola Carousel) | penanda `<rental-fleet type="featured" limit="6">` | Handler `render.blade.php` → `RentalStorefrontBlocks::renderFleet` | ✅ Fase 2 |
| **Fleet grid per kelas** | `addType` + trait `limit` & `fleetclass` | penanda `<rental-fleet … data-fleet-class="suv">` | Handler `render.blade.php` → view live | ✅ Fase 3 |
| **Ulasan pelanggan** | `addType` + trait `limit` | penanda `<rental-reviews limit="6">` | Handler `render.blade.php` → `RentalStorefrontBlocks::renderReviews` | ✅ Fase 3 |

> **Catatan implementasi (menyimpang dari draf awal):** semua Bridge Block didaftarkan di **`Editor.tsx`** (BlockManager + `addType`), **bukan** tabel `page_components`. Alasannya lebih robust: blok ikut ter-*ship* bersama kode dan otomatis tersedia untuk semua tenant tanpa perlu menjalankan seeder. Blok fleet-per-kelas memakai atribut **`data-fleet-class`** (bukan `class`) agar tidak berbenturan dengan penanganan class khusus di GrapesJS.

**Aturan singkat:** blok tanpa parameter & statis → HTML statis. Blok berparameter/data-live → pola `addType` + penanda + handler render (persis Carousel), karena butuh trait di editor dan rendering server.

### Batas transaksi — apa yang tetap di engine

Bridge Blocks hanya *menampilkan* dan *mengarahkan*. Seluruh proses transaksi tetap utuh sebagai satu aplikasi di `/book/rental` — **tidak dipecah menjadi widget per langkah.**

| | Bridge Block (di GrapesJS) | Engine (`/book/rental`) |
| --- | --- | --- |
| **Search widget** | Form yang cuma `GET /book/rental?...` — tidak hitung ketersediaan | Hasil pencarian + availability + quote |
| **Armada / fleet grid** | Menampilkan daftar mobil (read-only), klik → engine | Detail kendaraan + mulai booking |
| **CTA booking / WhatsApp** | Sekadar tombol/link | — |
| **Deposit, OTP, bayar, kelola booking** | ❌ tidak ada di sini | ✅ semua di sini, tetap utuh |

**Boleh jadi Bridge Block** → apa pun yang cuma *menampilkan* atau *mengarahkan* (read-only + navigasi).
**Wajib tetap di engine** → apa pun yang *menulis data*, *menghitung harga/ketersediaan*, *memproses pembayaran*, atau *punya state* (hold, OTP, status booking). Alasan: transaksi butuh locking anti double-booking, validasi server, dan integrasi pembayaran yang tidak aman/andal dari HTML statis GrapesJS, sekaligus menghindari duplikasi logika engine.

### Routing / Information Architecture

- Reservation engine tetap di `/book/rental` (rute `book.rental.*`).
- Homepage GrapesJS tetap di `/` (`PageController@homepage`).
- Theme Layer mengikat keduanya secara visual sehingga terasa satu situs.

---

## 4. Roadmap Bertahap

Diurutkan menurut dampak per usaha. **Fase 1–3 sudah diimplementasikan (per 2026-08-24); Fase 4 belum.**

### ✅ Fase 1 — Storefront Theme Layer *(implemented)*

Grup setting `rental.storefront.*` + panel admin; `brand()` dinamis + inject CSS variables ke `render.blade.php`.

- `modules/Rental/Support/RentalStorefrontSettings.php` — manager 12 field (nama, warna primer/sekunder, logo, WA, hero, sosial, jam operasional)
- Tab **Storefront** di `Settings/Index.tsx` + `StorefrontPanel.tsx`; route `rental.settings.storefront.update`
- `brand()` (`PublicRentalBookingController`) tidak lagi hardcoded; logo & hero dipakai di halaman `Public/*.tsx`
- `render.blade.php` inject `--brand-primary` / `--brand-secondary`

**Kemenangan:** Branding konsisten seketika; tidak menyentuh alur booking.

### ✅ Fase 2 — Bridge Blocks inti *(implemented)*

Blok **Cari Kendaraan** (form statis) + **Armada Unggulan** (penanda `<rental-fleet>` + handler render server, pola Carousel). Didaftarkan di `Editor.tsx` (central via kode).

- `modules/Rental/Support/RentalStorefrontBlocks.php` + partial `rental::storefront.fleet`
- Handler `<rental-fleet>` di `render.blade.php`; blok + component-type di `Editor.tsx`

**Kemenangan:** Tenant merakit landing page yang menyalurkan pengunjung ke reservation engine.

### ✅ Fase 3 — Konversi & SEO *(implemented, kecuali i18n)*

- **Fleet grid per kelas** — trait `fleetclass` + blok "Armada per Kelas" (`data-fleet-class`)
- **SEO per-kendaraan** — `vehicleSeo()` → meta/OG/Twitter + JSON-LD `Car`+`Offer` di `VehicleShow.tsx`
- **Halaman hasil pembayaran** — `PaymentResult.tsx` + route `book.rental.booking.result`; `finishPath` deposit/invoice diarahkan ke sini
- **Ulasan/testimoni** — `RentalTestimonials` (JSON di setting) + tab **Testimoni** + blok `<rental-reviews>`
- **i18n storefront** — *belum; dipindah ke Fase 4*

**Kemenangan:** Naikkan trafik organik dan tingkat konversi booking.

### ◑ Fase 4 — Skala & polish *(sebagian)*

- **Template landing siap-pakai** — ✅ blok `Rental: Landing Lengkap` di `Editor.tsx` (hero + pencarian + armada + ulasan + CTA dalam satu drop)
- **i18n storefront (id/en)** — ◑ sebagian: komponen `LanguageToggle` (persist via `locale.update`) + `Search.tsx` & `PaymentResult.tsx` dikonversi penuh ke `t('rental.storefront_ui.*')` dengan kunci id+en. Terverifikasi live (halaman render en/id sesuai toggle). *Belum: `VehicleShow.tsx`, `Booking.tsx`, `History.tsx` (masih hardcoded ID; degrade rapi karena tiap `t()` punya fallback).*
- **Custom domain per tenant** — ⬜ belum (infra tenancy/central; tunggu bisa diuji)
- **SSR / meta server-side** untuk scraper non-JS — ⬜ belum (infra build/runtime; tunggu bisa diuji)
- **Analytics storefront** — ⬜ belum

**Kemenangan:** Onboarding tenant baru dalam hitungan menit, bukan hari.
