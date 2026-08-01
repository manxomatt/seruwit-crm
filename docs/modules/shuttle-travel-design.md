# Shuttle Travel (Travel Antar-Jemput)
## Module Design Document

**Module key:** `shuttle` (modul baru, Vertical)  
**UI label:** Travel  
**Depends on (hard):** `fleet`, `partners`, `invoicing`  
**Soft depends on:** `tracking` (GPS live), `accounting` / `receivables` (posting & AR), `rental` / `transportation` (konflik kalender armada)  
**Tidak bergantung pada:** `orders`, `outbound`, `billing`, `sales`, `inventory`, `routing` (lihat §6 — engine VRP di-*reuse* tanpa hard-require vertikal logistik)

**New tables (MVP):** 8 · **New pages:** 9 · **Estimasi file inti:** ~28  
**Vertical pack:** `TRAVEL_SHUTTLE` (mirror `RENTAL_MOBIL`)

> Platform sudah menandai *travel* sebagai Vertical berikutnya di `ModuleTier`. Invoice lines morph sudah diantisipasi untuk “travel booking later”. Pola terdekat: **Rental** (booking + invoice + konflik Fleet), bukan **Transportation** (kargo/DO).

---

## 0. Tujuan & Batasan MVP

### Domain (Indonesia)
Travel shuttle = perjalanan **terjadwal** antar kota dengan:
1. Tarif **fix per koridor** (contoh: Jakarta–Bandung Rp 200.000)
2. Penumpang bisa **door-to-door** (rumah/kantor/stasiun) atau berkumpul di **pool**
3. Titik akhir juga bisa door-drop atau pool tujuan
4. Fitur pembeda produk: **route optimisation** urutan jemput & antar

### Tujuan sistem
**Partner (booker/penumpang) → Booking kursi → Manifest keberangkatan → Optimasi urutan stop → Dispatch → Invoice / pembayaran**

### In scope (MVP)
- Master **koridor** (origin city ↔ destination city) + tarif dasar fix
- Master **pool** (titik kumpul) via `partners.locations` + flag tipe
- **Jadwal berulang** → generate **departure** (keberangkatan tanggal/jam)
- **Booking** kursi (1–N penumpang) dengan mode jemput/antar: `pool` | `door`
- Manifest + seat inventory per departure
- **Optimasi rute jemput & drop** (TSP/nearest-neighbour + capacity seats) per departure
- Dispatch: assign vehicle + driver, status perjalanan
- Invoice morph dari booking (pola Rental/`SalesInvoiceService`)
- Soft conflict check armada vs Rental/Transportation bila modul terpasang

### Out of scope (fase berikutnya)
- Aplikasi penumpang / driver **native** (lihat §14 — mulai dari PWA publik, native belakangan)
- Pembayaran online gateway (QRIS/VA) — Fase P2 di §14; deposit online Rental bisa di-*soft-bridge*
- Multi-leg / transit hub chaining
- Dynamic pricing / yield management
- Paket tour / charter ad-hoc (bisa ikut Rental atau fase 2)
- Integrasi hard ke modul `routing` (logistik DO) — hanya reuse solver murni

### Anti-pola (jangan)
- Jangan pakai `DeliveryOrder` / cargo `Trip` sebagai booking penumpang
- Jangan hard-`requires('routing')` — Routing saat ini `requires(['transportation','orders','inventory'])`
- Jangan double-book vehicle tanpa cek Rental/Transportation (copy pola `StoreRentalRequest`)

---

## 1. Posisi di arsitektur platform

```
Content          Foundation                         Vertical
────────         ──────────                         ────────
pages/…          partners ──┐
                 fleet ─────┼──► shuttle (Travel)   ◄── fitur utama
                 invoicing ─┘         │
                 tracking (soft)      ├──► accounting / receivables (soft)
                 document / maint.    └──► konflik kalender vs rental / transportation
```

| Layer | Modul | Peran terhadap Shuttle |
|---|---|---|
| Foundation | `fleet` | Vehicle, Driver; tambah `capacity_seats` |
| Foundation | `partners` | Booker + penumpang; `Location` = pool/kota |
| Foundation | `invoicing` | Invoice morph dari booking |
| Foundation | `tracking` | Soft: posisi armada saat departure `in_transit` |
| Vertical | `rental` | Soft: konflik booking armada |
| Vertical | `transportation` | Soft: konflik trip kargo; **bukan** host domain |
| Vertical | `routing` | Referensi solver; **bukan** dependency |

