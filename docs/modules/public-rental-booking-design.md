# Public Rental Booking (PWA Web) — Product & Engineering Design

**Audience:** Product, backend, frontend  
**Surface:** Halaman web publik pemesanan sewa kendaraan (customer / booker)  
**URL base:** `https://{tenant-domain}/book/rental`  
**Stack UI:** Inertia.js v2 + React 18 + Tailwind (sama PWA shuttle)  
**Domain spine:** `MobileRentalBookingService` + Fleet availability + Midtrans deposit  
**Dokumen terkait:** [`mobile-rental-app-design.md`](./mobile-rental-app-design.md) · [`mobile-booking-api-design.md`](./mobile-booking-api-design.md) · pola shuttle di `PublicPassengerBookingController`

> **Prinsip:** Ini adalah **UI web publik** di atas spine rental yang sudah ada. Jangan buat domain booking kedua. Staff CRM + Partner Portal tetap permukaan operasi; halaman ini untuk **penyewa konsumen**. App Capacitor (`mobile-rental-app-design`) adalah permukaan paralel yang memakai **API JSON** yang sama secara semantik.

---

## 0. Keputusan produk (terkunci)

| Aspek | Keputusan | Alasan |
|---|---|---|
| Channel permukaan | PWA Inertia di `/book/rental/*` | Mirror `/book/shuttle`; zero install; share link mudah |
| Auth booker | OTP HP (session cache, pola shuttle) | Cookie session cukup untuk PWA; tanpa Bearer staff |
| Tenancy | Domain tenant | Sama shuttle/track; tanpa `X-Tenant` |
| Channel DB | `Rental::CHANNEL_WEB` (`web`) | Audit terpisah dari `staff` & `mobile` (app) |
| Gate fitur | Setting `rental.passenger_booking_enabled` | Satu flag untuk web + mobile API |
| Create booking | `pending_reserved` + TTL (default 120 mnt) | Mirror HQ + service existing; unit di-hold sampai bayar/expire |
| Zero deposit | Auto-promote ke `confirmed` | Sudah di `MobileRentalBookingService::create` |
| Pembayaran MVP | Deposit via Midtrans Snap (redirect) | Soft-bridge Receivables; sisa sewa di counter/invoice |
| Handover / return | **Staff-only** di MVP | Checklist + foto + TTD butuh proses cabang |
| Bahasa UI | ID dulu (`lang/id/rental.php` key `rental.public.*`) | Pasar rental Indonesia |
| Deep link | `/book/rental/booking/{public_token}` | Share ke WhatsApp / email tanpa login |

### Anti-pola (jangan)

- Remote iframe ke halaman staff CRM / reservation wizard
- Token staff CRM di browser customer
- Spine booking baru yang bypass `Rental` / Fleet calendar
- Self-checkout / self-return dari PWA di MVP
- Duplikasi logic quote/availability di luar `MobileRentalBookingService`
- Kartu kredit disimpan di frontend

### Relasi dengan desain mobile app

| | Web PWA (dokumen ini) | Capacitor shell |
|---|---|---|
| Transport | Inertia form + redirect | JSON `/api/mobile/v1/rental/*` |
| Auth | OTP verify per aksi + session cache | Bearer 30 hari |
| Channel | `web` | `mobile` |
| Domain | Shared: quote, create, cancel, pay-deposit | Shared |
| Status create | `pending_reserved` (aktual di service) | sama |

> Catatan: `mobile-rental-app-design.md` §0 menyebut “auto-confirm”; **implementasi aktual** adalah `pending_reserved` lalu confirm setelah deposit (atau langsung confirm bila deposit 0). Desain web mengikuti **kode**, bukan teks lama.

---

## 1. Problem & opportunity

### Problem tenant

Operator rental punya armada + tarif di CRM, tapi booker masih WhatsApp / walk-in. Shuttle sudah punya PWA publik; rental belum punya permukaan web setara.

### Opportunity

