# Mobile Rental App — Product & Engineering Design

**Audience:** Product, shell engineers, backend owners  
**Surface key:** `rental` (di `enabledSurfaces` + bootstrap `surfaces.rental`)  
**Stack:** Sama dengan Travel — Capacitor 8 + React 19 + Vite + TypeScript (bundled SPA, bukan remote WebView)  
**Repo shell:** `seruwit-mobile-booking-shell` (satu codebase; surface diaktifkan per tenant)  
**API:** `https://{tenant-domain}/api/mobile/v1` — namespace `/rental/*`  
**Dokumen induk:** [`mobile-app-builder-design.md`](./mobile-app-builder-design.md) · [`mobile-booking-api-design.md`](./mobile-booking-api-design.md)

> **Prinsip:** Shell rental adalah **UI client** di atas spine Rental yang sudah ada (`MobileRentalBookingService`, Fleet availability, Midtrans deposit). Jangan buat domain booking kedua. Staff CRM + Partner Portal tetap permukaan operasi; app ini untuk **penyewa / booker konsumen**.

---

## 0. Keputusan produk (terkunci)

| Aspek | Keputusan | Alasan |
|---|---|---|
| Stack native | Capacitor + React (sama Travel) | Satu shell, satu CI AAB, skill reuse, white-label cepat |
| Repo | Satu shell; `features/rental/*` | Travel sudah M0; rental = surface kedua, bukan app baru |
| Auth | OTP HP → Bearer 30 hari (shared `/auth/*`) | Capacitor ≠ cookie; history & cancel butuh session |
| Tenancy | Domain tenant (`apiBaseUrl` bake) | Sama Travel; tanpa `X-Tenant` |
| Channel | `Rental::CHANNEL_MOBILE` | Audit & reporting terpisah dari `staff` |
| Create booking | Auto-confirm + reserve unit | UX mobile butuh kepastian unit; mirror API existing |
| Pembayaran MVP | Deposit via Midtrans Snap (Capacitor Browser) | Soft-bridge Receivables; sisa sewa bisa counter/invoice |
| Handover / return | **Staff-only** di MVP | Checklist + foto + tanda tangan butuh proses cabang |
| Identitas Play | 1 AAB per tenant (vertical `rental` atau `combined`) | Listing bermerek tenant; bukan multi-tenant single app |
| Bahasa UI | ID dulu; string lokal di shell | Pasar rental Indonesia |

### Anti-pola (jangan)

- Remote WebView ke halaman Inertia CRM / portal
- Token staff CRM di dalam app penumpang
- Spine booking baru yang bypass `Rental` / Fleet calendar
- Self-checkout / self-return dari app di MVP (risiko fraud & bukti handover)
- React Native / Flutter paralel — pecah effort white-label

---

## 1. Problem & opportunity

### Problem tenant

Operator rental (Pro plan) punya katalog armada + tarif di CRM, tapi booker masih WhatsApp / walk-in. Travel sudah punya jalur mobile; rental belum punya permukaan konsumen setara.

### Opportunity

| Persona | Job-to-be-done |
|---|---|
| **Booker konsumen** | Cari mobil tersedia → lihat harga jelas → pesan + bayar deposit → datang pickup |
| **Tenant ops** | Booking masuk otomatis confirmed, unit reserved, deposit Snap, kurang manual chat |
| **Platform Seruwit** | Surface kedua di shell yang sama → App Builder `enabled_surfaces: rental` / `combined` |

### Outcome sukses (90 hari setelah R1)

1. Tenant rental-only bisa generate AAB dengan surface `rental`
2. Booker menyelesaikan funnel search → quote → OTP → booking → pay deposit tanpa staff
3. Booking muncul di CRM list dengan `channel=mobile`, status `confirmed`, deposit trackable
4. Cancel dari app melepaskan unit (aturan existing draft/confirmed only)

---

## 2. Scope

### In scope — MVP (R1)

| Area | Isi |
|---|---|
| Discover | Tanggal sewa, kelas, cabang pickup/return, filter tersedia |
| Catalog | List + detail kendaraan (foto bila ada, kelas, kapasitas, tarif indikatif) |
| Quote | Harga periodik + deposit + one-way fee + asuransi (live dari API) |
| Auth | OTP shared; gate sebelum create |
| Book | Create + auto-confirm; `Idempotency-Key` |
| Pay | Pay deposit Snap → poll status booking |
| Manage | Detail by `public_token`, riwayat, batal |
| Platform | Bootstrap surface flag; home adaptif rental / combined |
| Android | Build via Cap + workflow AAB existing |

