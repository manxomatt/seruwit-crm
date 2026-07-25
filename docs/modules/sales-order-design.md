# Sales Orders (SO) + Goods Issue Note (GIN)
## Module Design Document

**Module key:** `sales` (modul baru, Foundation)  
**Depends on:** `partners`, `products`, `inventory`  
**Soft depends on:** `invoicing` (buat invoice dari SO bila modul terpasang), `receivables` / `approvals` (credit limit & override — pola yang sama dengan Invoicing)  
**Tidak bergantung pada:** `orders`, `outbound`, `transportation`, `billing` (vertikal logistik — sengaja dipisah)

**New tables (MVP):** 4 · **New pages:** 5 · **Estimasi file inti:** ~18

Mirror operasional Purchasing:

| Purchasing (inbound) | Sales (outbound) |
|---|---|
| Purchase Order (PO) | Sales Order (SO) |
| Good Receipt Note (GRN) | Goods Issue Note (GIN) |
| Stock `in` saat GRN confirm | Stock `out` saat GIN confirm |
| Supplier (`supplier_rank > 0`) | Customer (`customer_rank > 0`) |

> **Penamaan UI:** GIN di gudang = “Pengeluaran Barang”; cetakan opsional bisa berlabel “Surat Jalan Penjualan”. Jangan disamakan dengan `DeliveryOrder` modul Orders (logistik).

---

## 0. Tujuan & Batasan MVP

### Tujuan
Menutup siklus dagang setelah stok masuk via PO/GRN:

**Partner customer → SO → GIN (stock out) → Invoice (opsional) → (Receivables belakangan)**

### In scope (MVP)
- CRUD SO + status lifecycle
- Multi-UOM via `product_packaging_id` (konversi ke qty dasar saat stock out — sama pola GRN)
- GIN partial / full terhadap sisa SO
- Default lokasi pengeluaran ke `STOCK` (fallback sama `GrnConfirmationService::resolveStockLocationId`)
- Void GIN confirmed (reverse stock + rollback qty SO)
- Tombol “Buat Invoice” dari SO (jika Invoicing terpasang): 1 SO → 1 draft invoice, line morph ke item SO
- Soft credit-limit check saat confirm SO (jika `CreditLimitChecker` tersedia)

### Out of scope (fase berikutnya)
- Quotation / penawaran
- Sales return / RMA
- Reserve stok saat SO confirm (generalisasi `stock_reservations` yang hari ini terikat `delivery_order_*`)
- Integrasi Outbound pick/pack atau Transportation trip
- Partial invoice per GIN
- Pricing rules / Trade Promotions / Canvassing
- Cetak PDF SO/GIN (bisa menyusul seperti saran cetak GRN)
- Update `product.cost` (itu milik inbound); harga jual tidak mengubah cost

### Keputusan desain penting: reservation ditunda
`stock_reservations` saat ini wajib `delivery_order_id` + `delivery_order_item_id`. Memaksa SO memakai itu akan menarik ketergantungan ke Orders (Vertical) atau memaksa refactor Inventory di tengah MVP.

**MVP:** tidak reserve. Ketersediaan dicek **keras** saat GIN confirm (dan **lunak**/peringatan saat SO confirm).  
**Fase 1.1:** generalisasi reservation (polimorfik / nullable SO FK) tanpa merusak flow DO.

---

## 1. Entity Relationship

### `sales_orders`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `partner_id` | FK → partners | Customer (`customer_rank > 0`) |
| `warehouse_id` | FK → warehouses | Gudang sumber pengeluaran |
| `created_by` | FK → users | |
| `so_number` | varchar unique | Auto-generate: `SO-{YYYY}-{SEQ}` |
| `status` | string/index | lihat §2 |
| `ordered_at` | date | Tanggal order |
| `promised_at` | date nullable | Estimasi kirim / janji serah |
| `notes` | text nullable | |
| `total_amount` | decimal(15,2) | Sum line (bukan input user) |
| `timestamps` | | |

### `sales_order_items`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `sales_order_id` | FK → sales_orders (cascadeDelete) | |
| `product_id` | FK → products | |
| `product_packaging_id` | FK → product_packagings nullable | UOM order; null = satuan dasar |
| `quantity_ordered` | decimal(10,2) | Dalam UOM baris |
| `quantity_delivered` | decimal(10,2) default 0 | Diupdate saat GIN confirm / void |
| `unit_price` | decimal(15,2) | Harga per UOM baris |
| `unit` | varchar(30) nullable | Label tampilan (Karton, pcs, …) |
| `notes` | text nullable | |
| `timestamps` | | |

Helper:
- `remainingQuantity()` = `max(0, ordered − delivered)`
- `lineTotal()` = `ordered × unit_price`
- `toBaseQuantity($qty)` = `$qty × (packaging.qty ?: 1)` — dipakai di GIN confirm