**Kesimpulan kesesuaian:** tinggi untuk Fleet + Partners + Invoicing (+ Tracking). Sedang untuk reuse VRP (perlu ekstraksi/adaptor). Rendah/hindari untuk spine logistik Orders→Trip→Billing.

---

## 2. Entity Relationship

### 2.1 `shuttle_corridors` — trayek / produk perjalanan
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `code` | varchar unique | `JKT-BDG-POOL` / `JKT-BDG-DOOR` |
| `name` | varchar | Jakarta – Bandung (Pool) |
| `origin_city` | varchar | Label kota asal |
| `destination_city` | varchar | Label kota tujuan |
| `service_type` | string | `pool` · `door` — **dua produk terpisah** (harga & operasional beda) |
| `origin_location_id` | FK → locations nullable | Pool default asal |
| `destination_location_id` | FK → locations nullable | Pool default tujuan |
| `base_fare` | decimal(15,2) | Tarif fix per kursi untuk produk ini |
| `estimated_duration_minutes` | unsigned int nullable | ETA koridor |
| `distance_km` | decimal(10,2) nullable | |
| `is_active` | bool | |
| `notes` | text nullable | |
| `timestamps` | | |

> Reverse corridor (BDG–JKT) = baris terpisah. **Pool vs Door** pada O–D yang sama juga = baris terpisah (SKU berbeda).
>
> - `pool`: penumpang wajib naik/turun di pool; rute `pool_origin → pool_destination`
> - `door`: kendaraan berangkat pool asal → jemput → antar → pool tujuan; optimasi NN per departure

`shuttle_departures.service_type` di-snapshot dari koridor saat generate.

### 2.2 `shuttle_schedules` — template berulang
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `corridor_id` | FK → shuttle_corridors | |
| `code` | varchar unique | `JKT-BDG-PAGI` |
| `days_of_week` | json | `[1,2,3,4,5]` (Sen–Jum) |
| `departure_time` | time | Jam berangkat dari pool / cut-off jemput |
| `vehicle_id` | FK → vehicles nullable | Default armada |
| `driver_id` | FK → drivers nullable | Default sopir |
| `seat_capacity` | unsigned smallint | Override; fallback `vehicles.capacity_seats` |
| `pickup_cutoff_minutes` | unsigned int default 90 | Batas jemput sebelum `departure_time` |
| `starts_on` / `ends_on` | date | |
| `is_active` | bool | |
| `timestamps` | | |

Pola mirip `TripSchedule::generateTripsBetween()` — generate eksplisit oleh dispatcher, bukan cron wajib di MVP.

### 2.3 `shuttle_departures` — instance keberangkatan
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `schedule_id` | FK nullable | Null = ad-hoc |
| `corridor_id` | FK | Denormalisasi cepat |
| `departure_number` | varchar unique | `SH-2026-00042` |
| `depart_date` | date | |
| `depart_time` | time | |
| `vehicle_id` / `driver_id` | FK nullable | |
| `seat_capacity` | unsigned smallint | Snapshot |
| `seats_booked` | unsigned smallint default 0 | |
| `status` | string | lihat §3 |
| `origin_pool_id` / `destination_pool_id` | FK → locations nullable | |
| `optimized_at` | timestamp nullable | |
| `dispatched_at` / `completed_at` | timestamp nullable | |
| `notes` | text nullable | |
| `timestamps` | | |

### 2.4 `shuttle_bookings` — reservasi
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `booking_number` | varchar unique | `BK-2026-00101` |
| `departure_id` | FK → shuttle_departures | |
| `partner_id` | FK → partners (nullable) | Optional booker for corporate/portal; null = walk-in |
| `booked_by` | FK → users nullable | CS / portal user |
| `status` | string | lihat §3 |
| `passenger_count` | unsigned tinyint | ≥ 1 |
| `unit_fare` | decimal(15,2) | Snapshot `corridor.base_fare` |
| `total_fare` | decimal(15,2) | `passenger_count × unit_fare` (+ add-on nanti) |
| `pickup_mode` | string | `pool` · `door` |
| `dropoff_mode` | string | `pool` · `door` |
| `pickup_address` | string nullable | Wajib jika door |
| `pickup_lat` / `pickup_lng` | decimal nullable | |
| `pickup_window_start` / `pickup_window_end` | time nullable | Opsional MVP |
| `dropoff_address` | string nullable | |
| `dropoff_lat` / `dropoff_lng` | decimal nullable | |
| `invoice_id` | FK → invoices nullable | Soft bila invoicing |
| `notes` | text nullable | |
| `cancelled_at` | timestamp nullable | |
| `timestamps` | | |

