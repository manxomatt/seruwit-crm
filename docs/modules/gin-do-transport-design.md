# GIN → Delivery Order → Transportation
## Integration Design Document

**Status:** Design (post GIN→DO bridge)  
**Audience:** Product + engineering  
**Tenant reference:** majumakmur (trade spine + fleet/logistics)

**Modul terkait**

| Key | Package path | Peran |
|---|---|---|
| `sales` | `modules/Sales` | SO + GIN (stock out gudang) |
| `orders` | `modules/Orders` | Delivery Order, surat jalan, driver POD, sync trip↔DO |
| `transportation` | `modules/TransportationManagement` | Trip, stop, checkpoint, jadwal, manifest |
| `routing` | `modules/Routing` | Optimasi rute → materialisasi Trip + assign DO |
| `outbound` | `modules/Outbound` | Pick/pack/dispatch (opsional; sering dilewati bila GIN sudah stock-out) |
| `fleet` / `tracking` | Fleet + GPS | Armada & telemetri; GPS hanya *arrive* stop |

> **Prinsip arsitektur (sudah berlaku di kode):**  
> - Sales **tidak** `requires` orders / transportation.  
> - Transportation **tidak** mengenal GIN / Sales.  
> - Orders adalah **jembatan**: `goods_issue_note_id` di DO + `TripObserver` / `TripStopObserver` di Orders.  
> - Stok keluar **sekali**: di GIN confirm (jalur dagang) atau di Outbound dispatch / DO fulfill (jalur logistik murni).

---

## 0. Tujuan & batasan

### Tujuan
Setelah barang keluar gudang (GIN confirmed), mengalirkan pengiriman ke modul transportasi dengan jelas:

1. Sopir/dispatcher punya **instruksi trip** (bukan dokumen GIN).  
2. **Tidak double stock.**  
3. Status lapangan (assigned → in_transit → delivered) sinkron dengan Trip/POD.  
4. Surat jalan yang dibawa sopir = **PDF DO** (Orders), setelah DO di-assign ke trip.

### In scope (desain integrasi)
- Alur operasional recommended: GIN → DO → Trip → POD  
- Soft gates, UX, sync manifest, pickup stop, aturan completion  
- Fase implementasi bertahap  
- Keputusan Outbound vs skip Outbound untuk jalur GIN

### Out of scope
- Mengubah Sales agar hard-depend pada transportation  
- Menulis FK dari `trips` ke `goods_issue_notes`  
- Redesain penuh GPS / billing invoice trip  
- Canvassing / rental trip variants

---

## 1. As-is (sudah ada di kode)

```
SO confirm → reserve
     ↓
GIN confirm → stock out (consume)     ← titik kebenaran inventori dagang
     ↓
[optional] Create DO from GIN → draft DO (1:1, goods_issue_note_id)
     ↓
Confirm DO → NO reserve (isFromGin)
     ↓
[optional] Outbound pick/pack/dispatch → skip stock bila from GIN
     ↓
Assign trip (manual) / Routing apply → DO assigned + dropoff TripStop
     ↓
Trip start → DO in_transit
     ↓
Stop arrive (driver/GPS) → POD → stop complete → DO delivered
  atau Trip complete (dispatcher) → bulk delivered + fulfill (no-op stok bila from GIN)
```

### Yang sudah aman
| Aspek | Status |
|---|---|
| Bridge GIN→DO | ✅ `DeliveryOrderFromGinService` |
| Skip reserve/fulfill/consume untuk DO dari GIN | ✅ `DeliveryOrderStock` |
| Void GIN diblok jika DO aktif | ✅ |
| DO ↔ Trip status sync | ✅ Orders observers |
| Surat jalan PDF dari DO | ✅ setelah assigned |
| Driver portal + POD | ✅ |
| Routing apply → Trip + assign | ✅ |

### Gap utama
| Gap | Dampak |
|---|---|
| GIN→DO masih **manual** + DO tetap **draft** | Friction; mudah lupa confirm |
| Assign trip **manual** (kecuali Routing) | Dispatcher kerja berulang |
| Hanya **dropoff** stop dibuat; **pickup** gudang tidak otomatis | Manifest trip tidak menggambarkan muat di gudang |
| `TripItem` tidak diisi dari DO/GIN lines | Manifest kargo kosong / tidak sinkron |
| Trip complete bisa **delivered tanpa POD** | Bukti terima lemah untuk jalur dagang |
| Tidak ada antrian “siap kirim” (GIN confirmed + DO confirmed, belum trip) | Operasional sulit di UI |
| Outbound opsional tidak dijelaskan di UX | Bingung pick/pack vs GIN sudah keluar |