### `goods_issue_notes`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `sales_order_id` | FK → sales_orders | |
| `warehouse_id` | FK → warehouses | Boleh sama dengan SO; validasi lokasi harus milik gudang ini |
| `issued_by` | FK → users nullable | |
| `gin_number` | varchar unique | Auto-generate: `GIN-{YYYY}-{SEQ}` |
| `status` | string/index | `draft` · `confirmed` · `voided` |
| `issued_at` | date | Tanggal pengeluaran |
| `delivery_note_number` | varchar nullable | No. SJ eksternal / referensi kurir (opsional) |
| `notes` | text nullable | |
| `timestamps` | | |

### `goods_issue_note_items`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `goods_issue_note_id` | FK → goods_issue_notes (cascadeDelete) | |
| `so_item_id` | FK → sales_order_items | |
| `location_id` | FK → warehouse_locations nullable | Bin sumber; default `STOCK` |
| `quantity_issued` | decimal(10,2) | Dalam UOM baris SO (bukan base) |
| `batch_number` | varchar nullable | Opsional; alokasi FEFO boleh diisi recorder |
| `expiry_date` | date nullable | |
| `notes` | text nullable | |
| `timestamps` | | |

---

## 2. Status Machine

### Sales Order

```
[draft] → [confirmed] → [partial_delivered] → [fully_delivered] → [closed]
              ↓
         [cancelled]
```

| Transisi | Trigger |
|---|---|
| `draft` → `confirmed` | User confirm SO (harga/qty terkunci; credit check lunak) |
| `confirmed` → `partial_delivered` | GIN pertama confirmed, masih ada sisa |
| `partial_delivered` → `fully_delivered` | Semua item `quantity_delivered ≥ quantity_ordered` |
| `fully_delivered` → `closed` | User menutup / arsip |
| `draft` / `confirmed` → `cancelled` | Cancel; **dilarang** jika sudah ada GIN non-voided |
| Auto re-calc | Setiap GIN confirm/void — bisa kembali ke `confirmed` jika semua delivery di-void |

> Status `partial_delivered` / `fully_delivered` dihitung otomatis oleh `GinConfirmationService` — tidak ada action manual.

### Goods Issue Note

```
[draft] → [confirmed]
              ↓
          [voided]
```

- `confirmed`: jalankan stock out + increment `quantity_delivered`
- `voided`: stock in reverse (`source_type=gin_void`) + decrement `quantity_delivered`; dilarang jika SO sudah `closed`

---

## 3. Business Logic

### 3.1 `GinConfirmationService` (di modul Sales)

File: `modules/Sales/Support/GinConfirmationService.php`

#### `confirm(GoodsIssueNote $gin)`
Dalam `DB::transaction`:

1. Validasi GIN masih `draft` dan punya items
2. Resolve default lokasi `STOCK` bila `location_id` null
3. Untuk setiap item:
   1. Load SO item + packaging
   2. Validasi qty tidak melebihi sisa SO (defense in depth; Form Request sudah cek)
   3. `baseQty = toBaseQuantity(quantity_issued, soItem)`
   4. `StockMovementRecorder::record()`:
      - `type: 'out'`
      - `quantity: baseQty`
      - `source_type: 'gin'`
      - `source_id: $ginItem->id`
      - `reference_code: $gin->gin_number`
      - `warehouse_id`, `location_id`, `batch_number`, `expiry_date`
      - `allocate: true` (default) — FEFO/batch allocation bawaan recorder
   5. Persist `location_id` jika sebelumnya null
   6. Increment `sales_order_items.quantity_delivered` sebesar `quantity_issued` (UOM order)
4. Set GIN `confirmed`
5. Recalculate status SO
6. `LowStockNotifier::checkAndNotify()`

#### `void(GoodsIssueNote $gin)`
Mirror `GrnConfirmationService::void`:

1. Hanya `confirmed`; tolak jika SO `closed`
2. Untuk tiap inbound movement `source_type=gin` + `source_id=ginItem.id`, catat movement `type=in` dengan `source_type=gin_void`, `allocate: false`
3. Decrement `quantity_delivered` (floor 0)
4. Set GIN `voided`
5. Recalculate SO status (boleh kembali `confirmed`)

### 3.2 Confirm Sales Order

`SalesOrderConfirmationService` atau method di controller/service tipis:

1. Status harus `draft`, minimal 1 item
2. Soft stock check (opsional MVP): untuk tiap item, bandingkan `toBaseQuantity(remaining)` vs available `(on_hand − reserved)` di `warehouse_id` — bila kurang, **boleh tetap confirm** dengan flash warning *atau* hard-block via setting; **rekomendasi MVP: hard-block** agar tidak menumpuk SO yang tidak bisa dikirim
3. Credit limit: jika `CreditLimitChecker::wouldExceed(partner, total)` → error / Approvals gate (copy pola `InvoiceController::issue`)
4. Status → `confirmed`

