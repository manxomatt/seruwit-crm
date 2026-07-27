# POS (Point of Sale) — Module Design Document

**Module key:** `pos`  
**Tier:** Foundation (reuse di tenant retail/toko, bukan vertikal logistik)  
**Depends on:** `products`, `inventory`  
**Soft depends on:** `partners` (member/customer opsional), `invoicing` (struk formal / faktur), `promotions` (diskon promo), `approvals` (void/refund besar)  
**Tidak bergantung pada:** `sales` (SO/GIN), `orders`, `outbound`, `transportation` — penjualan kasir **bukan** alur SO→GIN

**New tables (MVP):** 5 · **New pages (MVP):** 4 · **Estimasi file inti:** ~22

> **Keputusan inti:** Store/toko di Inventory adalah *lokasi stok*. POS adalah *cara menjual* di kasir. Satu transaksi POS harus selesai dalam **detik**, bukan menit — maka POS punya dokumen sendiri (`pos_sales`) yang langsung `stock out` + catat pembayaran, tanpa melewati Sales Order.

---

## 0. Problem & Opportunity

### Problem
SO → GIN bagus untuk penjualan terencana (B2B / sales order). Di kasir toko, alur itu terlalu panjang: pilih partner, buat SO, confirm, buat GIN, confirm, bayar. Antrian pelanggan tidak menunggu itu.

### Opportunity
Satu layar kasir yang:
1. Scan / cari produk → keranjang
2. Bayar (tunai / non-tunai)
3. Potong stok store + cetak struk
4. Siap transaksi berikutnya

### Personas
| Persona | Kebutuhan |
|---|---|
| **Kasir** | Cepat, sedikit klik, tahan salah scan, keyboard + barcode |
| **SPV toko** | Buka/tutup shift, void/refund, lihat selisih kas |
| **Owner / admin** | Laporan omzet per store/shift, rekonsiliasi stok |

---

## 1. Product Principles (UX)

1. **Speed over features** — happy path ≤ 4 interaksi setelah scan selesai: *Bayar → metode → konfirmasi → selesai*.
2. **One job per screen** — Terminal kasir ≠ dashboard CRM. Hilangkan sidebar modul; chrome minimal.
3. **Touch-first, keyboard-sharp** — Target sentuh ≥ 48px; shortcut jelas (lihat §7).
4. **Forgiving** — Parkir keranjang, ubah qty, hapus baris tanpa dialog berantai; aksi destruktif (void) butuh konfirmasi + role.
5. **Stock-honest** — Stok tersedia di store terlihat di grid; item tanpa stok tidak bisa dijual (kecuali service).
6. **Calm confidence** — Warna tenang, kontras tinggi, CTA bayar dominan. Bukan “dashboard ungu”, bukan “koran padat”.

### Visual direction (token)

```
--pos-bg:           #F0F3F7          /* ambient cool gray-blue */
--pos-surface:      #FFFFFF
--pos-ink:          #0F1D2E
--pos-muted:        #5E7490
--pos-accent:       #1A5C8A          /* slate blue — chrome / secondary */
--pos-pay:          #0F7A4A          /* emerald — primary Pay CTA only */
--pos-pay-hover:    #0C643C
--pos-warn:         #C87C0A
--pos-danger:       #A52020
--pos-radius:       12px             /* cards / tiles; buttons 10px */
--pos-font:         "DM Sans", system-ui, sans-serif
--pos-mono:         "IBM Plex Mono", ui-monospace, monospace  /* harga, qty */
```

**Motion (2–3 saja):** (1) baris keranjang slide-in singkat, (2) pulse sukses pada “Lunas”, (3) drawer pembayaran slide-up. Tanpa confetti / glow.

---

## 2. Scope

### MVP (harus ada)
- Shift/session kasir (buka dengan modal awal, tutup dengan hitung kas)
- Terminal jual penuh layar, terikat **1 store** (`warehouses.kind = store`)
- Cari produk (nama/SKU/barcode) + grid favorit / hasil cari
- Keranjang: qty, hapus, subtotal, pajak (dari setting), total
- Pembayaran: tunai (hitung kembalian), non-tunai (satu metode: transfer/QR/card sebagai label)
- Commit atomik: `pos_sale` + stock out + payment lines
- Struk thermal-friendly (print dialog / PDF 80mm)
- Riwayat penjualan hari ini (cari & reprint)
- Permission: `sell`, `open_shift`, `close_shift`, `void`, `refund`

### Out of scope MVP (fase berikutnya)
- Offline-first / sync antrian
- Multi-tender split kompleks (sebagian tunai + sebagian QR) — boleh 1 metode dulu; split = fase 1.1
- Integrasi perangkat EDC hardware
- Loyalty poin / voucher eksternal
- Meja restoran / order kitchen
- Weight scale
- Multi-kasir concurrent park queue cloud (park lokal per session cukup di MVP)