### 2.5 `shuttle_passengers`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `booking_id` | FK cascade | |
| `name` | varchar | |
| `phone` | varchar nullable | |
| `id_number` | varchar nullable | KTP (opsional MVP) |
| `seat_label` | varchar nullable | A1, B2 — fase 1.1 |
| `timestamps` | | |

### 2.6 `shuttle_route_stops` — hasil optimasi / urutan eksekusi
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `departure_id` | FK cascade | |
| `booking_id` | FK nullable | Null = pool stop |
| `stop_type` | string | `pickup` · `pool_origin` · `pool_destination` · `dropoff` |
| `sequence` | unsigned smallint | Urutan global perjalanan |
| `address` | string | |
| `lat` / `lng` | decimal | |
| `eta_at` | timestamp nullable | |
| `distance_from_previous_km` | decimal(10,2) default 0 | |
| `status` | string | `pending` · `arrived` · `completed` · `skipped` |
| `completed_at` | timestamp nullable | |
| `timestamps` | | |

### 2.7 Add-on Fleet (delta Foundation, kecil)

`vehicles.capacity_seats` unsigned smallint nullable — demand VRP penumpang = 1 seat / penumpang (bukan `capacity_kg`).

`locations` (Partners): opsional kolom `kind` (`city` · `pool` · `other`) **atau** pivot/metadata di Shuttle saja (`shuttle_pools.location_id`) agar Partners tetap generik. **Rekomendasi MVP:** tabel tipis `shuttle_pools`:

| Kolom | Tipe |
|---|---|
| `id` | PK |
| `location_id` | FK → locations unique |
| `corridor_id` | FK nullable (pool khusus koridor) |
| `is_origin` / `is_destination` | bool |
| `is_active` | bool |

---

## 3. Status Machine

### Departure

```
[open] → [locked] → [optimized] → [dispatched] → [in_transit] → [completed]
   ↓         ↓           ↓
[cancelled] … boleh re-optimize sebelum dispatched
```

| Status | Arti |
|---|---|
| `open` | Menerima booking |
| `locked` | Cut-off; seat inventory freeze |
| `optimized` | Urutan stop sudah dihitung |
| `dispatched` | Sopir/armada final; perjalanan dimulai dari jemput pertama |
| `in_transit` | Di koridor / menuju drop |
| `completed` | Semua stop selesai |
| `cancelled` | Dibatalkan (booking harus digeser/refund) |

### Booking

```
[draft] → [confirmed] → [boarded] → [completed]
              ↓
         [cancelled] / [no_show]
```

| Transisi | Trigger |
|---|---|
| `draft` → `confirmed` | Seat available + (opsional) invoice draft / DP |
| `confirmed` → `boarded` | Check-in di stop jemput / pool |
| `boarded` → `completed` | Drop selesai |
| `confirmed` → `no_show` | Tidak muncul di cut-off |
| Cancel | Sebelum `dispatched` departure; rules refund fase 1.1 |

Seat: `confirm` → `seats_booked += passenger_count`; cancel confirmed → decrement. Row lock departure saat confirm.

---

## 4. Route Optimisation (fitur unggulan)

### 4.1 Masalah yang dipecahkan
Untuk **satu departure** dengan N booking door-pickup / door-dropoff:

1. **Pickup leg:** urutkan jemput door → (opsional) pool origin → berangkat koridor  
2. **Dropoff leg:** pool destination → urutkan antar door  
3. Hormati `seat_capacity`, time window jemput (jika diisi), dan jarak/waktu  
4. Objective MVP: `min_distance` (secondary: `min_duration` via OSRM bila tersedia)

Ini **bukan** VRP multi-DO logistik. Ini **open-path sequencing** (TSP-ish) dengan dua fase + capacity seats.

### 4.2 Arsitektur engine

```
Shuttle\Support\DepartureRouteOptimizer
        │
        ├── Haversine (copy/extract dari Routing\Support\Haversine)
        ├── NearestNeighbourSequencer  (murni, tanpa DO)
        └── OsrmRouter (soft: class_exists Transportation OsrmRouter)
```