Tidak ada stock movement di langkah ini.

### 3.3 Create Invoice dari SO

Hanya jika `Modules::available('invoicing')` / tabel `invoices` ada:

1. SO status ∈ `{confirmed, partial_delivered, fully_delivered}`
2. Belum ada invoice line dengan `source_type` = morph class `SalesOrder` **atau** policy “satu invoice aktif per SO” (cek via invoice lines morph ke SO / SO item)
3. Buat `Invoice` draft: partner = SO partner, issue_date = today
4. Untuk tiap SO item: `InvoiceLine` dengan:
   - `description` = snapshot `"SO-… — {product name} × {qty} {unit}"`
   - `amount` = line total
   - `source` = morph ke `SalesOrderItem` (atau satu line agregat morph ke `SalesOrder` — **rekomendasi: per item** agar audit jelas)
5. `recalculate()` invoice
6. Redirect ke show invoice (user issue/pay di modul Invoicing)

**MVP:** invoice penuh atas qty ordered (bukan qty delivered). Partial bill per GIN = fase berikutnya.

### 3.4 Ketersediaan stok saat GIN confirm

`StockMovementRecorder` sudah melempar jika stok tidak cukup. Tangkap `RuntimeException` → flash error, GIN tetap draft. Tidak perlu logika alokasi custom di Sales kecuali ingin pre-check pesan lebih ramah.

---

## 4. Validasi

### Store / Update Sales Order
```
partner_id          required, customer_rank > 0
warehouse_id        required, exists:warehouses
ordered_at          required, date
promised_at         nullable, date, after_or_equal:ordered_at
items               required, min:1
items.*.product_id  required, exists:products
items.*.product_packaging_id  nullable, exists + belongs to product
items.*.quantity_ordered      required, numeric, min:0.01
items.*.unit_price            required, numeric, min:0
```

Edit hanya saat `draft`.

### Store GIN
```
warehouse_id        required
issued_at           required, date
items.*.so_item_id  required, belongs to SO
items.*.quantity_issued  required, numeric, min:0.01, max: remaining
items.*.location_id nullable, belongs to warehouse
items.*.batch_number / expiry_date  nullable
```

SO harus `canIssue()`: status ∈ `{confirmed, partial_delivered}` dan ada remaining qty.

---

## 5. Module Contract & Routes

### `SalesModule`
```
key: sales
tier: Foundation
permissions: view, create, update, delete, issue
requires: partners, products, inventory
menu: Sales → sales.sales-orders.index · sort_order ~ 92 (dekat Purchasing 91)
```

Daftarkan di `config/modules.php` `registered`.

### Routes (`/module/sales/...`)
```
GET    /sales/sales-orders
GET    /sales/sales-orders/create
POST   /sales/sales-orders
GET    /sales/sales-orders/{so}
GET    /sales/sales-orders/{so}/edit
PATCH  /sales/sales-orders/{so}
DELETE /sales/sales-orders/{so}          # draft only
POST   /sales/sales-orders/{so}/confirm
POST   /sales/sales-orders/{so}/cancel
POST   /sales/sales-orders/{so}/close
POST   /sales/sales-orders/{so}/invoice  # permission create + invoicing available

GET    /sales/sales-orders/{so}/gin/create
POST   /sales/sales-orders/{so}/gin
GET    /sales/gin/{gin}
POST   /sales/gin/{gin}/confirm          # permission:issue
POST   /sales/gin/{gin}/void             # permission:issue
```

---

## 6. Perubahan ke Modul yang Ada

| Area | Perubahan MVP |
|---|---|
| Inventory `StockMovementRecorder` | Tidak wajib ubah; pakai `type=out`, `source_type=gin` / `gin_void` |
| Inventory Stock Movements Index | Deep-link `gin` / `gin_void` via `reference_code` → GIN show (mirror GRN) |
| Invoicing | Tidak ubah schema; Sales menulis line + morph source |
| `stock_reservations` | **Tidak disentuh di MVP** |
| Partners | Filter `customer_rank > 0` di form SO |
| Product packagings | Sama pola PO (load + validate belong-to product) |

### Fase 1.1 (dokumentasikan, jangan kerjakan di MVP)
Generalisasi `stock_reservations`:
- Jadikan `delivery_order_id` / `delivery_order_item_id` nullable
- Tambah `sales_order_id` / `sales_order_item_id` nullable (XOR constraint di aplikasi)
- Atau ganti ke morph `reservable_type/id`
- Extend `StockReservationService` agar menerima kontrak generik, bukan hanya `DeliveryOrder`