### Fase 1.1
- Split payment
- Hold bill antrean bersama per store
- Diskon baris / nota (izin SPV)
- Integrasi soft `promotions`

### Fase 1.2
- Member (`partners`) + harga member
- Refund penuh/sebagian → stock in + cash out shift
- Invoice formal via `invoicing` (opsional)

---

## 3. Information Architecture

```
/module/pos
  /terminal          → layar kasir (full-bleed layout)
  /shifts            → daftar shift + buka/tutup
  /shifts/{id}       → detail shift + rekonsiliasi
  /sales             → riwayat penjualan (filter store/tanggal)
  /sales/{id}        → detail + reprint
```

Menu CRM: **POS** → default ke `/terminal` jika ada shift terbuka; jika tidak, paksa buka shift dulu.

---

## 4. UX — Terminal Kasir (layar utama)

### Layout (desktop / tablet landscape)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [Store: Toko Menteng ▾]   Shift #12 · Kasir: Sari    14:32   [Park] [⋯] │
├────────────────────────────────────┬─────────────────────────────────────┤
│  🔍 Scan / cari produk…            │  KERANJANG                          │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐       │  Indomie Goreng      2 × 3.500  7.000│
│  │img │ │img │ │img │ │img │       │  Teh Botol          1 × 5.000  5.000│
│  │name│ │    │ │    │ │    │       │  ─────────────────────────────────  │
│  │stk │ │    │ │    │ │    │       │  Subtotal                    12.000 │
│  └────┘ └────┘ …                   │  Pajak 11%                    1.320 │
│  (grid 3–4 kolom, infinite scroll) │  ─────────────────────────────────  │
│                                    │  TOTAL                     13.320 │
│                                    │                                     │
│                                    │  [  BAYAR  ·  Rp 13.320  ]          │
└────────────────────────────────────┴─────────────────────────────────────┘
```

**Proporsi:** kiri ~58% katalog, kanan ~42% keranjang. Di tablet portrait: katalog atas, keranjang bawah fixed (sheet).

### Komponen kunci

| Area | Perilaku |
|---|---|
| **Search** | Auto-focus; scanner HID mengetik + Enter; debounce 150ms; Enter pada 1 hasil = add |
| **Product tile** | Gambar (fallback inisial), nama 2 baris, harga mono, badge stok; tap = +1 |
| **Cart line** | − / qty / + ; swipe atau tombol hapus; long-press ubah harga (SPV) |
| **Pay CTA** | Full-width, tinggi 56–64px, warna `--pos-pay`; disabled jika keranjang kosong |
| **Header** | Store terkunci ke shift; ganti store = tutup shift dulu |

### Alur bayar (sheet / panel kanan melebar)

1. Ringkasan total
2. Pilih metode: **Tunai** | **QRIS/Transfer** | **Kartu** (label konfigurabel)
3. Tunai: input nominal → **kembalian** besar & jelas
4. Konfirmasi → loading singkat → layar sukses: nomor struk + kembalian + **[Cetak]** **[Transaksi baru]**

Happy path visual: sukses bukan modal gelap — full panel hijau lembut, angka kembalian hero.

### Empty & error states
- Keranjang kosong: ilustrasi minimal + “Scan barang untuk mulai”
- Stok habis: tile disabled + toast “Stok tidak cukup di toko ini”
- Shift belum dibuka: intercept full-screen “Buka shift untuk mulai menjual”

---

## 5. Domain Model

### `pos_registers` (opsional MVP — bisa 1 register implisit per store)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `warehouse_id` | FK → warehouses | Harus `kind = store` |
| `name` | string | mis. “Kasir 1” |
| `is_active` | bool | |
| `timestamps` | | |

> MVP boleh skip tabel ini: anggap 1 register = 1 store. Tambah saat multi-kasir fisik perlu dipisah.

### `pos_shifts`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `warehouse_id` | FK → warehouses | Store |
| `register_id` | FK nullable | |
| `opened_by` | FK → users | |
| `closed_by` | FK → users nullable | |
| `status` | string | `open` · `closed` |
| `opening_float` | decimal(15,2) | Modal kas awal |
| `closing_cash_counted` | decimal(15,2) nullable | |
| `expected_cash` | decimal(15,2) nullable | Dihitung saat close |
| `cash_variance` | decimal(15,2) nullable | counted − expected |
| `opened_at` | timestamp | |
| `closed_at` | timestamp nullable | |
| `notes` | text nullable | |
| `timestamps` | | |

Constraint app: **satu shift `open` per (warehouse[, register])**.

### `pos_sales`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `code` | string unique | `POS-{YYYY}-{SEQ}` |
| `pos_shift_id` | FK → pos_shifts | |
| `warehouse_id` | FK → warehouses | Denormalized |
| `cashier_id` | FK → users | |
| `partner_id` | FK → partners nullable | Walk-in = null |
| `status` | string | `completed` · `voided` · `refunded` |
| `subtotal` | decimal(15,2) | |
| `discount_total` | decimal(15,2) default 0 | |
| `tax_total` | decimal(15,2) default 0 | |
| `grand_total` | decimal(15,2) | |
| `sold_at` | timestamp | |
| `voided_at` | timestamp nullable | |
| `voided_by` | FK nullable | |
| `void_reason` | text nullable | |
| `notes` | text nullable | |
| `timestamps` | | |

### `pos_sale_items`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `pos_sale_id` | FK cascade | |
| `product_id` | FK → products | |
| `product_packaging_id` | FK nullable | |
| `quantity` | decimal(12,3) | Dalam UOM baris |
| `qty_base` | decimal(12,3) | Konversi ke satuan stok |
| `unit_price` | decimal(15,2) | |
| `line_discount` | decimal(15,2) default 0 | |
| `tax_amount` | decimal(15,2) default 0 | |
| `line_total` | decimal(15,2) | |
| `unit` | string nullable | Label |
| `timestamps` | | |

### `pos_payments`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `pos_sale_id` | FK cascade | |
| `method` | string | `cash` · `qris` · `transfer` · `card` · `other` |
| `amount` | decimal(15,2) | |
| `reference` | string nullable | No. referensi QR/EDC |
| `timestamps` | | |

Untuk tunai: `amount` = uang diterima; kembalian = `amount − grand_total` (disimpan di `pos_sales.change_due` opsional, atau dihitung).

**Tambah kolom:** `pos_sales.amount_tendered` decimal nullable, `pos_sales.change_due` decimal nullable.

---

## 6. Status & Transaksi

### Shift
```
[open] → [closed]
```

### Sale
```
(create atomic) → [completed]
                      ↓ void (SPV)
                  [voided]
                      ↓ refund (fase 1.2)
                  [refunded]
