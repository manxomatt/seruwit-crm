# Purchase Orders (PO) + Good Receipt Note (GRN)
## Module Design Document

**Module:** Inventory (extend)
**Depends on:** Partners, Product, Inventory (StockMovementRecorder, Warehouse, WarehouseLocation)
**New tables:** 4 · **New pages:** 5 · **New files:** ~16

---

## 1. Entity Relationship

### `purchase_orders`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `partner_id` | FK → partners | Supplier (tipe `supplier` atau `both`) |
| `warehouse_id` | FK → warehouses | Gudang tujuan penerimaan |
| `created_by` | FK → users | |
| `po_number` | varchar unique | Auto-generate: `PO-{YYYY}-{SEQ}` |
| `status` | enum | `draft` · `submitted` · `approved` · `partial_received` · `fully_received` · `closed` · `cancelled` |
| `ordered_at` | date | |
| `expected_at` | date nullable | Estimasi tiba |
| `notes` | text nullable | |
| `total_amount` | decimal(15,2) | Dihitung dari sum item (bukan user input) |
| `timestamps` | | |

### `purchase_order_items`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `purchase_order_id` | FK → purchase_orders (cascadeDelete) | |
| `product_id` | FK → products | |
| `quantity_ordered` | decimal(10,2) | |
| `quantity_received` | decimal(10,2) default 0 | Diupdate otomatis saat GRN dikonfirmasi |
| `unit_price` | decimal(15,2) | |
| `unit` | varchar nullable | karton, pack, pcs, dll |
| `notes` | text nullable | |
| `timestamps` | | |

### `good_receipt_notes`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `purchase_order_id` | FK → purchase_orders | |
| `warehouse_id` | FK → warehouses | Bisa beda dari PO warehouse (cross-dock) |
| `received_by` | FK → users | |
| `grn_number` | varchar unique | Auto-generate: `GRN-{YYYY}-{SEQ}` |
| `status` | enum | `draft` · `confirmed` |
| `received_at` | date | |
| `supplier_do_number` | varchar nullable | No. surat jalan supplier |
| `notes` | text nullable | |
| `timestamps` | | |

### `good_receipt_note_items`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `good_receipt_note_id` | FK → good_receipt_notes (cascadeDelete) | |
| `po_item_id` | FK → purchase_order_items | |
| `location_id` | FK → warehouse_locations nullable | Bin tujuan (bisa beda per item) |
| `quantity_received` | decimal(10,2) | |
| `batch_number` | varchar nullable | Untuk lot tracking FMCG |
| `expiry_date` | date nullable | Tanggal kadaluarsa per batch |
| `notes` | text nullable | |
| `timestamps` | | |

---

## 2. Status Machine

### Purchase Order

```
[draft] → [submitted] → [approved] → [partial_received] → [fully_received] → [closed]
                ↓              ↓             ↓
                          [cancelled]   (bisa dari draft / submitted / approved)
```

| Transisi | Trigger |
|---|---|
| `draft` → `submitted` | User klik "Submit ke Supplier" |
| `submitted` → `approved` | User konfirmasi supplier setuju |
| `approved` → `partial_received` | GRN pertama dikonfirmasi, ada item yang belum terpenuhi |
| `partial_received` → `fully_received` | Semua `quantity_received ≥ quantity_ordered` |
| `fully_received` → `closed` | User menutup / mengarsip PO |
| `* → cancelled` | Hanya dari status `draft`, `submitted`, atau `approved` |

> **Auto-transition:** Status `partial_received` dan `fully_received` dihitung ulang secara otomatis oleh `GrnConfirmationService` setiap kali GRN dikonfirmasi — tidak ada action manual.

### Good Receipt Note

```
[draft] → [confirmed]
```

Saat `confirmed`: `GrnConfirmationService` menjalankan seluruh pipeline stock inbound dalam satu DB transaction.

---

## 3. Business Logic: GrnConfirmationService

File: `modules/Inventory/Support/GrnConfirmationService.php`

Urutan eksekusi dalam `DB::transaction`:

1. Validasi GRN masih berstatus `draft`
2. Untuk setiap `GoodReceiptNoteItem`:
   a. Panggil `StockMovementRecorder::record()` dengan:
      - `type: 'in'`
      - `source_type: 'grn'`
      - `source_id: $grnItem->id`
      - `reference_code: $grn->grn_number`
      - `batch_number`, `expiry_date` (jika ada — field baru di StockMovement, lihat §6)
   b. Increment `PurchaseOrderItem.quantity_received` sebesar qty diterima
3. Update `GoodReceiptNote.status = 'confirmed'`
4. Recalculate status PO:
   - Jika semua item `quantity_received ≥ quantity_ordered` → `fully_received`
   - Jika ada yang masih kurang → `partial_received`
5. Panggil `LowStockNotifier::checkAndNotify()` untuk clear alert yang sudah terpenuhi

---

## 4. Validasi (StoreGoodReceiptNoteRequest)