---

## 2. Model mental: dua jalur masuk Transport

```
                    ┌─────────────────────────────┐
                    │     TRANSPORTATION (Trip)   │
                    │  scheduled → in_progress →  │
                    │  completed / cancelled      │
                    └─────────────▲───────────────┘
                                  │ assign / routing
                    ┌─────────────┴───────────────┐
                    │     ORDERS (DeliveryOrder)  │
                    └─────────────▲───────────────┘
                         │                 │
            ┌────────────┴──┐       ┌──────┴──────────┐
            │ Jalur DAGANG  │       │ Jalur LOGISTIK  │
            │ GIN stock-out │       │ DO confirm      │
            │ → DO (from    │       │ reserve →       │
            │   GIN)        │       │ (Outbound?) →   │
            └───────────────┘       │ trip            │
                                    └─────────────────┘
```

| | Jalur dagang (recommended majumakmur) | Jalur logistik murni |
|---|---|---|
| Trigger stok | GIN confirm | DO confirm reserve; consume di POD/Outbound |
| DO | Wajib dibuat dari GIN | Standalone DO |
| Outbound | **Skip** (atau pick/pack administratif tanpa stock) | Opsional/wajib per tenant policy |
| Dokumen sopir | Surat jalan DO | Surat jalan DO |
| Dokumen gudang | GIN / Surat Jalan Penjualan | — |

**Rekomendasi produk:** untuk tenant trade (SO/GIN), **Outbound tidak wajib** setelah GIN. Outbound tetap berguna untuk 3PL / warehouse yang pick sebelum GIN (proses terbalik) — itu jalur terpisah, jangan dicampur default UX.

---

## 3. Target alur operasional (recommended)

### 3.1 Happy path FMCG distributor

1. Sales: SO confirmed → Gudang buat & **confirm GIN** (barang fisik keluar ke staging/loading).  
2. Gudang/Sales: **Buat DO** dari GIN (atau auto — lihat Fase T1).  
3. Dispatcher: review alamat/koordinat → **Confirm DO**.  
4. Dispatcher: buat / pilih **Trip** (kendaraan + sopir hari itu) **atau** jalankan **Routing** pada kumpulan DO confirmed.  
5. Saat assign: sistem membuat **dropoff** (+ opsional **pickup** gudang) dan sync **TripItem**.  
6. Cetak **Surat Jalan** DO → dibawa sopir. GIN **tidak** dibawa ke customer (arsip gudang).  
7. Sopir: start trip → arrive → **POD** (qty accepted / returned) → stop complete.  
8. DO `delivered`. Stok tidak berubah lagi (kecuali returned qty di POD → stock in).

### 3.2 Status yang harus terlihat di UI

| Tahap | Sales | Orders | Transportation |
|---|---|---|---|
| Barang keluar | GIN `confirmed` | — | — |
| Siap dijadwalkan | GIN + DO link | DO `confirmed`, `trip_id` null | — |
| Terjadwal | | DO `assigned` | Trip `scheduled`, stop pending |
| Jalan | | DO `in_transit` | Trip `in_progress`, stop arrived |
| Selesai | | DO `delivered` + POD | Stop `completed` / Trip `completed` |

---

## 4. Keputusan desain (rekomendasi)

### D1 — Jembatan tetap di Orders, bukan di Transportation
- Jangan tambah `goods_issue_note_id` ke `trips`.  
- Transportation tetap generik (bisa dipakai rental/lain nanti).  
- Semua aturan “DO dari GIN” hidup di Orders (+ soft call dari Sales UI).

### D2 — Satu GIN → satu DO → satu dropoff (sudah)
- Partial GIN = beberapa DO sepanjang waktu (satu per GIN).  
- Banyak DO boleh satu Trip (multi-drop).  
- Jangan merge beberapa GIN ke satu DO tanpa fase khusus.

### D3 — Outbound default: bypass untuk `isFromGin()`
- UX: sembunyikan / soft-disable “Generate Pick List” bila DO from GIN, dengan penjelasan “Stok sudah dikeluarkan via GIN”.  
- Tenant yang tetap mau scan picking: izinkan Outbound **tanpa** stock movement (sudah di-gate).