```

Tidak ada `draft` sale di server untuk MVP — keranjang hidup di client sampai Bayar. Park = localStorage / `pos_held_carts` (opsional tabel kecil).

### Park (MVP)
Simpan di `sessionStorage` / tabel `pos_held_carts`:
- `pos_shift_id`, `cashier_id`, `payload` JSON, `label`, `held_at`
- Max N hold per shift (mis. 10)

---

## 7. Keyboard & Barcode

| Input | Aksi |
|---|---|
| Fokus search (default) | Siap scan |
| Enter (1 hasil) | Tambah ke keranjang |
| `F2` | Fokus search |
| `F4` | Bayar |
| `Esc` | Tutup sheet / batal |
| `+` / `−` | Qty baris terpilih |
| `Delete` | Hapus baris terpilih |
| Barcode USB HID | Ketik cepat + suffix Enter |

---

## 8. Integrasi Inventory

### Saat sale completed (satu DB transaction)
Untuk tiap item:
1. Resolve lokasi jual default store = lokasi `STOCK` / `internal` (sama pola GIN)
2. Cek available on-hand ≥ `qty_base` (FEFO jika tracking lot — fase 1.1 boleh simplifikasi: batch null dulu)
3. `StockMovementRecorder::record` type `out`, `source_type = pos_sale`, `source_id = sale.id`, `reference_code = sale.code`

### Saat void
Reverse: stock `in` dengan `source_type = pos_sale_void`, restore qty.

### Guard
- `WarehouseKindGuard::rejectIfCannotSell` — store OK, showroom ditolak
- Kasir hanya boleh shift di warehouse yang accessible (AccessibleWarehouses)

### Jangan
- Membuat SO + GIN di belakang layar untuk setiap struk (kompleksitas & latency)
- Double-count stok

Hubungan dengan Sales module: **paralel**. Laporan omzet gabungan = union SO delivered + POS completed (fase reporting).

---

## 9. Pajak & Harga

- Harga jual default = `products.price`
- Pajak: ikut setting yang sama dengan Sales/Invoicing (`ecommerce.tax_*` atau group `pos.tax_*` baru)
- MVP: harga termasuk pajak **atau** ex-tax — pilih **satu** mode di setting tenant `pos.prices_include_tax` (default `true` untuk retail ID)

---

## 10. Permissions

| Action | Dipakai |
|---|---|
| `view` | Lihat riwayat / shift |
| `sell` | Terminal + complete sale |
| `open_shift` | Buka shift |
| `close_shift` | Tutup shift |
| `void` | Void penjualan |
| `refund` | Refund (fase 1.2) |
| `discount` | Diskon manual (fase 1.1) |

---

## 11. Routes (usulan)

```
GET    /module/pos/terminal
POST   /module/pos/shifts                     # open
POST   /module/pos/shifts/{shift}/close
GET    /module/pos/shifts
GET    /module/pos/shifts/{shift}

