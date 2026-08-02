# Mobile Booking API — Backend Endpoint Design

**Audience:** Capacitor shell (bundled React) + calon client lain (bukan Inertia PWA)  
**Base URL:** `https://{tenant-domain}/api/mobile/v1`  
**Tenancy:** Domain tenant (sama seperti `/book/shuttle`)  
**Format:** JSON only · `Accept: application/json`  
**Versi:** `v1` (breaking change → `v2`)

> **Prinsip:** Endpoint ini adalah **JSON façade** di atas service yang sama dengan PWA (`PassengerBookingService`, `PassengerOtpService`, Midtrans charge). Jangan buat spine booking kedua. PWA `/book/shuttle` tetap hidup; mobile tidak memanggil HTML/Inertia.

Dokumen induk orkestrasi AAB: [`mobile-app-builder-design.md`](./mobile-app-builder-design.md).

---

## 0. Keputusan desain API

| Aspek | Keputusan | Alasan |
|---|---|---|
| Prefix | `/api/mobile/v1` | Terpisah dari web session CRM; jelas untuk CORS & throttle |
| Auth end-user | OTP HP → **Bearer token** (Sanctum ability `mobile-passenger` atau token table ringan) | Capacitor origin ≠ cookie domain; history/cancel butuh session panjang |
| Ticket tanpa login | Tetap lewat `public_token` (seperti PWA) | Deep link / QR tetap jalan tanpa Bearer |
| Hold | Wajib phone verified (OTP session atau Bearer) | Sama aturan PWA |
| Error shape | Uniform JSON (lihat §2) | Shell parsing sederhana |
| Idempotency | Header `Idempotency-Key` pada `POST .../holds` & `.../pay` | Hindari double-hold dari retry jaringan mobile |
| Rental | Namespace `/rental/*` **stub** di v1 schema; implement setelah public rental channel ada | App Builder boleh `enabledSurfaces: ["shuttle"]` dulu |
| App Builder CRM APIs | Prefix terpisah `/module/mobile-apps/...` (session staff) — §8 | Bukan konsumsi shell |

### Yang tidak dilakukan

- Mengembalikan Inertia/HTML dari `/api/mobile/*`
- Memakai guard `web` / cookie CRM staff
- Remote WebView ke `/book/shuttle` sebagai pengganti API ini
- Token staff / impersonation di app penumpang

---

## 1. Konvensi umum

### Headers (request)

| Header | Wajib | Keterangan |
|---|---|---|
| `Accept: application/json` | ya | |
| `Content-Type: application/json` | pada body JSON | |
| `Authorization: Bearer {token}` | endpoint bertanda 🔒 | |
| `X-App-Version` | disarankan | `versionName` dari `tenant-config.json` |
| `X-Mobile-Build-Id` | opsional | UUID build AAB (analytics) |
| `Idempotency-Key` | pada hold/pay | UUID client; TTL server 24 jam |

### Headers (response)

| Header | Keterangan |
|---|---|
| `X-Api-Version` | `1` |
| `X-Request-Id` | korelasi log |

### Envelope sukses

Dua pola (pilih konsisten — **rekomendasi: tanpa wrapper data untuk resource tunggal, list pakai `data` + meta**):

**Resource tunggal / aksi:**

```json
{
  "booking": { "...": "..." }
}
```

**List:**

```json
{
  "data": [ { "...": "..." } ],
  "meta": { "count": 20 }
}
```

**Aksi sederhana:**

```json
{
  "ok": true,
  "message": "OTP dikirim."
}
```

### Envelope error

```json
{
  "message": "Human readable (sudah di-locale)",
  "code": "otp_invalid",
  "errors": {
    "otp_code": ["OTP tidak valid atau kedaluwarsa."]
  }
}
```

| HTTP | Kapan |
|---|---|
| `400` | Business rule (hold expired, seats insufficient) dengan `code` |
| `401` | Bearer hilang/invalid |
| `403` | Token valid tapi resource bukan milik phone itu |
| `404` | Modul off / booking disabled / token tiket tidak ada |
| `422` | Validasi input |
| `429` | Throttle |
| `503` | Gateway payment unavailable (bila relevan) |

### `code` (stabil untuk shell)