**Keputusan D1 — jangan hard-depend modul `routing`:**  
`RouteOptimizationService` saat ini terikat `DeliveryOrder`. Solver murni (`FleetVrpSolver`, `Haversine`) boleh diekstrak ke Foundation package kecil di fase 1.1 (`modules/Routing` refactor **atau** `app/Support/Geo`). MVP Shuttle: **duplikasi tipis / extract `Haversine` + sequencer sendiri** di namespace Shuttle; jangan `requires('routing')`.

**Keputusan D2 — overflow kursi:**  
Jika booking > capacity satu vehicle: MVP tolak confirm / waitlist. Fase 1.2: pecah ke departure tambahan atau vehicle kedua (multi-route seperti FleetVrp).

**Keputusan D3 — pool-only booking:**  
Stop list hanya `pool_origin` → `pool_destination` (tanpa optimasi berarti). Optimasi no-op, tetap catat 2 stops.

### 4.3 `DepartureRouteOptimizer::optimize(ShuttleDeparture $departure)`

Dalam `DB::transaction`:

1. Validasi status ∈ `{open, locked, optimized}` (bukan `dispatched+`)
2. Hapus `shuttle_route_stops` lama
3. Load booking `confirmed` + koordinat
4. Bangun urutan menurut `service_type`:
   - **pool:** `pool_origin` → `pool_destination` saja
   - **door:** `pool_origin` → nearest-neighbour jemput door → nearest-neighbour antar door → `pool_destination`
5. Persist stops + `distance_from_previous_km`; set `optimized_at`, status → `optimized`
6. Return summary: total km, ETA kasar, unassigned (booking door tanpa lat/lng)

### 4.4 UX unggulan
- Halaman **Departure Show**: peta polyline + daftar stop drag-reorder manual + tombol **Optimize**
- Bandingkan sebelum/sesudah: km & estimasi menit
- Soft OSRM directions (sudah dipakai Routing/Transportation) untuk geometri jalan

---

## 5. Business Logic (service)

| Service | Tanggung jawab |
|---|---|
| `CorridorFareResolver` | Ambil `base_fare` aktif; hook harga promo belakangan |
| `ScheduleDepartureGenerator` | Mirror `TripSchedule::generateTripsBetween` |
| `BookingConfirmationService` | Lock seat, snapshot fare, optional invoice draft |
| `DepartureLockService` | Cut-off → `locked`; tolak booking baru |
| `DepartureRouteOptimizer` | §4 |
| `DepartureDispatchService` | Validasi vehicle/driver, conflict check Fleet, status `dispatched` |
| `ShuttleInvoiceService` | Morph lines ke `ShuttleBooking` (satu booking = satu line atau per passenger) |
| `ShuttleVehicleAvailability` | Soft: Rental + Transportation conflicts |

### Invoice (soft)
Jika `Modules::available('invoicing')`:
- Confirm booking **partner** → draft invoice; line morph `ShuttleBooking`
- Confirm booking **walk-in** (`partner_id` null) → tanpa invoice AR
- Issue/pay di Invoicing untuk partner bookings

### Accounting (soft)
- **Fase A:** `invoice.issued` dengan line morph Shuttle → `revenue_role = shuttle_revenue` (akun `4130`)
- **Fase B:** walk-in confirm → `shuttle_sale.completed` (Dr kas, Cr shuttle_revenue [+ tax]); cancel → void
- **Fase C:** laporan Accounting *Travel revenue* (`accounting.reports.travel-revenue`)
- Bridge soft: `class_exists(AccountingBridge)` + `ShuttleAccountingService` (tanpa hard require Accounting)

---

## 6. Matriks integrasi & skor kesesuaian

