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
- Aplikasi penumpang / driver mobile native
- Pembayaran online gateway (QRIS/VA) — deposit online Rental bisa di-*soft-bridge* belakangan
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
| `code` | varchar unique | `JKT-BDG` |
| `name` | varchar | Jakarta – Bandung |
| `origin_city` | varchar | Label kota asal |
| `destination_city` | varchar | Label kota tujuan |
| `origin_location_id` | FK → locations nullable | Pool default asal |
| `destination_location_id` | FK → locations nullable | Pool default tujuan |
| `base_fare` | decimal(15,2) | Tarif fix per kursi (MVP) |
| `estimated_duration_minutes` | unsigned int nullable | ETA koridor |
| `distance_km` | decimal(10,2) nullable | |
| `is_active` | bool | |
| `notes` | text nullable | |
| `timestamps` | | |

> Reverse corridor (BDG–JKT) = baris terpisah agar tarif/jadwal mandiri.

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
| `partner_id` | FK → partners | Booker (`customer_rank > 0`) |
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
4. Bangun urutan:
   - Pickups door: nearest-neighbour dari “anchor” (depot = pool origin, atau centroid jemput pertama)
   - Sisipkan `pool_origin` di akhir leg jemput (jika ada pool)
   - Sisipkan `pool_destination` di awal leg drop
   - Dropoffs door: nearest-neighbour dari pool destination
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
- Confirm booking → draft invoice partner = booker
- Line: `"Travel {corridor} {date} — {n} pax"`, amount = `total_fare`, `source` morph `ShuttleBooking`
- Issue/pay di Invoicing; AccountingBridge tetap tidak mengenal Shuttle

### Accounting (soft)
Optional `revenue_role = shuttle_revenue` di context posting (mirror rental) — fase 1.1.

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
- [ ] Keputusan pool: `shuttle_pools` vs `locations.kind`
- [ ] Keputusan extract Haversine sekarang vs copy MVP
- [ ] Vertical pack & plan entitlement key disepakati
- [ ] Sample koridor demo (JKT–BDG 200rb) untuk seeder

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