| code | Arti |
|---|---|
| `passenger_booking_disabled` | Setting off / modul tidak available |
| `otp_invalid` | OTP salah/expired |
| `otp_rate_limited` | Too many send |
| `hold_expired` | Hold lewat TTL |
| `insufficient_seats` | Kursi tidak cukup |
| `door_product_requires_door` | Aturan service_type door |
| `pay_draft_only` | Bayar hanya status draft |
| `gateway_unavailable` | Midtrans/soft module off |
| `cancel_not_allowed` | Policy batal |
| `idempotency_conflict` | Key sama, payload beda |

### Throttle (usulan)

| Group | Limit |
|---|---|
| Baca publik (bootstrap, corridors, search, ticket by token) | `60/min` per IP |
| OTP send | `5/min` per IP + `3/10min` per phone |
| OTP verify / session | `10/min` per IP |
| Hold / cancel / pay | `20/min` per IP + `10/min` per token|phone |

---

## 2. Auth model

### Alur

```
POST /auth/otp/send     { phone }
POST /auth/otp/verify   { phone, code }  →  { token, phone, expires_at }
Authorization: Bearer {token}  untuk history & (opsional) hold tanpa kirim otp_code lagi
POST /auth/logout       🔒 invalidate token
```

### Token

- **MVP rekomendasi:** Laravel Sanctum **Personal Access Token** pada model lightweight `MobilePassenger` **atau** token di cache/DB `mobile_passenger_sessions` (`id`, `phone`, `token_hash`, `expires_at`) tanpa User staff.
- Jangan pakai `users` tenant (akun CRM).
- TTL default: **30 hari** idle atau absolute 90 hari; refresh = verify OTP lagi.
- Ability: `mobile-passenger`.
- Setelah verify, set juga flag verified phone di `PassengerOtpService` (reuse) agar hold PWA-compatible selama window pendek bila dibutuhkan — tapi shell **mengandalkan Bearer**, bukan cache OTP saja.

### Ticket `public_token`

- Tetap **unguessable** (existing).
- `GET/POST` ticket & pay & cancel by token: **tidak wajib Bearer**.
- Jika Bearer ada: server boleh assert `booker_phone` cocok (403 jika tidak).

---

## 3. Katalog endpoint (v1)

### 3.1 Platform / bootstrap

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| `GET` | `/bootstrap` | publik | Branding + flags + surfaces aktif |
| `GET` | `/health` | publik | `{ "ok": true, "api_version": 1 }` — CI/shell ping |

#### `GET /bootstrap`

**Response 200:**

```json
{
  "tenant": {
    "id": "acme",
    "name": "ACME Travel"
  },
  "brand": {
    "name": "ACME Travel",
    "primary_color": "#0f766e",
    "logo_url": null
  },
  "surfaces": {
    "shuttle": {
      "enabled": true,
      "hold_ttl_minutes": 15,
      "gateway_available": true
    },
    "rental": {
      "enabled": false
    }
  },
  "min_app_version": null,
  "api_version": 1
}
```

Sumber: `ShuttleSetting` brand keys + `Modules::available` + gateway check (sama controller PWA).  
`404` / `code: passenger_booking_disabled` bila tidak ada surface sama sekali yang enabled (kebijakan: atau tetap 200 dengan semua `enabled: false`).

**Rekomendasi:** selalu `200` agar shell bisa tampilkan empty-state “Booking belum aktif”.

---

### 3.2 Auth

| Method | Path | Auth |
|---|---|---|
| `POST` | `/auth/otp/send` | publik |
| `POST` | `/auth/otp/verify` | publik |
| `POST` | `/auth/logout` | 🔒 |
| `GET` | `/auth/me` | 🔒 |

#### `POST /auth/otp/send`

```json
{ "phone": "08123456789" }
```

```json
{
  "ok": true,
  "message": "OTP dikirim.",
  "expires_in": 300,
  "debug_code": "123456"
}
```

`debug_code` **hanya** non-production (mirror PWA).

#### `POST /auth/otp/verify`

```json
{ "phone": "08123456789", "code": "123456" }
```

```json
{
  "token": "1|plainTextToken…",
  "token_type": "Bearer",
  "expires_at": "2026-10-30T12:00:00+07:00",
  "phone": "628123456789"
}
```

#### `GET /auth/me`