GET    /module/pos/products/search?q=&warehouse_id=
POST   /module/pos/sales                      # complete cart
POST   /module/pos/sales/{sale}/void
GET    /module/pos/sales
GET    /module/pos/sales/{sale}
GET    /module/pos/sales/{sale}/receipt        # PDF/stream print
```

Prefix name: `module.pos.*`

---

## 12. Pages (Inertia)

| Page | Layout | Keterangan |
|---|---|---|
| `Modules/Pos/Terminal` | `PosLayout` (full-bleed, no CRM nav) | Kasir |
| `Modules/Pos/Shifts/Index` | DynamicLayout + PosNav | Daftar shift |
| `Modules/Pos/Shifts/Show` | DynamicLayout | Rekonsiliasi |
| `Modules/Pos/Sales/Index` | DynamicLayout + PosNav | Riwayat |
| `Modules/Pos/Sales/Show` | DynamicLayout | Detail + reprint |

`PosLayout`: hanya top bar store/shift/jam; tanpa sidebar modul CRM.

---

## 13. API search produk (terminal)

Response item:
```json
{
  "id": 1,
  "name": "Indomie Goreng",
  "sku": "SKU-…",
  "barcode": "…",
  "price": 3500,
  "unit": "pcs",
  "image_url": "https://…",
  "available_qty": 48,
  "packagings": []
}
```

Filter: `warehouse_id` shift, `category !=` hanya service boleh qty bebas, merchandise butuh stok > 0.

---

## 14. Close shift — rekonsiliasi

```
expected_cash = opening_float
              + sum(payments.cash amount_tendered - change_due)
              - sum(cash refunds)   // fase 1.2

variance = closing_cash_counted - expected_cash
```

UI: angka besar, hijau jika |variance| ≤ toleransi (setting), merah jika di luar. Wajib notes jika variance ≠ 0.

---

## 15. Receipt (80mm)

```
TOKO MENTENG
Jl. …
----------------
POS-2026-0042
28/07/2026 14:32
Kasir: Sari
----------------
2x Indomie Goreng    7.000
1x Teh Botol         5.000
----------------
Subtotal            12.000
Pajak                1.320
TOTAL               13.320
Tunai               20.000
Kembali              6.680
----------------
Terima kasih
```

---

## 16. Non-goals & anti-patterns

| Hindari | Alasan |
|---|---|
| Embed terminal di dalam form SO | Lambat, salah persona |
| Modal berlapis untuk qty | Gesekan kasir |
| Dark mode default | Toko terang; kontras jelek di siang hari |
| Purple / glow CTA | Bertentangan arah visual produk |
| Memaksa pilih customer setiap sale | Walk-in mayoritas |
| Stok “soft” tanpa movement | Rekonsiliasi inventory rusak |

---

## 17. Success metrics

- Median waktu scan-pertama → lunas < **45 detik**
- Void rate < 2% transaksi
- Cash variance absoluf median ≈ 0 per shift
- Error “stok tidak cukup” yang diatasi tanpa panggil SPV > 90% (kasir paham dari UI)

---

## 18. Implementation order (suggested)

1. Migrations + models + permissions + module skeleton  
2. Shift open/close  
3. Product search API + Terminal shell (layout + cart state)  
4. Complete sale + stock out + payments  
5. Receipt print  
6. Sales history + void  
7. Polish shortcuts, park, empty states  

---

## 19. Open questions (untuk stakeholder)

1. Apakah **satu store boleh banyak kasir parallel** di hari yang sama? (→ butuh `pos_registers`)  
2. Harga **include tax** atau exclude?  
3. Apakah void mengembalikan kas ke laci secara otomatis (asumsi tunai) atau hanya koreksi laporan?  
4. Perlukah cetak otomatis tanpa dialog setelah bayar?

---

## 20. Ringkasan keputusan

| Topik | Keputusan |
|---|---|
| Modul | `pos` terpisah dari `sales` |
| Stok | Langsung `StockMovement` `out` / void `in` |
| Lokasi | Hanya warehouse `kind=store` (yang accessible) |
| UX | Full-bleed terminal, katalog kiri + keranjang kanan, CTA emerald |
| Shift | Wajib sebelum jual; rekonsiliasi kas saat tutup |
| Customer | Opsional |
| SO/GIN | Tidak dipakai di jalur kasir |