| Persona | Job-to-be-done |
|---|---|
| **Booker konsumen** | Cari mobil tersedia → harga jelas → pesan + bayar deposit → datang pickup |
| **Tenant ops** | Booking masuk otomatis, unit reserved, deposit Snap, kurang chat manual |
| **Platform Seruwit** | Parity channel: shuttle web ↔ rental web; mobile API sudah siap |

### Outcome sukses (30–60 hari setelah W1)

1. Tenant dengan `passenger_booking_enabled=1` bisa share URL `/book/rental`
2. Booker menyelesaikan funnel search → quote → OTP → book → pay deposit tanpa staff
3. Booking muncul di CRM list dengan `channel=web`, status `pending_reserved` / `confirmed`
4. TTL expire melepaskan unit; cancel pre-checkout melepaskan unit
5. Feature tests hijau untuk happy path + gate disabled + overlap

---

## 2. Scope

### In scope — MVP (W1)

| Area | Isi |
|---|---|
| Discover | Tanggal sewa, kelas, cabang pickup/return |
| Catalog | List + detail kendaraan (foto bila ada, kelas, kapasitas, harga indikatif) |
| Quote | Live breakdown: base, periods, one-way, asuransi, total, deposit |
| Auth | OTP HP sebelum create / history / cancel / pay |
| Book | Create `pending_reserved`; idempotency key opsional (UUID di form) |
| Pay | Pay deposit Snap → return URL ke booking detail |
| Manage | Detail by token, riwayat by phone+OTP, batal |
| Gate | 404/empty state jika setting off atau modul rental tidak tersedia |
| Ops visibility | Channel `web` di list/filter CRM (minimal tampilan badge) |

### Out of scope — W2+

| Area | Alasan tunda |
|---|---|
| Self checkout / return / foto handover | Ops cabang + bukti hukum |
| Extend / swap / damage dari PWA | Flow kompleks; staff UI sudah ada |
| Upload SIM / KTP / KYC | Storage + review policy |
| With-driver / chauffeur | Domain driver assignment beda UX |
| Push / email marketing automation | Event bus terpisah |
| Live GPS unit saat sewa | Soft Tracking |
| Full rental pay online (bukan deposit) | MVP deposit-only |
| Cancel fee window dinamis | Policy staff sudah ada; UI konsumen W2 |

---

## 3. Posisi arsitektur

```
┌──────────────────────────────────────────────────────────────┐
│  Browser (customer PWA)                                      │
│  /book/rental  →  Inertia Pages Modules/Rental/Public/*      │
└────────────────────────────┬─────────────────────────────────┘
                             │ Inertia + form POST
                             ▼
┌──────────────────────────────────────────────────────────────┐
│  PublicRentalBookingController (baru)                        │
│  Gate: Modules::available('rental') + passenger_booking flag │
│  OTP: reuse PassengerOtpService (atau RentalOtp wrapper)     │
└────────────────────────────┬─────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────┐
│  MobileRentalBookingService (existing, diperluas channel)    │
│  RentalRateResolver · RentalEligibility · Confirmation       │
│  Fleet Vehicle availability · Partners booker-by-phone       │
│  Receivables Midtrans Snap (deposit)                         │
└──────────────────────────────────────────────────────────────┘
```

| Layer | Peran |
|---|---|
| Public pages | UI search → checkout → booking → history |
| Controller | Validasi form, OTP, map props Inertia, throttle |
| Service | Quote / create / cancel — single source of truth |
| Fleet / Partners / Receivables | Unit, booker, pembayaran |

**Tidak** memanggil mobile JSON API dari browser PWA (hindari double hop + CORS/CSRF complexity). Logic domain dipanggil langsung seperti shuttle.

---

## 4. Funnel: langkah & status

### 4.1 Funnel UX

```
Search criteria
    → Vehicle list (available_only)
        → Vehicle detail / configure extras
            → Checkout (live quote + OTP)
                → Booking detail (pending_reserved)
                    → Pay deposit (Snap)
                        → confirmed (deposit received)
                    → (atau) Expire TTL → pending / release unit
                    → (atau) Cancel → cancelled
```

### 4.2 State machine (konsumen vs ops)