```json
{
  "phone": "628123456789"
}
```

---

### 3.3 Shuttle — master & search

| Method | Path | Auth |
|---|---|---|
| `GET` | `/shuttle/corridors` | publik |
| `GET` | `/shuttle/departures` | publik |
| `GET` | `/shuttle/geocode/reverse` | publik |

Mirror data yang hari ini di-Inertia-kan di `PublicPassengerBookingController::search`.

#### `GET /shuttle/corridors`

```json
{
  "data": [
    {
      "id": 1,
      "code": "JKT-BDG",
      "name": "Jakarta–Bandung",
      "origin_city": "Jakarta",
      "destination_city": "Bandung",
      "service_type": "door",
      "base_fare": 200000
    }
  ]
}
```

Hanya `is_active = true`.

#### `GET /shuttle/departures`

Query:

| Param | Wajib | Keterangan |
|---|---|---|
| `date` | ya | `Y-m-d` |
| `corridor_id` | ya | |

```json
{
  "data": [
    {
      "id": 10,
      "departure_number": "DEP-…",
      "depart_date": "2026-08-05",
      "depart_time": "07:30",
      "seats_remaining": 8,
      "seats_booked": 4,
      "seat_capacity": 12,
      "unit_fare": 200000,
      "service_type": "door",
      "corridor": { "id": 1, "name": "Jakarta–Bandung" },
      "origin_pool": {
        "name": "Pool Gambir",
        "address": "…",
        "latitude": "-6.17",
        "longitude": "106.83"
      },
      "destination_pool": { "...": "..." }
    }
  ],
  "meta": {
    "date": "2026-08-05",
    "corridor_id": 1,
    "hold_ttl_minutes": 15
  }
}
```

Filter status: `open`, `optimized` (sama PWA).

#### `GET /shuttle/geocode/reverse`

Query: `lat`, `lng` — reuse `GeocodeController` / service yang sama; response JSON stabil:

```json
{
  "address": "Jl. …",
  "latitude": -6.2,
  "longitude": 106.8
}
```

---

### 3.4 Shuttle — booking lifecycle

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| `POST` | `/shuttle/holds` | 🔒 **atau** body `otp_code` + phone | Buat hold (draft) |
| `GET` | `/shuttle/tickets/{public_token}` | publik | Detail tiket |
| `POST` | `/shuttle/tickets/{public_token}/cancel` | publik (+ optional 🔒 assert) | Batal |
| `POST` | `/shuttle/tickets/{public_token}/pay` | publik | Mulai gateway; dapat `redirect_url` / Snap token |
| `GET` | `/shuttle/bookings` | 🔒 | Riwayat by phone token |

#### `POST /shuttle/holds`

**Auth:** Bearer **atau** (transisi) `booker_phone` + `otp_code` seperti PWA. Rekomendasi shell: selalu Bearer.

```json
{
  "departure_id": 10,
  "passenger_count": 2,
  "pickup_mode": "door",
  "dropoff_mode": "pool",
  "pickup_address": "Jl. Melawai 1",
  "pickup_lat": -6.24,
  "pickup_lng": 106.8,
  "dropoff_address": null,
  "dropoff_lat": null,
  "dropoff_lng": null,
  "notes": null,
  "passengers": [
    { "name": "Budi", "phone": "0812…", "id_number": null },
    { "name": "Siti", "phone": null, "id_number": null }
  ]
}
```

`booker_phone` diambil dari token; jangan percaya phone dari body jika Bearer ada.

**Response 201:**

```json
{
  "booking": {
    "booking_number": "SB-…",
    "public_token": "…",
    "status": "draft",
    "payment_status": "unpaid",
    "passenger_count": 2,
    "total_fare": 400000,
    "amount_due": 400000,
    "hold_expires_at": "2026-08-01T19:15:00+07:00",
    "booker_phone": "62812…",
    "pickup_mode": "door",
    "dropoff_mode": "pool",
    "pickup_address": "Jl. Melawai 1",
    "dropoff_address": null,
    "departure": {
      "depart_date": "2026-08-05",
      "depart_time": "07:30",
      "corridor": "Jakarta–Bandung"
    },
    "passengers": [
      { "name": "Budi", "phone": "0812…", "seat_label": null }
    ],
    "ticket_path": "/book/shuttle/ticket/{public_token}",
    "qr_payload": "https://{tenant}/book/shuttle/ticket/{public_token}"
  }
}
```