| Modul | Skor | Cara integrasi | Catatan |
|---|---|---|---|
| `fleet` | ★★★★★ | Hard requires | Tambah `capacity_seats` |
| `partners` | ★★★★★ | Hard requires | Booker + Location pools |
| `invoicing` | ★★★★★ | Hard requires | Morph line sudah diantisipasi |
| `tracking` | ★★★★☆ | Soft event/GPS map | Live map departure |
| `accounting` / `receivables` | ★★★★☆ | Soft bridge | Sama pola Rental/Sales |
| `document` / `maintenance` | ★★★☆☆ | Indirect via Fleet | SIM/STNK, servis armada |
| `rental` | ★★★☆☆ | Soft conflict | Mirror StoreRentalRequest |
| `transportation` | ★★☆☆☆ | Soft conflict only | Jangan reuse Trip sebagai booking |
| `routing` | ★★☆☆☆ | Reuse algoritma murni | Hindari hard requires |
| `orders` / `outbound` / `billing` | ★☆☆☆☆ | Tidak | Spine kargo |
| `sales` / `inventory` / `pos` | ★☆☆☆☆ | Tidak di MVP | Paket wisata = fase belakangan |
| `approvals` | ★★☆☆☆ | Soft | Override overbook / refund |

---

## 7. Permissions, menu, routes

### Permissions
`view`, `create`, `update`, `delete`, `confirm`, `dispatch`, `optimize`

### Menu
```
Travel (icon: van / route)
├── Dashboard
├── Koridor & Tarif
├── Jadwal
├── Keberangkatan
├── Booking
└── (Pools — subset Locations)
```

### Named routes (contoh)
`module.shuttle.dashboard`  
`module.shuttle.corridors.*`  
`module.shuttle.schedules.*`  
`module.shuttle.departures.*` (+ `optimize`, `lock`, `dispatch`, `complete`)  
`module.shuttle.bookings.*` (+ `confirm`, `cancel`, `board`)  

Prefix URL: `/module/shuttle/...` sesuai konvensi `Modules::registerRoutes()`.

---

## 8. Inertia pages (MVP)

| Page | Path |
|---|---|
| Dashboard | `Modules/Shuttle/Dashboard` |
| Corridors Index/Form | `Modules/Shuttle/Corridors/*` |
| Schedules Index/Form | `Modules/Shuttle/Schedules/*` |
| Departures Index/Show | `Modules/Shuttle/Departures/*` — **peta + optimize** |
| Bookings Index/Create/Show | `Modules/Shuttle/Bookings/*` |

Pola UI: ikut Rental + peta Tracking/Routing (Map component existing bila ada).

---

## 9. ModuleContract (sketsa)

```php
key: shuttle
tier: Vertical
requires: ['fleet', 'partners', 'invoicing']
permissions: ['view','create','update','delete','confirm','dispatch','optimize']
```

`VerticalPacks::TRAVEL_SHUTTLE` → fleet, document, maintenance, tracking, partners, invoicing, shuttle (+ demo seeder).

---

## 10. Urutan implementasi

1. Fleet delta: `capacity_seats` + factories/tests
2. Scaffold `ShuttleModule` + migrations + models
3. Corridors + Schedules + Departure generator
4. Bookings + seat lock + confirmation
5. `DepartureRouteOptimizer` + Departures Show map UI
6. Dispatch + soft Fleet conflict
7. `ShuttleInvoiceService`
8. Vertical pack + demo seeder (JKT–BDG sample)
9. Soft Tracking map on `in_transit`
10. (Fase 1.1) Extract shared Haversine/sequencer; seat labels; refund rules; OSRM ETA

### Fase 1.1 — implemented
- `OsrmRouter::drivingRouteDetailed()` + Shuttle `/shuttle/directions` proxy
- Departure Show: Leaflet map (`PlanRoutesMap`) + ETA/duration per stop
- Seat labels (`A1`…) assigned on booking confirm
- Cancel settle: void unpaid invoice **or** issue credit note if paid
- Partner portal: `/module/portal/shuttle/bookings` (read + soft pay invoice)

---

## 11. Testing (wajib)

| Test | Fokus |
|---|---|
| `ShuttleModuleLifecycleTest` | install / permissions / menu |
| `CorridorCrudTest` | tarif fix |
| `ScheduleGenerateDeparturesTest` | days_of_week window |
| `BookingSeatLockTest` | concurrent overbook ditolak |
| `DepartureRouteOptimizerTest` | urutan pickup/drop; pool-only; missing geo |
| `ShuttleInvoiceServiceTest` | morph line + soft skip tanpa invoicing |
| `ShuttleVehicleConflictTest` | soft Rental/Transportation |

Jalankan minimal: `php artisan test --compact --filter=Shuttle`

---

## 12. Risiko & mitigasi

