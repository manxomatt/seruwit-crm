# Promotions — Module Design Document (Cross-Channel)

**Module key:** `promotions` (folder `TradePromotions`)  
**Tier:** Vertical  
**Depends on:** `partners`, `products`, `inventory` (untuk scope warehouse/store)  
**Soft depends on:** `sales`, `pos`, `orders`, `invoicing`  
**Channels jual SKU (live):** `sales` (SO→GIN), `pos` (kasir)  
**Channels nanti:** `canvassing` (order capture), `ecommerce` (storefront)

> **Keputusan inti:** Satu modul Promotions melayani dua jalur waktu — **sell-time** (harga/diskon saat jual) dan **trade accrual** (volume/rebate pasca-periode) — dengan scope lokasi **global menimpa lokal**, setup global hanya admin, setup site oleh `warehouse_head` / `warehouse_manager`.

---

## 0. Problem & Opportunity

### Problem
Tiga mekanisme harga hidup terpisah: katalog `products.price`, price list Sales, dan Trade Promotions (hanya accrual dari DO). POS tidak punya promo. Promo lokal per toko tidak bisa dikonfigurasi dengan aman.

### Opportunity
Kontrak pricing tunggal yang dipanggil setiap channel jual produk, plus trade programs yang membaca omzet lintas channel.

### Personas
| Persona | Kebutuhan |
|---|---|
| **Admin pusat** | Promo nasional / brand; override toko |
| **Warehouse head / manager** | Promo lokal untuk site yang diampu |
| **Kasir / sales** | Harga akhir benar tanpa menghitung manual |
| **Finance** | Audit aplikasi promo + settlement trade |

---

## 1. Channel penjualan (referensi)

| Channel | Module | Dokumen jual | Status | Pakai promo sell-time |
|---|---|---|---|---|
| Sales Order B2B | `sales` | SO → GIN → Invoice | Ready | Ya (fase 1.0+) |
| POS kasir | `pos` | `pos_sales` | MVP ready | Ya (fase 1.0) |
| DO + Billing | `orders`+`billing` | DO + tariff | Ready | Tidak (bukan harga SKU); opsional sumber trade qty |
| Canvassing | `canvassing` | Visit saja | Visit only | Setelah order→SO |
| Rental | `rental` | Booking armada | Ready | Di luar scope SKU |
| Ecommerce | — | — | Belum ada | Setelah storefront; konsumsi kontrak yang sama |

**Urutan implementasi yang disepakati:** kontrak + POS/SO dulu; **bukan** storefront ecommerce dulu.

---

## 2. Dua jalur promotions

### A. Sell-time (checkout)
Dipanggil **sebelum commit** transaksi.

```
PromotionPricing::quote(CartContext): QuoteResult
```

**CartContext:** `channel` (`pos`|`sales`|…), `warehouse_id`, `partner_id?`, `lines[]` (product_id, qty, unit_price base), `at`

**QuoteResult:** per line `unit_price`, `line_discount`, `applied_program_ids[]`; nota `discount_total`; optional `free_lines[]`

### B. Trade accrual (existing, diperluas)
Program `volume_discount` / `free_goods` / `rebate` — sync pasca-periode.

**Fase 1.1:** sumber transaksi digabung: SO delivered + POS completed (+ opsi DO).  
**Fase 2.0:** settle → credit note (rebate/discount) atau draft SO free goods; laporan checkout per channel/site.

---

## 3. Scope lokasi (terkunci)

| Aturan | Keputusan |
|---|---|
| Precedence | **Global menimpa lokal** pada SKU/mekanisme yang bentrok. Lokal hanya jika tidak ada global aktif yang cover item tersebut. |
| Setup global | **Hanya admin** (`User::isAdmin()`). |
| Setup site | `warehouse_manager` dan `warehouse_head`, terbatas warehouse di `AccessibleWarehouses`. Tidak boleh set `scope=global`. |
| Gudang Pusat / kind | **Ikuti scope.** Semua `WarehouseKind` (`warehouse`, `store`, `showroom`) boleh menjadi target; tidak ada exclude otomatis. |

### Resolve contoh
- Global: Indomie −10%  
- Lokal Menteng: Indomie −15%  
→ Kasir Menteng: **−10%** (global menang).  
- Lokal Menteng: Teh Botol −Rp500 (tanpa global bentrok) → **−Rp500**.

### Data
- `trade_promo_programs.scope` = `global` | `sites`
- Pivot `trade_promo_program_warehouses` (wajib ≥1 warehouse jika `sites`)
- `mode` = `trade` | `checkout`
- `channels` JSON untuk checkout, default `["pos","sales"]`

---

## 4. Model & tabel (fase 1.0)

### Extend `trade_promo_programs`
| Kolom | Keterangan |
|---|---|
| `mode` | `trade` (default) \| `checkout` |
| `scope` | `global` (default) \| `sites` |
| `channels` | JSON nullable; dipakai mode checkout |

### `trade_promo_program_warehouses`
`trade_promo_program_id`, `warehouse_id` (+ unique)

### `promo_applications` (audit sell-time)
| Kolom | Keterangan |
|---|---|
| `trade_promo_program_id` | FK |
| `source_type` | `pos_sale` \| `sales_order` \| … |
| `source_id` | id dokumen |
| `product_id` | nullable untuk nota-level |
| `discount_amount` | decimal |
| `meta` | JSON snapshot (percent, base price, …) |
| timestamps | |

### Checkout offer (MVP)
Mode `checkout` memakai **satu tier** (atau kolom tier pertama):
- `discount_percent` **atau** `discount_amount` per unit  
- `min_qty` opsional  
- Scope produk: pivot products (kosong = semua produk aktif — hati-hati; MVP wajib product_ids)