Shape `booking` = **satu kontrak** dipakai ticket, history, hold response (`ticketPayload` existing diekstrak ke API Resource).

#### `GET /shuttle/tickets/{public_token}`

```json
{ "booking": { "...": "sama ticketPayload + gateway_available" }, "gateway_available": true }
```

#### `POST /shuttle/tickets/{public_token}/cancel`

```json
{ "cancel_reason": "Berubah pikiran" }
```

```json
{ "booking": { "...": "status cancelled" } }
```

#### `POST /shuttle/tickets/{public_token}/pay`

Tidak redirect HTTP 302 (itu pola browser PWA). Mobile butuh JSON:

```json
{
  "payment": {
    "mode": "midtrans_snap",
    "redirect_url": "https://app.midtrans.com/…",
    "snap_token": null,
    "expires_at": null
  },
  "booking": {
    "public_token": "…",
    "payment_status": "pending",
    "status": "draft"
  }
}
```

Shell buka `redirect_url` via Capacitor Browser plugin; setelah return, poll `GET .../tickets/{token}` sampai `payment_status=paid` / `status=confirmed`.

Jika gateway off → `503` + `code: gateway_unavailable` (pay-at-counter tetap mungkin; UI tampilkan instruksi dari bootstrap).

#### `GET /shuttle/bookings` 🔒

```json
{
  "data": [ { "...ticketPayload..." } ],
  "meta": { "count": 3 }
}
```

Limit default 20; query opsional `?status=draft`.

---

### 3.5 Rental (mobile passenger channel)

Enable with tenant setting `rental.passenger_booking_enabled=1`. Bootstrap then reports `surfaces.rental.enabled: true`.

Shared auth (`/auth/otp/*`) works when **either** shuttle or rental surface is enabled.

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| `GET` | `/rental/classes` | publik | Kelas rental (`economy`, `mpv`, …) |
| `GET` | `/rental/vehicles` | publik | Katalog; query `start_date`, `end_date`, `rental_class`, `available_only` |
| `GET` | `/rental/vehicles/{id}` | publik | Detail kendaraan |
| `GET` | `/rental/locations` | publik | Cabang pickup/return |
| `GET` | `/rental/insurance-packages` | publik | Paket asuransi aktif |
| `POST` | `/rental/quotes` | publik | Quote harga + ketersediaan |
| `POST` | `/rental/bookings` | 🔒 | Buat + auto-confirm (reserve unit); `Idempotency-Key` |
| `GET` | `/rental/bookings` | 🔒 | Riwayat booking mobile milik phone |
| `GET` | `/rental/bookings/{token}` | publik† | Detail by `public_token` |
| `POST` | `/rental/bookings/{token}/pay-deposit` | 🔒 | Midtrans Snap deposit |
| `POST` | `/rental/bookings/{token}/cancel` | 🔒 | Batal draft/confirmed |

† Optional Bearer asserts ownership when present.

Mobile create finds-or-creates a Partner from the OTP phone, confirms immediately (so the vehicle is reserved), and leaves deposit unpaid until `pay-deposit` or counter collection.

---

## 4. Mapping ke implementasi existing

| Mobile endpoint | Reuse |
|---|---|
| bootstrap / corridors / departures | Logic di `PublicPassengerBookingController::search` + `brand()` + `gatewayAvailable()` |
| otp send/verify | `PassengerOtpService` + issue token baru |
| holds | `PassengerBookingService::hold` + aturan `service_type` door/pool |
| ticket / cancel | `ticketPayload` / `cancelPassenger` |
| pay | `GatewayCheckoutService::createShuttleBookingCharge` — **ubah respons** jadi JSON untuk mobile; PWA tetap redirect |
| geocode | route `book.shuttle.geocode.reverse` / `GeocodeController` |

### Struktur kode usulan (belum implementasi)

```
modules/Shuttle/Http/
  Controllers/Api/Mobile/
    BootstrapController.php
    AuthController.php
    CorridorController.php
    DepartureController.php
    HoldController.php
    TicketController.php
    BookingHistoryController.php
  Resources/Mobile/
    BookingResource.php
    DepartureResource.php
    CorridorResource.php
  Requests/Mobile/
    StoreHoldRequest.php
    SendOtpRequest.php
    VerifyOtpRequest.php
```