---

## 7. Frontend Pages (Inertia React)

| Page | Keterangan |
|---|---|
| `Sales/SalesOrders/Index` | List, filter status, search SO/customer, progress delivered |
| `Sales/SalesOrders/Create` | Header + lines (product, packaging, qty, price), mirror PO Create |
| `Sales/SalesOrders/Edit` | Draft only |
| `Sales/SalesOrders/Show` | Detail, progress, daftar GIN, actions (confirm/cancel/close/GIN/invoice) |
| `Sales/GoodsIssueNotes/Create` | Hanya item bersisa; default lokasi STOCK |
| `Sales/GoodsIssueNotes/Show` | Detail + confirm/void |

Pola UI: ikon, pagination, `SalesNav`, i18n `lang/{en,id}/sales.php` — ikut konvensi Purchasing.

---

## 8. Rencana Implementasi (Urutan)

| # | Task |
|---|---|
| 1 | Scaffold `modules/Sales` + `SalesModule` + register `config/modules.php` |
| 2 | Migrations 4 tabel |
| 3 | Models + factories + enums/status constants |
| 4 | `GinConfirmationService` (+ helpers packaging / STOCK location) |
| 5 | SO confirm/cancel/close + Form Requests |
| 6 | Controllers + routes + permissions/menu seeder via module install |
| 7 | Invoice bridge service (`SalesInvoiceFactory` / method) |
| 8 | Frontend 5–6 pages + translations |
| 9 | Deep-link GIN di Stock Movements Index |
| 10 | Feature tests + `pint` |
| 11 | Install ke tenant majumakmur + demo seeder opsional |

---

## 9. Test Coverage

### SalesOrderTest
- [ ] Admin create SO draft; number `SO-{year}-####`
- [ ] Non-sales permission diblokir
- [ ] Edit/delete hanya draft
- [ ] Confirm: draft → confirmed; empty items ditolak
- [ ] Confirm hard-block jika available stock < base qty
- [ ] Cancel confirmed tanpa GIN OK; dengan GIN confirmed ditolak
- [ ] `total_amount` dari sum items
- [ ] Packaging mismatch product → validation error
- [ ] Create invoice → draft invoice + lines morph ke SO items (skip jika invoicing tidak di test DB — assert dengan module migrations)

### GoodsIssueNoteTest
- [ ] GIN confirm → stock movement `out` / `source_type=gin`, base qty = order qty × packaging.qty
- [ ] `StockLevel.on_hand` turun; `quantity_delivered` naik
- [ ] SO → `partial_delivered` lalu `fully_delivered`
- [ ] Qty > remaining → 422
- [ ] Confirm ulang GIN confirmed → error
- [ ] Default `location_id` = STOCK bila kosong
- [ ] Void → `gin_void` in-movement, qty/SO status rollback
- [ ] Void ditolak jika SO closed

### SalesInvoiceTest (opsional file terpisah)
- [ ] Satu SO tidak bisa digandakan invoice aktif (definisi: ada line morph ke item SO pada invoice non-void)
- [ ] Partner invoice = partner SO

---

## 10. Alur Pengguna (ringkas)

```
[Stok ada via GRN]
       ↓
Buat SO (customer, gudang, items + packaging)
       ↓
Confirm SO ──(stok/credit OK)──→ confirmed
       ↓
Buat GIN (qty kirim ≤ sisa, lokasi STOCK)
       ↓
Confirm GIN → stock out → SO partial/fully delivered
       ↓
Buat Invoice (draft) → Issue/Pay di Invoicing
       ↓
Close SO
```

---

## 11. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Over-commit SO tanpa reservation | Hard-block confirm bila available < kebutuhan; edukasi user partial GIN |
| Race dua GIN bersamaan | Transaction + lock di recorder; sisa dihitung dari DB fresh |
| Bingung dengan Orders/DO | Naming GIN + deskripsi modul; dokumentasi “bukan logistik” |
| Invoice penuh vs barang belum kirim | MVP sadar trade-off; fase next: invoice dari delivered qty |
| Refactor reservation menunda MVP | Eksplisit Fase 1.1 di atas |

---

## 12. Kriteria Siap Implementasi

Design ini siap diimplementasikan bila disetujui:

1. Modul baru `sales` (bukan extend Inventory/Purchasing)  
2. GIN sebagai dokumen stock out (mirror GRN)  
3. Tanpa stock reservation di MVP  
4. Invoice opsional full-order dari SO  
5. Tidak menyentuh Orders/Outbound  

Setelah approval, implementasi mengikuti §8 tanpa menambah scope out-of-scope kecuali diminta eksplisit.