```
[PWA] quote → create ──► pending_reserved ──pay deposit──► confirmed
                              │                  │
                              │ TTL expire       └── (zero deposit: langsung confirmed)
                              ▼
                           pending / released (lihat RentalPendingReservedExpirer)
                              │
                              └── cancel ──► cancelled

[Staff CRM] confirmed ──checkout──► active ──return──► returned ──complete──► completed
```

| Status di UI booker | Copy yang ditampilkan |
|---|---|
| `pending_reserved` | “Menunggu pembayaran deposit — unit ditahan sampai {reserved_until}” |
| `confirmed` | “Reservasi aktif — siap pickup sesuai jadwal” |
| `active` | “Sedang disewa” (read-only) |
| `returned` / `completed` | “Selesai” |
| `cancelled` | “Dibatalkan” |
| `pending` (pasca expire) | “Reservasi kedaluwarsa — unit tidak lagi ditahan” |

PWA **tidak** mengeksekusi checkout/return.

---

## 5. Information architecture & screens

### 5.1 Route map

Prefix: `/book/rental` · name: `book.rental.*` · middleware: `throttle:30,1` (mirror shuttle)

| Method | Path | Name | Auth | Aksi |
|---|---|---|---|---|
| GET | `/` | `search` | — | Form tanggal/lokasi + hasil list (query string) |
| GET | `/vehicles/{vehicle}` | `vehicles.show` | — | Detail unit + ringkasan quote awal |
| POST | `/quote` | `quote` | — | JSON/Inertia partial: live quote (opsional; bisa GET props) |
| POST | `/bookings` | `bookings.store` | OTP | Create booking |
| POST | `/otp` | `otp` | — | Kirim OTP |
| GET | `/booking/{token}` | `booking.show` | — | Detail (public_token) |
| POST | `/booking/{token}/pay-deposit` | `booking.pay_deposit` | OTP* | Snap redirect |
| POST | `/booking/{token}/cancel` | `booking.cancel` | OTP | Batal |
| GET | `/history` | `history` | OTP | Riwayat by phone |

\*OTP: jika session `otp_ok` masih valid untuk phone booker, skip input ulang (pola shuttle `isVerified`).

### 5.2 Screen briefs

#### Search (`/book/rental`)

- Brand header (nama tenant + warna primary dari setting/branding, mirror shuttle)
- Fields: `start_date`, `end_date`, `period_type` (default `daily`), `pickup_location_id`, `return_location_id` (default = pickup), optional `rental_class`
- CTA **Cari ketersediaan** → GET dengan query
- Hasil: kartu kendaraan (nama, kelas, seats, `from_price` jika tersedia, foto)
- Empty: ubah tanggal/kelas
- Footer singkat: “Pengambilan & pengembalian di cabang”

#### Vehicle detail

- Spesifikasi, kebijakan bahan bakar (jika ada)
- Sticky CTA **Lanjut sewa** → checkout section / halaman checkout dengan state tanggal & lokasi dari search

#### Checkout (bisa section di detail atau halaman terpisah)

1. Panggil quote setiap ubah asuransi / one-way / tanggal
2. Breakdown: base × periods, one-way, asuransi, **total sewa**, **deposit**
3. Jika `available: false` → block submit + tampilkan `reasons`
4. Fields: `customer_name`, `booker_phone`, `otp_code`, optional `notes`
5. Tombol Kirim OTP + countdown throttle
6. Submit create → redirect ke `booking.show`
7. Countdown copy TTL: “Setelah pesan, Anda punya {ttl} menit untuk bayar deposit”

#### Booking detail

- Status badge + `reserved_until` countdown bila `pending_reserved`
- Ringkasan unit, tanggal, lokasi, amounts
- CTA **Bayar deposit** bila belum received + gateway on
- CTA **Batalkan** bila status cancellable passenger (`pending_reserved` / `confirmed` pre-checkout)
- Return dari Snap → halaman ini; poll ringan / reload props sampai `deposit_received` / `confirmed`
- Bantuan: `support_phone` dari brand bila ada

#### History

- Input phone + OTP (atau session verified)
- List booking `channel in (web, mobile)` milik phone — opsional: tampilkan keduanya agar booker lihat pesanan app juga
- Tap → detail by token