Routes: daftar di `ShuttleModule` **atau** `routes/app.php` group `api/mobile/v1` + middleware `throttle` + future `auth:sanctum` ability.

PWA controller boleh tetap; ekstrak shared private methods ke action/resource agar tidak drift.

---

## 5. CORS & Capacitor

| Origin | Allow |
|---|---|
| `capacitor://localhost` | ya (iOS) |
| `http://localhost` | ya (Android WebView umum) |
| `https://localhost` | ya ( Cap ≥5 Android ) |
| Tenant web origin | tidak perlu untuk shell native |
| `*` | jangan |

Scope CORS hanya path `/api/mobile/*` (dan OTP bila dipisah). Jangan buka seluruh CRM.

CSRF: route API mobile **tanpa** `web` middleware CSRF; auth = Bearer / public_token.

---

## 6. Keamanan endpoint

- Validasi ketat mirror Form Request PWA.
- Jangan leak `debug_code` di production.
- `public_token` entropy tinggi (sudah); rate-limit GET ticket.
- Pay: hanya `draft` + hold belum expired.
- Cancel: policy existing `cancelPassenger`.
- Log `X-Request-Id` + phone hash, bukan OTP plaintext di production logs.
- Idempotency store: hash key + payload; replay response asli.

---

## 7. Kontrak untuk shell (screen → endpoint)

| Screen | Panggil |
|---|---|
| Splash / Home | `GET /bootstrap` |
| Cari jadwal | `GET /corridors` → `GET /departures` |
| Isi pax + OTP | `POST /auth/otp/send` → `verify` → simpan token |
| Hold | `POST /shuttle/holds` + Idempotency-Key |
| Tiket | `GET /shuttle/tickets/{token}` (poll setelah pay) |
| Bayar | `POST .../pay` → Browser → poll ticket |
| Batal | `POST .../cancel` |
| Riwayat | `GET /shuttle/bookings` |
| Pin door | `GET /shuttle/geocode/reverse` |

`tenant-config.json` (bake CI) hanya menyediakan `apiBaseUrl`; branding runtime dari `/bootstrap` agar warna/nama bisa berubah tanpa rebuild (launcher icon tetap dari bake).

---

## 8. Endpoint control-plane (CRM App Builder) — terpisah

Bukan untuk shell. Session staff + permission `mobile_apps.*`.  
Prefix usulan: `/module/mobile-apps` (Inertia + JSON partials) atau JSON murni bila diinginkan.

| Method | Path | Permission | Keterangan |
|---|---|---|---|
| `GET` | `/module/mobile-apps` | `view` | Halaman index (Inertia) |
| `GET` | `/module/mobile-apps/profile/edit` | `manage` | Form |
| `PUT` | `/module/mobile-apps/profile` | `manage` | Update profil |
| `GET` | `/module/mobile-apps/builds` | `view` | Riwayat |
| `POST` | `/module/mobile-apps/builds` | `build` | Trigger AAB |
| `GET` | `/module/mobile-apps/builds/{build}/download` | `download` | Stream `.aab` |
| `POST` | `/api/internal/mobile-builds/callback` | HMAC/token | **Central**, dari GitHub Actions |

Detail field & state machine: lihat `mobile-app-builder-design.md` §4–5.  
Dokumen ini **tidak** menduplikasi schema build; fokus konsumsi shell = §3.

---

## 9. Urutan implementasi API (sebelum / paralel App Builder)

| Step | Isi | Tes |
|---|---|---|
| **A0** | `GET /health`, `GET /bootstrap`, CORS config | Feature test tenant domain |
| **A1** | corridors + departures + BookingResource ekstraksi | Parity data vs PWA search |
| **A2** | OTP send/verify + token + `/auth/me` | Token tolak setelah logout |
| **A3** | `POST /holds` + ticket GET + cancel | Concurrent seats; OTP/Bearer |
| **A4** | history 🔒 | Hanya milik phone |
| **A5** | pay JSON + poll story | Gateway fake/Http::fake |
| **A6** | Idempotency-Key + error `code` stabil | Replay & conflict |
| **A7** | (opsional) geocode reverse JSON | Throttle |