### D4 — Completion policy untuk jalur dagang
- **Preferred:** DO delivered hanya via **POD + stop complete**.  
- **Phase T1 soft:** warning jika dispatcher complete trip sementara ada DO from GIN tanpa POD.  
- **Phase T2 hard (opsional config):** `orders.require_pod_before_trip_complete` — blok complete trip.

### D5 — Pickup stop gudang (opsional tapi recommended)
Saat assign DO from GIN ke trip:
- Jika trip belum punya pickup untuk warehouse yang sama → buat `TripStop` type `pickup` (sequence awal) dari `pickup_address` / warehouse geo bila ada.  
- Dropoff tetap seperti sekarang.  
- Tidak memicu stock (stock sudah di GIN).

### D6 — Sync TripItem dari DO lines saat assign / unassign
- Aggregate by `product_id` di trip (qty += DO lines).  
- Unassign: kurangi qty / hapus baris jika 0.  
- Manifest = dokumen operasional trip; sumber kebenaran qty kirim tetap DO/GIN.

### D7 — Sales tetap soft-depend
- Tombol “Buat DO” / deep-link trip hanya jika `Modules::available('orders')`.  
- Tidak ada service Sales yang import Trip model secara hard.

---

## 5. Perubahan yang diusulkan (per fase)

### Fase T0 — Dokumentasi & naming ✅
- [x] Update `sales-order-design.md` + dokumen ini  
- [x] UI/PDF copy: **Surat Jalan Penjualan** (GIN) vs **Surat Jalan Pengiriman** (DO)  
- [x] Checklist operasional dispatcher (di bawah)

### Checklist operasional dispatcher (T0)

1. Pastikan GIN sudah **confirmed** (stok keluar).  
2. Buat / buka **DO** dari GIN → confirm DO (atau aktifkan auto-confirm di Settings → Orders).  
3. Buka Orders filter **“Siap dijadwalkan (dari GIN)”**.  
4. Assign ke trip terjadwal (atau Routing apply).  
5. Cetak **Surat Jalan Pengiriman** (DO) — dibawa sopir.  
6. Sopir: start trip → arrive → **POD**.  
7. Hindari complete trip tanpa POD bila memungkinkan (sistem memberi warning).

### Fase T1 — Soft integration ✅ (implemented)

| Item | Status |
|---|---|
| T1.1 Antrian siap kirim | ✅ Orders Index `queue=ready_from_gin` |
| T1.2 Auto-confirm DO opsional | ✅ Setting `orders.auto_confirm_do_from_gin` |
| T1.3 Sync TripItem | ✅ `DeliveryOrderTripAssignment` |
| T1.4 Pickup stop | ✅ auto saat assign bila ada `pickup_address` |
| T1.5 Deep links | ✅ GIN↔DO↔Trip + badge Dari GIN |
| T1.6 POD preference warning | ✅ flash `warning` saat complete trip |
| T1.7 Skip Outbound CTA | ✅ PickListGenerator + eligible list exclude from-GIN |

### Fase T2 — Dispatch & kualitas bukti ✅ (implemented)

| Item | Status |
|---|---|
| T2.1 Batch assign | ✅ Orders Index multi-select → satu trip |
| T2.2 Config require POD | ✅ Setting `orders.require_pod_before_trip_complete` = `off` \| `from_gin` \| `all` |
| T2.3 Geo warehouse | ✅ `warehouses.latitude/longitude` → pickup stop |
| T2.4 Routing SOP | ✅ checklist di bawah |
| T2.5 Returned qty UX | ✅ POD hint + CTA Sales Return dari GIN |

### SOP Routing harian (T2.4)

1. Filter Orders **Siap dijadwalkan (dari GIN)** (atau semua `confirmed`).  
2. Pastikan DO punya koordinat kirim (`delivery_lat/lng`) bila memakai optimizer.  
3. Modul **Routing** → buat plan tanggal hari ini → pilih DO → optimize.  
4. Review rute → **Apply** → Trip scheduled + DO assigned (pickup + TripItem ikut).  
5. Alternatif tanpa Routing: checklist multi-select di Orders Index → **Assign batch ke trip**.  
6. Cetak Surat Jalan Pengiriman per DO → serahkan ke sopir.  
7. Sopir isi POD; bila ada returned qty → stok in otomatis; office buat Sales Return dari GIN bila perlu credit note.

### Fase T3 — Otomasi lanjutan (opsional)
- Auto-create draft DO on GIN confirm (setting).  
- Auto-assign ke trip terjadwal (matching wilayah / vehicle capacity) — butuh Routing + demand_kg akurat.  
- Notifikasi gudang “DO belum di-assign > X jam setelah GIN”.