Type baru: `checkout_discount` (bukan volume/rebate).

Trade types tetap: `volume_discount`, `free_goods`, `rebate`.

---

## 5. Algoritma quote (MVP)

1. Ambil program `mode=checkout`, `status=active`, window aktif, `channels` mengandung channel.  
2. Filter scope: `scope=global` **atau** (`scope=sites` ∧ warehouse_id ∈ pivot).  
3. Untuk tiap line product:  
   a. Cari kandidat global yang cover product → pilih priority (terbaru / id terbesar) → **apply, skip lokal**.  
   b. Else cari kandidat lokal → apply.  
4. `line_discount` = percent × (qty×unit) atau amount×qty.  
5. Base `unit_price` dari channel (POS: catalog; SO: price list lalu catalog) — promo **tidak** mengganti list price di MVP, hanya menambah diskon baris.

Stack antar dua global: satu pemenang per line (tidak sum).

### BOGO / Bundle (1.2)
- `checkout_bogo`: `min_qty` = buy qty, `free_qty` = gratis per set; `line_discount = floor(qty/buy) * free * unit_price` (SKU sama).
- `checkout_bundle`: semua produk di pivot harus ada di cart (qty ≥ `min_qty`); lalu `discount_percent` / `discount_amount` per line yang match.
- Channel `canvassing` tersedia untuk checkout.

### Canvassing → SO (1.2)
Portal visit: capture line item → `canvassing_visit_order_items` → **Create draft SO** (`VisitOrderToSalesOrderConverter`). Soft-depend `sales`. Promo channel `canvassing` (fallback `sales`).

---

## 6. Permissions

| Aksi | Siapa |
|---|---|
| `promotions.view` | Lihat program (site user: lihat global + site mereka) |
| `promotions.create/update` | Admin: semua. WH head/mgr: hanya `scope=sites` + warehouse accessible |
| `promotions.delete` | Admin, atau creator site dalam batasan accessible |
| `promotions.settle` | Admin / finance (trade awards) |

Middleware FormRequest: tolak `scope=global` jika `!isAdmin()`.

---

## 7. Integrasi channel

### POS
- Terminal load active checkout quotes per catalog (atau hitung client dari props `activePromos`).  
- `PosSaleService::complete` wajib `PromotionPricing::quote` server-side; isi `line_discount`, `discount_total`, tulis `promo_applications`.  
- Soft depend: jika modul promotions belum terpasang, skip (harga katalog).

### Sales
- Create/update SO: `SalesOrderPromotionApplier` quotes channel `sales` + `warehouse_id`, menulis `line_discount` / `discount_total`, lalu `promo_applications` (`source_type=sales_order`).  
- Invoice & return credit memakai `netUnitPrice()` (harga setelah diskon).  
- Price list tetap dijalankan **sebelum** promo % (base price di form).

### Trade sync (1.1)
`PromoRealizationService` agregasi dari:
- DO (existing, **hanya scope global** — DO tanpa kolom warehouse)
- SO: `quantity_delivered > 0`, status bukan draft/cancelled; nilai = harga transaksi neto (proporsi `line_discount`)
- POS: `status=completed` **dan** `partner_id` terisi; nilai = `line_total`

Program `sites`: filter warehouse SO/POS via pivot; DO di-skip.

### Settlement & reports (2.0)
- Settle rebate/discount → issued credit note (invoice negatif), soft-depend `invoicing`.
- Settle free goods → draft SO qty gratis @ harga 0, soft-depend `sales`.
- Tanpa modul target: settle flag-only (`settlement_type=manual`).
- Laporan `/promotions/reports`: diskon checkout per channel & site; ringkasan award accrued/settled.

---

## 8. UI

- Program Create/Edit: mode Trade | Checkout; scope Global | Sites (+ multi Select warehouse); channels checkbox untuk checkout.  
- Index: filter mode/scope; badge Global / Sites.  
- WH user: form scope terkunci `sites`, warehouse options = accessible only.  
- Show: daftar warehouse, applications count (nanti).

---

## 9. Roadmap

| Fase | Isi |
|---|---|
| **0** | Dokumen ini + keputusan scope |
| **1.0** | Schema scope/mode/applications; `PromotionPricing`; wire POS; form scope + role guards; tests |
| **1.0b** | Wire Sales Order lines — **done** |
| **1.1** | Trade accrual baca SO+POS; price list di POS bila partner — **done** |
| **1.2** | BOGO/bundle; Canvassing→SO — **done** |
| **2.0** | Settlement money/documents; reporting per channel/site — **done** |

### Out of scope 1.0
- Ecommerce storefront  
- Offline POS promo sync  
- Multi-promo stack pada satu line  
- Auto credit note  

---

## 10. Testing (1.0)

- Admin dapat create global checkout; WH head tidak.  
- WH head create sites promo hanya warehouse accessible.  
- Quote: global overrides local pada product sama.  
- POS complete menulis line_discount + promo_applications dan total benar.  
- SO create menulis line_discount + promo_applications dan total benar.  
- Tanpa modul promotions / tanpa program aktif: perilaku POS/SO lama.

---

## 11. Keputusan tersimpan (changelog desain)

| # | Keputusan | Tanggal |
|---|---|---|
| 1 | Ecommerce **tidak** didahulukan sebelum redesign promotions | 2026-07-28 |
| 2 | Global **menimpa** lokal | 2026-07-28 |
| 3 | Global = admin; site = warehouse_head + warehouse_manager | 2026-07-28 |
| 4 | Gudang Pusat / semua kind **ikut scope** | 2026-07-28 |