**App Builder M0/M1** boleh mulai setelah **A0–A1** (shell hello-world). Booking penuh butuh **A3+**.

---

## 10. OpenAPI (sketsa paths)

```yaml
openapi: 3.0.3
info:
  title: Seruwit Mobile Booking API
  version: 1.0.0
servers:
  - url: https://{tenant}/api/mobile/v1
paths:
  /bootstrap:
    get:
      summary: Tenant brand and surface flags
  /health:
    get:
      summary: Liveness
  /auth/otp/send:
    post:
      summary: Send phone OTP
  /auth/otp/verify:
    post:
      summary: Verify OTP and issue Bearer token
  /auth/logout:
    post:
      security: [{ bearerAuth: [] }]
  /auth/me:
    get:
      security: [{ bearerAuth: [] }]
  /shuttle/corridors:
    get: {}
  /shuttle/departures:
    get:
      parameters:
        - in: query
          name: date
          required: true
        - in: query
          name: corridor_id
          required: true
  /shuttle/holds:
    post:
      security: [{ bearerAuth: [] }]
  /shuttle/tickets/{public_token}:
    get: {}
  /shuttle/tickets/{public_token}/cancel:
    post: {}
  /shuttle/tickets/{public_token}/pay:
    post: {}
  /shuttle/bookings:
    get:
      security: [{ bearerAuth: [] }]
  /shuttle/geocode/reverse:
    get: {}
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
```

File OpenAPI penuh bisa digenerate saat implementasi (opsional `docs/api/mobile-v1.yaml`).

---

## 11. Keputusan terkunci (implementasi)

| # | Topik | Keputusan |
|---|---|---|
| 1 | Token store | Tabel tenant `mobile_passenger_tokens` (hash SHA-256), **bukan** Sanctum PAT — lebih sederhana di schema tenant |
| 2 | Hold auth | **Dual-mode:** Bearer **atau** `booker_phone` + `otp_code` |
| 3 | Pay response | JSON `{ redirect_url, snap_token? }` — shell buka Browser; poll ticket |
| 4 | Bootstrap off | Selalu **`200`** dengan `surfaces.*.enabled: false` |

**Postman:** [`docs/api/seruwit-mobile-booking-v1.postman_collection.json`](../api/seruwit-mobile-booking-v1.postman_collection.json)

**Status kode:** A0–A6 implemented under `Modules\Shuttle\Http\Controllers\Api\Mobile\*` · routes `routes/mobile_api.php` · tests `MobileBookingApiTest`.

---


## Lampiran A — Perbandingan PWA route vs Mobile API

| PWA (`/book/shuttle`) | Mobile API |
|---|---|
| `GET /` Inertia search | `GET /shuttle/corridors` + `GET /shuttle/departures` |
| `POST /otp` | `POST /auth/otp/send` (+ `verify` terpisah) |
| `POST /hold` + redirect ticket | `POST /shuttle/holds` → JSON 201 |
| `GET /ticket/{token}` Inertia | `GET /shuttle/tickets/{token}` JSON |
| `POST /ticket/{token}/cancel` redirect | `POST .../cancel` JSON |
| `POST /ticket/{token}/pay` redirect away | `POST .../pay` → `{ redirect_url }` |
| `GET /history` Inertia + otp query | `GET /shuttle/bookings` Bearer |
| — | `GET /bootstrap`, `/health`, `/auth/*` |

## Lampiran B — Contoh alur sukses (sequence)

```
Shell                API                         Services
  | GET /bootstrap     |                            |
  | ------------------>| ShuttleSetting / Modules   |
  | POST /auth/otp/*   | PassengerOtpService        |
  | <----- token ------|                            |
  | GET /departures    | ShuttleDeparture query     |
  | POST /holds        | PassengerBookingService    |
  | <--- booking ------|                            |
  | POST .../pay       | GatewayCheckoutService     |
  | <--- redirect_url -|                            |
  | (Capacitor Browser)| Midtrans … webhook         |
  | GET .../tickets    | poll until paid/confirmed  |
```

---

*Setelah empat keputusan §11 disepakati, implementasi dimulai dari step **A0** tanpa menunggu App Builder UI.*