```php
// Per GRN item:
'items.*.po_item_id'         => required, exists:purchase_order_items,id
'items.*.quantity_received'  => required, numeric, min:0.01,
                                 max: (quantity_ordered - quantity_received yang sudah ada)
'items.*.location_id'        => nullable, exists:warehouse_locations,id
'items.*.batch_number'       => nullable, string, max:100
'items.*.expiry_date'        => nullable, date, after:today
```

> **Validasi cross-field:** `quantity_received` tidak boleh melebihi sisa (ordered - sudah diterima di GRN sebelumnya). Ini dicek di `withValidator()`.

---

## 5. Routes (tambah ke InventoryModule.php)

```
GET    /inventory/purchase-orders              → index
GET    /inventory/purchase-orders/create       → create
POST   /inventory/purchase-orders              → store
GET    /inventory/purchase-orders/{po}         → show
PATCH  /inventory/purchase-orders/{po}/submit  → submit
PATCH  /inventory/purchase-orders/{po}/approve → approve
PATCH  /inventory/purchase-orders/{po}/cancel  → cancel
PATCH  /inventory/purchase-orders/{po}/close   → close

GET    /inventory/purchase-orders/{po}/grn/create  → GRN form
POST   /inventory/purchase-orders/{po}/grn         → store GRN
GET    /inventory/grn/{grn}                        → show GRN
POST   /inventory/grn/{grn}/confirm                → confirm (trigger stock in)
```

Semua routes di-gate dengan permission `inventory,update`.

---

## 6. Perubahan ke Modul yang Ada

### StockMovement — tambah 2 kolom (migration baru)

```php
$table->string('batch_number')->nullable()->after('reference_code');
$table->date('expiry_date')->nullable()->after('batch_number');
```

Ini sekaligus menyelesaikan gap **Batch/Lot tracking** dari Fase A tanpa perlu tabel terpisah.

### StockMovementRecorder::record()

Tambah `batch_number` dan `expiry_date` ke array `$data` yang diterima — tidak ada breaking change karena `fillable` di model.

### Partner filter

Di `PurchaseOrderController::create()`, partner di-filter:
```php
Partner::query()->whereIn('type', ['supplier', 'both'])->get()
```

---

## 7. Frontend Pages

| File | Route | Keterangan |
|---|---|---|
| `Inventory/PurchaseOrders/Index.tsx` | `/inventory/purchase-orders` | List + filter status + progress bar per PO |
| `Inventory/PurchaseOrders/Create.tsx` | `/inventory/purchase-orders/create` | Form header + dynamic item rows + grand total |
| `Inventory/PurchaseOrders/Show.tsx` | `/inventory/purchase-orders/{po}` | Detail + item table + GRN list + action buttons |
| `Inventory/GoodReceiptNotes/Create.tsx` | `/inventory/purchase-orders/{po}/grn/create` | Form GRN: hanya tampilkan item yang masih ada sisa |
| `Inventory/GoodReceiptNotes/Show.tsx` | `/inventory/grn/{grn}` | Detail GRN + item per baris + link ke StockMovements |

---

## 8. Rencana Implementasi (Urutan)

| # | Task | File Utama |
|---|---|---|
| 1 | Migration: 4 tabel PO + GRN | `create_purchase_orders_table`, dst |
| 2 | Migration: tambah `batch_number` + `expiry_date` ke `stock_movements` | |
| 3 | Models + Factories: `PurchaseOrder`, `PurchaseOrderItem`, `GoodReceiptNote`, `GoodReceiptNoteItem` | `Inventory/Models/` |
| 4 | Update `StockMovementRecorder` untuk terima `batch_number` + `expiry_date` | `Inventory/Support/StockMovementRecorder.php` |
| 5 | `GrnConfirmationService` | `Inventory/Support/GrnConfirmationService.php` |
| 6 | HTTP layer: controllers + form requests + routes di `InventoryModule.php` | `Inventory/Http/` |
| 7 | Frontend pages (5 halaman) | `Inventory/resources/js/Pages/` |
| 8 | Tests | `tests/Feature/Inventory/PurchaseOrderTest.php`, `GoodReceiptNoteTest.php` |
| 9 | `vendor/bin/pint --dirty --format agent` + `npm run build` | |

---

## 9. Test Coverage

### PurchaseOrderTest
- [ ] Admin bisa buat PO, non-inventory user diblokir
- [ ] PO number auto-generate dengan format benar
- [ ] Status transition: draft → submitted → approved
- [ ] Tidak bisa cancel PO yang sudah `partial_received`
- [ ] Total amount dihitung dari items, bukan input langsung

### GoodReceiptNoteTest
- [ ] GRN confirm → `StockMovement` terbuat dengan `type=in`, `source_type=grn`
- [ ] `StockLevel.on_hand` bertambah sesuai qty diterima
- [ ] `PurchaseOrderItem.quantity_received` ter-update
- [ ] PO status berubah ke `partial_received` setelah GRN pertama (tidak semua terpenuhi)
- [ ] PO status berubah ke `fully_received` setelah semua item terpenuhi
- [ ] Qty yang diterima > sisa → 422 validation error
- [ ] GRN yang sudah `confirmed` tidak bisa diconfirm ulang
- [ ] `batch_number` dan `expiry_date` tersimpan di StockMovement