### 5.3 Wireframe alur (teks)

```
┌─────────────────────┐
│  Brand · Sewa Mobil │
│  [tgl] [lokasi]     │
│  [Cari]             │
│  ┌──┐ ┌──┐ ┌──┐     │
│  │V1│ │V2│ │V3│     │
└─────────────────────┘
          │
          ▼
┌─────────────────────┐
│  Detail Avanza ···  │
│  Quote live         │
│  Asuransi [ ]       │
│  Nama / HP / OTP    │
│  [Pesan sekarang]   │
└─────────────────────┘
          │
          ▼
┌─────────────────────┐
│  RSV-2026-…         │
│  Pending reserved   │
│  Bayar sebelum …    │
│  [Bayar deposit]    │
│  [Batalkan]         │
└─────────────────────┘
```

---

## 6. Model data & perubahan backend

### 6.1 Yang sudah ada (reuse)

- `rentals` + `public_token`, `booker_phone`, `reserved_until`, `channel`
- `MobileRentalBookingService::quote` / `create` / `cancel`
- `RentalPendingReservedExpirer` + schedule `rental:expire-pending-reserved`
- Setting `rental.passenger_booking_enabled`, `rental.pending_reserved_ttl_minutes`
- Insurance packages, rates, Fleet vehicles, Partners locations
- Midtrans deposit charge purpose `rental_deposit`

### 6.2 Perubahan kecil yang diperlukan

| Perubahan | Detail |
|---|---|
| `Rental::CHANNEL_WEB = 'web'` | Konstanta baru |
| Service create | Parameter `channel` default `mobile`; web controller kirim `web` |
| Cancel guard | Terima channel `mobile` **atau** `web` (bukan hanya mobile) |
| Helper | `Rental::passengerChannels(): array` → `['mobile','web']` untuk query history/filter |
| Setting hint copy | Update hint: aktifkan **web publik + API mobile** |
| CRM badge | Tampilkan channel `web` di list/show (i18n) |

### 6.3 Tidak perlu tabel baru di MVP

Tidak ada migrasi skema besar. Channel enum/string existing cukup.

### 6.4 Gap UX (backlog kecil, boleh W1 atau W1.1)

| Gap | Prioritas | Catatan |
|---|---|---|
| Foto kendaraan di props publik | W1 | Dari media Fleet bila ada |
| `from_price` di list | W1 | Hindari N+1 quote; hint dari rate default |
| `brand.support_phone` | W1 | Bantuan di booking active |
| Mask plat di list publik | W1.1 | Kebijakan privasi opsional |
| Idempotency store web | W1 | Session/cache key seperti mobile API |

---

## 7. Kontrak controller & validasi

### 7.1 Create booking (POST `/bookings`)

```
vehicle_id: required|integer|exists:vehicles,id
start_date: required|date|after_or_equal:today
end_date: required|date|after_or_equal:start_date
period_type: required|in:daily,weekly,monthly
customer_name: required|string|max:120
booker_phone: required|string|max:32
otp_code: required|string|size:6
pickup_location_id: nullable|exists:locations,id
return_location_id: nullable|exists:locations,id
insurance_package_id: nullable|exists:rental_insurance_packages,id
notes: nullable|string|max:1000
idempotency_key: nullable|uuid
```

Setelah OTP OK → `MobileRentalBookingService::create($phone, $input)` dengan `channel=web`.

### 7.2 Pay deposit

- Assert booking channel passenger + phone match (atau OTP verify)
- Reuse flow Snap yang dipakai mobile `payDeposit` / staff `payDepositOnline`
- `finish` / `unfinish` URL → `book.rental.booking.show`

### 7.3 Cancel

- Reason required (string pendek)
- Hanya status cancellable; `chargeFee: false` untuk self-serve MVP (mirror mobile)
- Expire pending gateway charges deposit

### 7.4 Error UX