### Out of scope — fase berikutnya (R2+)

| Area | Alasan tunda |
|---|---|
| Self checkout / return / foto handover | Ops cabang + bukti hukum |
| Extend / swap / damage dari app | Flow kompleks; staff UI sudah ada |
| Upload SIM / KTP / verifikasi KYC | Butuh storage + review policy |
| With-driver / chauffeur package | Domain driver assignment beda UX |
| Push notifikasi (FCM) | Cap Push + CRM event bus |
| Live GPS unit saat sewa | Soft Tracking; bukan booking core |
| iOS Cap project + App Store | Android-first seperti Travel M0/M1 |
| OTA Capgo | Sudah di roadmap App Builder M4 |
| Dynamic yield / surge UI | Rate engine CRM dulu |

---

## 3. Posisi arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│  seruwit-mobile-booking-shell (Capacitor + React)           │
│  tenant-config.json → apiBaseUrl, enabledSurfaces           │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ auth/*       │  │ shuttle/*    │  │ rental/*  (baru)  │  │
│  │ (shared OTP) │  │ (existing)   │  │ Search→Book→Pay   │  │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬─────────┘  │
└─────────┼─────────────────┼────────────────────┼────────────┘
          │                 │                    │
          ▼                 ▼                    ▼
   /api/mobile/v1/auth   /shuttle/*         /rental/*
          │                                      │
          └──────────┬───────────────────────────┘
                     ▼
              Tenant domain Laravel
              MobileRentalBookingService
              Fleet Vehicle · Partner · Invoice · Midtrans
```

| Layer | Peran |
|---|---|
| Shell | UI, token storage (Preferences), Browser untuk Snap, deep link |
| Mobile API | JSON façade — **sudah implement** catalog/quote/book/pay/cancel |
| Domain Rental | Availability, rate snapshot, confirm, deposit, invoice |
| Fleet | Unit fisik + `rental_class` |
| Partners | Booker dari phone OTP |
| Receivables | Soft: Midtrans Snap deposit |

**Enable flag:** `rental.passenger_booking_enabled=1` → bootstrap `surfaces.rental.enabled: true`.

---

## 4. Perbandingan funnel: Travel vs Rental

| Step | Travel (shuttle) | Rental |
|---|---|---|
| 1 Intent | Koridor + tanggal | Tanggal sewa + lokasi |
| 2 Browse | Daftar departure / kursi | Daftar kendaraan tersedia |
| 3 Configure | Pax, pool/door | Periode, asuransi, one-way |
| 4 Commit | Hold (TTL) | **Create + confirm** (reserve) |
| 5 Pay | Full / amount due tiket | **Deposit** (bukan full sewa di MVP) |
| 6 Fulfill | Boarding / QR tiket | Pickup di cabang (staff checkout) |
| 7 After | Riwayat tiket | Riwayat sewa; cancel pre-checkout |

Implikasi UX: rental **tidak** punya hold TTL seperti shuttle. Setelah create, unit terkunci — UI harus konfirmasi harga & syarat sebelum submit, plus idempotency untuk retry jaringan.

---

## 5. Information architecture & screens

### 5.1 Route map (shell)

| Route | Screen | Auth | API |
|---|---|---|---|
| `/` | Home (surface-aware) | — | `GET /bootstrap` |
| `/login` | OTP (shared) | — | `otp/send`, `otp/verify` |
| `/rental` | Search criteria | — | `locations`, `classes` |
| `/rental/vehicles` | Hasil katalog | — | `GET /rental/vehicles` |
| `/rental/vehicles/:id` | Detail + mulai quote | — | `GET /rental/vehicles/{id}` |
| `/rental/checkout` | Quote extras + ringkasan | 🔒 create | `POST /quotes` → `POST /bookings` |
| `/rental/bookings/:token` | Booking detail / pay / cancel | mixed | GET + pay-deposit + cancel |
| `/rental/history` | Riwayat | 🔒 | `GET /rental/bookings` |
| `/history` | Hub riwayat (combined) | 🔒 | shuttle + rental lists |

Deep link (P1): `https://{tenant}/book/rental/{public_token}` → `/rental/bookings/:token`.

### 5.2 Screen briefs

#### Home
- Brand dari bootstrap; CTA utama: **Sewa mobil** bila `surfaces.rental.enabled`
- Combined: dua CTA setara (Travel / Rental) — bukan dashboard padat
- Chip status: rental aktif, gateway deposit available
- Link Masuk / Riwayat

#### Search (`/rental`)
- `start_date`, `end_date` (inclusive daily default)
- `period_type`: default `daily` (weekly/monthly jika rate tenant mendukung — hide bila tidak relevan)
- Pickup location (required dari `/locations`); return location (default = pickup)
- Optional filter `rental_class`
- CTA **Cari ketersediaan** → list dengan `available_only=1`

#### Vehicle list
- Card ringkas: nama/plat mask opsional, kelas, seats, harga/hari dari rate hint bila API sediakan
- Empty state: ubah tanggal / kelas
- Unavailable reasons tidak ditampilkan di list (hanya filter available)

#### Vehicle detail
- Spesifikasi + kebijakan bahan bakar (jika ada)
- Sticky CTA **Lanjut sewa** → checkout dengan query state tanggal/lokasi

#### Checkout
1. Panggil `POST /rental/quotes` (publik) setiap perubahan asuransi / lokasi
2. Tampilkan breakdown: base, periods, one-way, asuransi, **total sewa**, **deposit**
3. Alasan `available: false` → block submit + copy alasan
4. Nama booker + pastikan OTP session
5. Submit `POST /rental/bookings` + `Idempotency-Key` (UUID sekali per tap intent)
6. Navigate ke booking detail

#### Booking detail
- Status badge: `confirmed` / `active` / `cancelled` / …
- Ringkasan unit + tanggal + lokasi + amounts
- Jika deposit belum received + gateway on → **Bayar deposit**
- Pay: buka Capacitor Browser `redirect_url`; on resume → poll GET booking sampai `deposit_received`
- Cancel (confirmed, pre-checkout) dengan konfirmasi copy: unit akan dilepas
- Catatan: “Pengambilan & pengembalian dilakukan di cabang sesuai jadwal”

#### History
- List booking mobile milik phone; tap → detail
- Pull-to-refresh

### 5.3 Navigasi bawah (opsional R1.1)

Untuk surface `rental` only:

| Tab | Target |
|---|---|
| Beranda | `/` |
| Sewa | `/rental` |
| Pesanan | `/rental/history` |
| Akun | login / logout |

Combined: tab **Travel** | **Rental** | **Pesanan** (hub).

---

## 6. State machine (konsumen vs ops)

```
[App] quote → create ──► confirmed ──pay deposit──► confirmed (deposit received)
                              │
                              └── cancel ──► cancelled

[Staff CRM] confirmed ──checkout──► active ──return──► returned ──complete──► completed
```

| Status di app | Yang ditampilkan ke booker |
|---|---|
| `confirmed` | “Reservasi aktif — bayar deposit / siap pickup” |
| `active` | “Sedang disewa” (read-only) |
| `returned` / `completed` | “Selesai” |
| `cancelled` | “Dibatalkan” |

App **tidak** mengeksekusi checkout/return. Jika user buka booking `active`, tampilkan info saja + kontak cabang dari bootstrap bila ada.

---

## 7. Kontrak API yang dikonsumsi (existing)

Sudah ada di CRM — shell hanya client. Detail envelope: `mobile-booking-api-design.md` §3.5.

| Method | Path | Kapan |
|---|---|---|
| `GET` | `/bootstrap` | Splash / home |
| `POST` | `/auth/otp/send` \| `verify` | Login |
| `GET` | `/auth/me` | Session check |
| `GET` | `/rental/classes` | Filter search |
| `GET` | `/rental/locations` | Pickup/return |
| `GET` | `/rental/vehicles` | Catalog |
| `GET` | `/rental/vehicles/{id}` | Detail |
| `GET` | `/rental/insurance-packages` | Checkout extras |
| `POST` | `/rental/quotes` | Live price |
| `POST` | `/rental/bookings` | 🔒 Create |
| `GET` | `/rental/bookings` | 🔒 History |
| `GET` | `/rental/bookings/{token}` | Detail |
| `POST` | `/rental/bookings/{token}/pay-deposit` | 🔒 Snap |
| `POST` | `/rental/bookings/{token}/cancel` | 🔒 Cancel |

### Create body (MVP shell)

```json
{
  "vehicle_id": 1,
  "start_date": "2026-08-10",
  "end_date": "2026-08-12",
  "period_type": "daily",
  "customer_name": "Budi Santoso",
  "pickup_location_id": 2,
  "return_location_id": 2,
  "insurance_package_id": 1,
  "notes": null
}
```

### Error codes shell harus handle

| code / situasi | UX |
|---|---|
| `passenger_booking_disabled` / surface off | Empty home + “booking belum aktif” |
| `401` | Redirect login, clear token |
| `422` availability / min_periods | Inline di checkout |
| `429` OTP | Cooldown copy |
| `idempotency_conflict` | Jangan retry beda payload; tampilkan error ops |
| Gateway unavailable | Sembunyikan bayar online; copy “bayar deposit di cabang” |

### Gap API vs UX ideal (backlog backend kecil)

| Gap | Prioritas | Catatan |
|---|---|---|
| Foto kendaraan di resource mobile | R1 | Tanpa foto, catalog terasa kosong — tambah URL bila media Fleet ada |
| Rate hint di list (`from_price`) | R1 | Hindari N+1 quote per card; optional field di list |
| `brand.support_phone` / cabang kontak di bootstrap | R1 | Untuk booking active / bantuan |
| Cancel policy window (jam sebelum start) | R2 | Saat ini mirror staff: confirmed boleh cancel |
| Partial pay full rental online | R2 | MVP deposit-only |
| Push hook on confirm / deposit paid | R2 | |

---

## 8. Desain shell (engineering)

### 8.1 Struktur folder usulan

```
src/
  api/
    client.ts          # existing
    shuttle.ts         # existing
    rental.ts          # NEW — typed fetchers
  auth/
    AuthContext.tsx    # shared (existing)
  features/
    auth/
      LoginPage.tsx    # extract dari shuttle bila perlu
    shuttle/           # existing
    rental/            # NEW
      RentalHomeCta.tsx
      SearchPage.tsx
      VehicleListPage.tsx
      VehicleDetailPage.tsx
      CheckoutPage.tsx
      BookingPage.tsx
      HistoryPage.tsx
    home/
      HomePage.tsx     # refactor surface-aware
  components/Ui.tsx    # reuse
```

### 8.2 Feature flags di runtime

1. Bake: `enabledSurfaces` di `tenant-config.json` (CI)
2. Runtime: `bootstrap.surfaces.rental.enabled` **mengalahkan** UI bila setting CRM off
3. Route guard: jika rental bake off, redirect `/`

### 8.3 Storage

| Key | Isi |
|---|---|
| Bearer token | Capacitor Preferences (existing auth) |
| Last search draft | sessionStorage / Preferences — tanggal & lokasi |
| Pending idempotency key | memory + Preferences sampai 201/4xx final |

### 8.4 Payment resume

Pola mirror TicketPage shuttle:

1. `pay-deposit` → `payment.redirect_url`
2. `Browser.open`
3. `browserFinished` / app `resume` → `GET booking` poll (2–3s, max ~2 min)
4. Success: `deposit_received === true`

### 8.5 Theming

- `primary_color` dari bootstrap / bake (existing `applyTheme`)
- Komponen UI shared — jangan fork design system per vertical
- Copy & ikon beda; tokens warna sama

### 8.6 Testing shell

| Layer | Isi |
|---|---|
| Unit | `rental.ts` URL/query builders; quote breakdown display helpers |
| Component | Checkout disabled when `!available` |
| E2E manual | Postman collection + device: search→book→pay sandbox |
| CRM | `MobileRentalBookingApiTest` (sudah) — jangan regress |

---

## 9. Keamanan & kepatuhan

- Token hanya di Preferences; jangan log Bearer
- `public_token` entropy tinggi — boleh dibuka tanpa login (share link), Bearer assert ownership bila ada
- Jangan tampilkan `debug_code` OTP di production build
- Plat nomor: pertimbangkan mask di list publik (`B 1234 XX` → `B **** XX`) bila kebijakan tenant — field opsional backend
- Deposit Snap: jangan simpan kartu di app
- Throttle: hormati 429; UI cooldown OTP

---

## 10. Analytics (minimal R1)

Event client (opsional fire-and-forget / later CRM):

| Event | Props |
|---|---|
| `rental_search` | nights, class, location_id |
| `rental_vehicle_view` | vehicle_id |
| `rental_quote` | available, total |
| `rental_book_success` | code |
| `rental_deposit_start` / `_paid` | code |
| `rental_cancel` | code |

Header `X-App-Version` + `X-Mobile-Build-Id` sudah di desain API.

---

## 11. App Builder & go-to-market

| Profil vertical | `enabled_surfaces` | Listing copy |
|---|---|---|
| `rental` | `["rental"]` | “Sewa mobil {Brand}” |
| `shuttle` | `["shuttle"]` | existing Travel |
| `combined` | `["shuttle","rental"]` | “Travel & sewa mobil {Brand}” |

Prerequisite tenant:

1. Modul `rental` + `fleet` + `partners` + `invoicing` terpasang
2. Armada `active` + rate tersambung
3. `rental.passenger_booking_enabled=1`
4. (Opsional bayar) Receivables/Midtrans configured → `gateway_available`

Play Console: milik tenant (sama App Builder). Seruwit sediakan `.aab` + checklist upload.

---

## 12. Roadmap implementasi

| Phase | Isi | Definition of Done |
|---|---|---|
| **R0** | Doc + API gap kecil (foto/`from_price`/support phone bila perlu) | Kontrak & test hijau |
| **R1a** | Shell: `api/rental.ts` + Search + List + Detail | ✅ Browse tanpa auth (shell routes `/rental/*`) |
| **R1b** | Quote + Checkout + OTP gate + create | ✅ Reservasi `confirmed` dari app |
| **R1c** | Booking detail + pay-deposit + cancel + history | ✅ Parity Postman happy path di shell |
| **R1d** | Home surface-aware + combined hub + bake `rental` | ✅ Guard route + examples + CI `enabled_surfaces` |
| **R2** | Deep link, bottom nav, push, cancel window, iOS | Store-ready polish |
| **R3** | Self-serve extras (extend request, doc upload) | Ops policy clear |

**Estimasi effort R1 (senior pair):** ~5–8 hari shell + 1–2 hari API gap, asumsi Midtrans sandbox sudah jalan seperti shuttle.

Dependency: App Builder M1 tidak wajib untuk R1 — cukup `apply-tenant-config` + workflow_dispatch manual (pola Travel M0).

---

## 13. Kriteria siap build R1

- [x] Setting `passenger_booking_enabled` + minimal 1 rate + 1 vehicle available di staging
- [x] Feature tests mobile rental hijau di CI
- [x] Shell routes rental terdaftar; shuttle tidak regres
- [ ] Pay deposit sandbox end-to-end di emulator
- [ ] Cancel melepaskan overlap (availability board) — verified via API tests; device QA recommended
- [x] Copy empty/disabled states dalam Bahasa Indonesia
- [x] `enabledSurfaces` rental di `tenant-config` contoh + README shell di-update

---

## 14. Open decisions (perlu konfirmasi produk)

1. **Mask plat di katalog publik** — ya / tidak / setting tenant?
2. **Period type UI** — hanya daily di R1, atau expose weekly/monthly?
3. **Deposit wajib sebelum pickup** — sudah aturan staff checkout; apakah app menampilkan countdown “bayar sebelum tanggal X”?
4. **Combined home** — dua CTA vs tab bar dari hari-1?
5. **Partner Portal user** — apakah booker mobile yang sama boleh login portal web dengan phone yang sama? (out of R1, tapi data model Partner sudah shared)

Keputusan default sampai dikonfirmasi: **(1)** mask opsional off dulu, **(2)** daily-only R1, **(3)** tampilkan deposit due tanpa hard countdown server, **(4)** dua CTA di home, **(5)** tidak digabung session portal di R1.

---

## 15. Ringkasan eksekutif

Bangun **surface `rental`** di shell Capacitor yang sama dengan Travel. Backend mobile hampir siap; kerja utama adalah **UX funnel sewa** (search → quote → book → deposit) plus home gabungan. Operasi fisik (checkout/return) tetap di CRM. Dengan itu tenant rental mendapat app Android bermerek tanpa stack baru, dan platform memanfaatkan App Builder yang sudah dirancang.

*Dokumen ini adalah kontrak desain produk + engineering sebelum coding shell R1. Perubahan keputusan §14 harus di-update di sini.*