| Risiko | Mitigasi |
|---|---|
| Bentrok konsep Trip kargo vs departure travel | Entity terpisah; dokumentasikan di ModuleTier/README |
| Double-book armada | Soft availability seperti Rental |
| Routing module coupling | Jangan requires; extract solver nanti |
| Door address tanpa koordinat | Wajib lat/lng untuk door; atau geocode async fase 1.1 |
| Tarif hanya fix | Cukup MVP; add-on jemput radius di 1.2 |

---

## 13. Kriteria siap implement

- [ ] Desain disetujui (key `shuttle`, hard deps, anti-pola Trip/DO)
- [x] Keputusan pool: `shuttle_pools` + master `shuttle_cities` di Settings
- [x] Vertical pack & plan entitlement key disepakati
- [x] Sample koridor demo (JKT–BDG 200rb) untuk seeder
- [x] Master city/pool + `shuttle_settings` (config) di UI Settings

---

## 14. Booking mandiri penumpang (public channel)

Kanal B2C agar penumpang memesan kursi **tanpa CS** dan **tanpa jadi Partner**. Tidak memecah domain: tetap menulis ke `ShuttleBooking` + `shuttle_passengers`; yang baru adalah **channel**, **hold seat**, **auth OTP**, dan **surface publik per-tenant**.

### 14.1 Keputusan arsitektur

| Aspek | Keputusan | Alasan |
|---|---|---|
| Surface | **Public booking PWA** per tenant (`book.{tenant}` / path publik) | Mirror pola tracking publik; installable; tanpa Play Store di hari-1 |
| Auth | **OTP nomor HP** (bukan akun Partner) | Friction rendah; cukup untuk tiket & self-cancel |
| Domain | Reuse `ShuttleBooking` + `channel = passenger` | Satu spine ops/manifest/accounting |
| Seat | Status `draft` + **TTL hold** (10–15 menit) | Cegah overbook sebelum bayar |
| Payment MVP | Pay-at-counter / transfer manual (+ bukti) | Gateway masih out-of-scope MVP; jangan blokir go-live |
| Accounting | Sama walk-in: `shuttle_sale.completed` setelah paid/confirmed | Sudah ada Fase B Accounting (§5); tanpa AR Partner |
| Native AAB | Fase belakangan — **bundled** React di Capacitor (bukan remote WebView); orkestrasi build dari CRM via GitHub Actions | Lihat `docs/modules/mobile-app-builder-design.md`; API runtime = kanal publik yang sama |

### 14.2 Tiga channel booking (jangan dicampur)

| Channel | Siapa | `partner_id` | Invoice AR | Accounting tipikal |
|---|---|---|---|---|
| `ops` | CS / desk internal | optional (walk-in null / corporate set) | jika partner | invoice issue **atau** walk-in sale |
| `partner` | Portal B2B (`/module/portal/shuttle/...`) | wajib | draft → issue/pay | `invoice.issued` → `shuttle_revenue` |
| `passenger` | Publik / PWA (§14) | **null** | tidak | hold → paid → `shuttle_sale.completed` |

Jangan jadikan penumpang retail sebagai `Partner` kecuali korporat berulang.

### 14.3 Alur

```
Cari jadwal (koridor + tanggal)
  → Pilih departure + mode pool|door (+ pin map bila door)
  → Isi penumpang + verifikasi OTP HP
  → HOLD (draft, seats reserved, hold_expires_at)
      → Bayar (loket / transfer / gateway P2)
          → CONFIRM + tiket (QR = booking_number / public_token)
              → Boarding ops (boarded → completed) seperti channel lain
```

Job terjadwal: expired hold → release seat (`seats_booked` rollback) + status `cancelled` / `expired`.

### 14.4 Skema tambahan (minimal)

Perluasan `shuttle_bookings` (atau side-car tipis bila kolom terlalu ramai):

| Kolom | Tipe | Keterangan |
|---|---|---|
| `channel` | string/enum | `ops` \| `partner` \| `passenger` (default `ops` untuk data lama) |
| `booker_phone` | string nullable | HP booker (OTP subject) |
| `booker_phone_verified_at` | timestamp nullable | |
| `hold_expires_at` | timestamp nullable | Hanya saat hold aktif |
| `payment_status` | string | `unpaid` \| `pending` \| `paid` \| `refunded` |
| `public_token` | string unique nullable | Lihat tiket tanpa session penuh |

Index: `(departure_id, channel, status)`, `public_token`, `booker_phone`.