| Situasi | Respons UI |
|---|---|
| Feature off / modul missing | 404 atau empty branded “Booking belum aktif” |
| OTP invalid | Inline error `otp_code` |
| OTP 429 | Cooldown copy |
| Quote unavailable / overlap | Inline di checkout |
| Gateway off | Sembunyikan bayar online; copy “bayar deposit di cabang” |
| TTL lewat | Badge kedaluwarsa; CTA cari lagi |

---

## 8. Struktur file usulan

### Backend

```
modules/Rental/Http/Controllers/PublicRentalBookingController.php
modules/Rental/Http/Requests/Public/
  SearchPublicRentalRequest.php          # opsional
  StorePublicRentalBookingRequest.php
  CancelPublicRentalBookingRequest.php
```

Perluasan:

```
modules/Rental/Support/MobileRentalBookingService.php  # channel param
modules/Rental/Models/Rental.php                       # CHANNEL_WEB + passengerChannels()
routes/app.php                                         # group book/rental
```

OTP: **reuse** `Modules\Shuttle\Support\PassengerOtpService` bila shuttle terpasang, **atau** ekstrak ke foundation shared (`App\Support\PassengerOtpService`) bila rental-only tenant tanpa shuttle. Keputusan implementasi:

1. Prefer extract shared bila rental bisa hidup tanpa modul shuttle
2. Interim: duplicate thin `RentalPassengerOtpService` dengan cache key `rental_otp:` jika extract terlalu besar untuk W1

### Frontend

```
modules/Rental/resources/js/Pages/Modules/Rental/Public/
  Search.tsx
  VehicleShow.tsx      # detail + checkout
  Booking.tsx          # detail / pay / cancel
  History.tsx
  Partials/
    BrandHeader.tsx
    VehicleCard.tsx
    QuoteBreakdown.tsx
    OtpFields.tsx
```

Styling: ikuti konvensi Tailwind existing PWA shuttle (bukan redesign brand platform). Brand color dari props `brand.color`.

### Tests

```
tests/Feature/Modules/Rental/PublicRentalBookingTest.php
```

Cover:

- Disabled flag → 404 / disabled page
- Search list available_only
- Quote unavailable blocks create
- OTP invalid
- Create → `pending_reserved` + `channel=web`
- Zero deposit → `confirmed`
- Pay deposit redirect (mock gateway bila pola shuttle ada)
- Cancel melepaskan overlap
- History filtered by phone
- Throttle smoke (opsional)

---

## 9. Keamanan & kepatuhan

- Throttle group `30/min`; OTP endpoint lebih ketat (`20/min` seperti geocode shuttle bila perlu)
- `public_token` entropy tinggi (existing `Str::random(40)`); boleh dibuka tanpa login
- Aksi mutasi (cancel/pay) wajib OTP / ownership phone
- Jangan expose debug OTP di production
- Jangan log nomor lengkap + kode OTP bersama
- Plat: pertimbangkan mask di list publik
- CSRF: form Inertia standar (bukan JSON mobile CSRF-exempt)
- Tidak ada endpoint yang mengembalikan data staff-only (harga internal cost, margin)

---

## 10. Observability & analytics (minimal)

| Event (opsional client / log) | Props |
|---|---|
| `rental_web_search` | nights, class, location_id |
| `rental_web_vehicle_view` | vehicle_id |
| `rental_web_book_success` | code |
| `rental_web_deposit_start` / `_paid` | code |
| `rental_web_cancel` | code |

CRM: filter channel `web` di dashboard/list untuk mengukur adopsi.

---

## 11. Copy & i18n

Namespace: `rental.public.*` di `lang/id/rental.php` + `lang/en/rental.php`.

Contoh key:

- `rental.public.title` — Sewa kendaraan
- `rental.public.search_cta` — Cari ketersediaan
- `rental.public.quote_unavailable` — (sudah ada)
- `rental.public.reserved_until_hint` — Bayar deposit sebelum :time agar unit tetap ditahan
- `rental.public.pay_deposit` — Bayar deposit
- `rental.public.cancel_confirm` — Batalkan reservasi? Unit akan dilepas.
- `rental.public.disabled` — Pemesanan online belum diaktifkan
- `rental.public.pickup_note` — Pengambilan & pengembalian dilakukan di cabang