---

## 6. Aturan stok (tidak boleh dilanggar)

```
GIN confirm     → stock OUT (wajib jalur dagang)
DO confirm      → reserve HANYA jika !isFromGin()
Outbound dispatch → stock OUT HANYA jika !upstream (GIN / sudah dispatch)
POD accepted    → consume/fulfill HANYA jika DO mengelola inventori
POD returned    → stock IN (selalu relevan)
Trip / stop     → TIDAK pernah post stock movement sendiri
```

`TripItem` = manifest informatif, **bukan** ledger inventori.

---

## 7. Dokumen yang dibawa manusia

| Peran | Bawa | Jangan |
|---|---|---|
| Petugas gudang | GIN / Surat Jalan Penjualan (arsip + loading) | — |
| Sopir | Surat Jalan DO (PDF Orders) + app driver | GIN sebagai dokumen customer |
| Customer | Tanda terima via POD (signature/foto) | — |
| Finance | Invoice dari GIN delivered qty (Sales/Invoicing) | Menunggu trip complete sebagai syarat invoice (kecuali kebijakan tenant) |

Invoice dagang tetap dari **qty GIN**, bukan dari Trip — trip hanya bukti logistik/POD.

---

## 8. Boundary & dependensi modul

```
sales ──soft──► orders ──requires──► transportation ──requires──► fleet, partners, products
                      │                      ▲
                      │                      │
                      └──── routing ─────────┘
                      │
                      └──soft──► outbound (opsional)
```

| Arah | Boleh | Dilarang |
|---|---|---|
| Sales → Orders | Soft `class_exists` / `Modules::available` | `requires('orders')` |
| Orders → Transportation | Requires + observers | Transportation import Sales |
| Transportation → Orders | Tidak (opaque `delivery_order_id`) | FK wajib / Sales models |
| Tracking → Trip | Event `VehiclePositionsRecorded` → listener | Tracking requires transportation |

---

## 9. UI / layar yang perlu

### Existing (pakai)
- Sales GIN Show: Buat DO / Lihat DO  
- Orders Show: Assign trip, cetak surat jalan, link trip  
- Transportation Trip Show: stops, start/complete  
- Driver Today / Trip / POD  

### Baru / diperluas (T1–T2)
1. **Orders Index** — tab/filter “Siap dijadwalkan (dari GIN)”.  
2. **Trip Show** — daftar DO dengan badge GIN + link; manifest TripItem terisi.  
3. **Dispatch board** (T2) — kolom: siap → terjadwal → jalan → selesai.  
4. Copy Outbound — empty state “DO ini dari GIN; stok sudah keluar”.

---

## 10. Tes yang harus ada saat implementasi

| Kasus | Expect |
|---|---|
| Assign DO from GIN ke trip | Dropoff (+ pickup); TripItem qty = DO lines; on_hand tidak berubah |
| Unassign | Stop pending hilang; TripItem dikurangi; DO kembali confirmed |
| Start trip | DO → in_transit; stok tetap |
| POD accepted full | DO delivered; stok tetap (from GIN) |
| POD partial return | Stock in untuk qty returned |
| Complete trip tanpa POD (T1) | Warning; (T2+config) blocked |
| Routing apply pada DO from GIN | Sama seperti assign; no stock |
| Generate picklist from-GIN | Ditolak / di-hide; atau allowed tanpa stock movement |

---

## 11. Rekomendasi urutan implementasi

1. **T0** docs + copy (cepat, kurangi salah paham surat jalan).  
2. **T1.3 + T1.4** sync TripItem + pickup stop (nilai operasional langsung).  
3. **T1.1 + T1.5** antrian + deep link.  
4. **T1.6 + T1.7** warning POD + hide Outbound.  
5. **T1.2** auto-confirm setting.  
6. **T2** batch assign + require POD config + routing SOP.

Ini menutup celah “barang sudah keluar gudang tapi belum masuk dunia trip” tanpa merusak boundary modul.

---

## 12. Ringkasan one-liner

> **GIN = kebenaran stok gudang; DO = instruksi kirim; Trip = eksekusi armada; POD = bukti sampai. Integrasi terbaik = jembatan soft di Orders, skip double stock, sync stop/manifest ke Transportation, dan jadikan POD jalur utama completion untuk DO dari GIN.**