### 14.5 Surface & multi-tenant

- Route publik (tanpa auth staff), contoh prefix: `/book/shuttle/...` atau subdomain booking tenant.
- Branding dari settings tenant (logo, warna, nama travel) — **bukan** satu app store multi-tenant.
- Halaman inti PWA:
  1. Cari jadwal
  2. Ringkasan + pax + OTP
  3. Hold / pending payment
  4. Tiket (QR + detail jemput/antar)
  5. Riwayat by OTP / magic link HP
- Soft: notifikasi WA/SMS pada confirm / reminder (listener belakangan).

### 14.6 Permissions & routes (sketsa)

**Publik (throttle + OTP):**  
`public.shuttle.search` · `public.shuttle.hold` · `public.shuttle.otp.send` · `public.shuttle.otp.verify` · `public.shuttle.ticket` · `public.shuttle.cancel`

**Ops (tambahan):**  
`module.shuttle.bookings.release-hold` · setting `passenger_booking_enabled`, `hold_ttl_minutes`, branding PWA

Permission staff baru opsional: `manage_passenger_channel` (toggle kanal + refund policy).

### 14.7 Integrasi Accounting & pembayaran

| Fase bayar | Trigger GL |
|---|---|
| Pay later / loket | CS tandai paid **atau** confirm di desk → `shuttle_sale.completed` (sama walk-in) |
| Transfer + bukti | Ops approve → paid + confirm → journal |
| Gateway (P2) | Webhook paid → auto-confirm → journal; map settlement ke kas/bank company |

Cancel sebelum dispatch: void journal bila sudah `shuttle_sale.completed` (mirror walk-in cancel).

### 14.8 Urutan implementasi kanal publik

| Fase | Isi | Dependency |
|---|---|---|
| **P0** | Public search + hold TTL + pay-later; CS bisa confirm/paid; branding tenant dasar | Seat lock existing |
| **P1** | OTP HP + tiket QR + self-cancel policy + riwayat by phone | P0 |
| **P2** | Payment gateway (QRIS/VA) + auto-confirm + accounting map | P1 + soft receivables/bank |
| **P3** | Bundled Capacitor shell + Mobile App Builder (AAB per tenant via Actions) | Channel publik + API mobile stabil; lihat `mobile-app-builder-design.md` |

### 14.9 Anti-pola

- App native terpisah sebelum public web/PWA stabil
- Membuat entity booking kedua atau `Partner` per tiket retail
- Hold tanpa TTL / tanpa job release
- Satu binary Play Store untuk semua tenant (branding & review rumit)
- Memaksa invoice AR untuk channel `passenger`

### 14.10 Kriteria siap P0

- [x] `channel` + `hold_expires_at` + job release
- [x] Toggle `passenger_booking_enabled` per tenant
- [x] Halaman publik search → hold → ticket (pay-later)
- [x] Tes: concurrent hold tidak overbook; expired hold melepas kursi; accounting walk-in tetap jalan setelah paid/confirm

### 14.11 Status implementasi

| Fase | Status |
|---|---|
| **P0** | Implemented — `/book/shuttle`, hold TTL, CS mark-paid, branding settings |
| **P1** | Implemented — OTP HP, tiket QR, self-cancel, history by phone |
| **P2** | Implemented — Midtrans Snap soft (`PURPOSE_SHUTTLE_BOOKING`) + webhook → confirm |
| **P3** | Pending — bundled Capacitor + App Builder (`mobile-app-builder-design.md`) |

---

## Lampiran A — Alur operasional harian

```
CS/Portal          Dispatcher              Sopir
────────           ──────────              ─────
Booking kursi  →   Lock departure
                   Optimize stops    →     Lihat urutan jemput
Bayar/invoice  →   Dispatch          →     Boarding + complete stops
                                         → Completed → revenue posted
```

## Lampiran B — Perbandingan Rental vs Shuttle vs Transportation

| | Rental | Shuttle (baru) | Transportation |
|---|---|---|---|
| Objek | Sewa unit waktu | Kursi pada jadwal | Muatan/DO |
| Harga | Rate harian/kelas | Fix koridor | Tariff O–D / charge DO |
| Optimasi | — | Urutan jemput/antar | VRP multi-DO |
| Invoice source | Rental | ShuttleBooking | DO charges / Billing |
| Fleet usage | Periode calendar | Slot tanggal+jam | Trip kargo |