---

## 12. Roadmap implementasi

| Phase | Isi | Definition of Done |
|---|---|---|
| **W0** | Doc ini + keputusan channel `web` + OTP strategy | Disetujui produk |
| **W1a** | Routes + controller gate + Search list + VehicleShow read-only | Browse tanpa auth |
| **W1b** | Quote live + OTP + create `pending_reserved` | Booking muncul di CRM `channel=web` |
| **W1c** | Booking detail + pay-deposit Snap + cancel + history | Happy path E2E sandbox |
| **W1d** | `from_price`/foto/support phone + CRM channel badge + i18n | Polish MVP |
| **W2** | Cancel window policy UI, email konfirmasi, mask plat | ✅ Ops polish |
| **W3** | Extend request, doc upload, full online pay | ✅ Self-serve lanjutan |


**Estimasi W1:** ~4–7 hari (1 BE + 1 FE), asumsi Midtrans deposit sudah jalan seperti mobile/staff.

**Dependency:** Modul `rental`, `fleet`, `partners`, `invoicing`; soft `receivables` untuk bayar online.

---

## 13. Kriteria siap ship W1

- [x] Setting `passenger_booking_enabled=1` + ≥1 rate + ≥1 vehicle available di staging
- [x] Feature tests `PublicRentalBookingTest` hijau
- [ ] Funnel search → book → pay sandbox → confirmed (manual QA Midtrans)
- [x] TTL expire melepaskan unit (command existing tetap jalan)
- [x] Cancel pre-checkout melepaskan overlap
- [x] Shuttle PWA tidak regres
- [x] Mobile rental API tidak regres (`MobileRentalBookingApiTest`)
- [x] Copy empty/disabled dalam Bahasa Indonesia
- [ ] URL absolut via domain tenant (Herd / production) — verifikasi manual

---

## 13b. Kriteria siap ship W2

- [x] Setting `passenger_free_cancel_hours` + UI di Rental Settings
- [x] Assessment cancel di PWA (gratis vs biaya) + charge fee saat dalam jendela
- [x] Email konfirmasi `booked` / `cancelled` (+ reuse `confirmed`) dengan link `/book/rental/booking/{token}`
- [x] Field email opsional di checkout publik
- [x] Mask plat katalog (`RentalPlateMasker`) + toggle `public_mask_plates`; plat penuh di detail reservasi
- [x] Feature tests W2 hijau

---

## 13c. Kriteria siap ship W3

- [x] Passenger extend request → staff approve/reject (tidak auto-apply dari PWA)
- [x] Upload KTP/SIM di booking publik (OTP-gated)
- [x] Bayar invoice terbuka via Midtrans (`createInvoiceCharge` + finish path publik)
- [x] Booking payload: payment summary, pending extend, document flags
- [x] Feature tests W3 hijau

---

## 14. Open questions (perlu konfirmasi sebelum coding W1b)

1. **OTP shared vs rental-only:** Extract `PassengerOtpService` ke App foundation, atau interim service di modul Rental?
2. **History cross-channel:** Tampilkan booking `web`+`mobile` di history PWA, atau hanya `web`?
3. **Partner portal overlap:** Booker yang kebetulan jadi Partner login — apakah cukup PWA, atau deep-link ke portal setelah create?
4. **Branding:** Pakai pola `brand` sederhana seperti shuttle (`name` + `color`), atau tarik logo dari settings CMS?

**Usulan default jika tidak dijawab:** (1) extract shared bila mudah, else `RentalPassengerOtpService`; (2) tampilkan `web`+`mobile`; (3) PWA saja di MVP; (4) mirror shuttle brand props.

---

## 15. Ringkasan eksekutif

Halaman pemesanan rental customer **belum ada**; desain lengkapnya adalah **PWA Inertia di `/book/rental`**, mem-mirror shuttle, memakai **spine `MobileRentalBookingService`**, channel **`web`**, auth **OTP**, status awal **`pending_reserved`**, bayar **deposit Midtrans**, fulfillment **staff-only**. App mobile tetap permukaan terpisah di atas API JSON yang sama secara domain.
