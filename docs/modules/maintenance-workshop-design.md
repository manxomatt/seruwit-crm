# Maintenance Workshop Extension — Design Document

**Module key:** `maintenance` *(extend — bukan modul baru)*  
**Tier:** Foundation  
**Hard depends on:** `fleet`  
**Soft depends on:** `inventory` (parts), `partners` (vendor bengkel), `approvals` (opsional WO besar)  
**Packs yang terpengaruh:** `rental_mobil`, `travel_shuttle` (sudah include maintenance)

**Verdict:** Jangan buat modul `workshop`. Perluas Maintenance dengan **Work Order sebagai single source of truth** untuk semua aktivitas servis armada (in-house & outsource).

---

## 0. Problem & Opportunity

### Problem hari ini
1. `vendor_name` / `mechanic_name` hanya string — tidak bisa laporan per bengkel/mekanik, tidak terhubung Partner/User.
2. Tidak ada kapasitas bengkel: bay/stall, antrian, WIP board.
3. Fleet punya `vehicle_maintenance_logs` paralel — riwayat ganda, biaya tidak sinkron dengan WO.
4. Schedule preventive tidak otomatis jadi WO / alert (sudah terdokumentasi di fleet-compliance).
5. Belum ada analytics biaya perawatan per kendaraan / kategori.

### Opportunity
Jadikan Maintenance **ops floor + fleet upkeep** dalam satu modul:
- Dispatcher melihat antrian & bay
- Mekanik punya assignment jelas
- Owner melihat biaya & downtime armada
- Rental/Shuttle tetap pakai pack yang sama tanpa modul baru

### Personas
| Persona | Kebutuhan |
|---|---|
| **Fleet / Ops admin** | Buat WO, approve, assign bay/mekanik, lihat overdue |
| **Mekanik / Kepala bengkel** | WIP board, update status, catat parts & labor |
| **Owner / Finance** | Biaya per unit, vendor spend, downtime |
| **Dispatcher rental/shuttle** | Tahu unit mana di bengkel, ETA selesai |

---

## 1. Product Principles

1. **Work Order is SSOT** — semua servis masuk WO; Fleet log menjadi mirror/read-only atau di-deprecate bertahap.
2. **Extend, don’t fork** — bay, mechanic, vendor, checklist menempel di `work_orders`, bukan tabel “workshop_jobs” paralel.
3. **Soft integrations** — Partner/Inventory optional; string fallback tetap hidup jika modul belum terpasang.
4. **In-house first, outsource second** — bay & mechanic untuk bengkel sendiri; Partner vendor untuk outsource.
5. **One job per screen** — WIP board ≠ form WO ≠ analytics.
6. **Phased delivery** — P0 foundation → P1 shop floor → P2 automation & analytics.

---

## 2. Scope by Phase

### P0 — Foundation (harus sebelum shop floor)
- Link **vendor** → `partners` (nullable FK) + keep `vendor_name` denormalized fallback
- Link **mechanic** → `users` (nullable FK) + keep `mechanic_name` fallback
- Sync **vehicle status**: `in_progress` → `vehicles.status = maintenance`; `completed|cancelled` → restore previous / `active` (lihat §5)
- Bridge: saat WO completed, upsert ringkasan ke `vehicle_maintenance_logs` **atau** ganti tab Fleet “Maintenance logs” menampilkan WO history (rekomendasi: **ganti UI Fleet** baca dari WO; stop create manual log baru)
- Menu: tetap Dashboard / Work Orders / Schedules / Categories; tambah submenu nanti di P1
- Permission baru: tidak wajib di P0 (`approve` sudah ada)

### P1 — Shop floor
- Master **Bays** (`maintenance_bays`): kode, nama, aktif, urutan
- WO: `bay_id`, `assigned_mechanic_id`, `estimated_hours`, `actual_hours`, `service_location` (`in_house` \| `outsource`)
- **WIP Board** page: kolom status (pending / approved / in_progress / waiting_parts) drag atau quick-action
- **Bay calendar** sederhana (hari ini + 7 hari): WO terjadwal per bay
- Checklist / job card lines opsional: `work_order_checklist_items` (template per category)
- Print job card (PDF/thermal-friendly A5)
- Permission: `assign`, `manage_bays` (atau reuse `update` + `create` untuk master bay)

### P2 — Automation & intelligence
- Command `maintenance:scan-due` + notifikasi (dari fleet-compliance design)
- Setting `maintenance.auto_create_wo` → draft WO dari schedule due
- Cost analytics page: biaya parts+labor per vehicle / category / period
- Downtime report: jam unit di status maintenance
- Optional: reserve stock (soft allocate) saat WO approved, deduct on complete (sudah ada deduct)

### Out of scope (sengaja)
- Bengkel multi-customer / jasa umum (bukan armada sendiri) → produk terpisah di masa depan
- Time clock GPS mekanik
- IoT bay sensors
- Marketplace sparepart

---

## 3. Domain Model

### Existing (keep)
```
maintenance_categories
work_orders
work_order_items          # part | labor | other (+ product_id, warehouse_id soft)
maintenance_schedules
```

### P0 additions on `work_orders`
| Column | Type | Notes |
|---|---|---|
| `vendor_partner_id` | FK nullable → partners | Soft: ignore if partners uninstalled |
| `mechanic_user_id` | FK nullable → users | Assigned internal mechanic |
| `service_location` | string | `in_house` \| `outsource` default `in_house` |
| `vehicle_status_before` | string nullable | Snapshot untuk restore saat selesai |

`vendor_name` / `mechanic_name` **tetap** — diisi otomatis dari relasi saat save, atau manual jika tanpa Partner/User.

### P1 new tables

**`maintenance_bays`**
- `id`, `code` (unique), `name`, `is_active`, `sort_order`, timestamps

**`work_orders` additions**
- `bay_id` FK nullable
- `estimated_hours` decimal nullable
- `actual_hours` decimal nullable
- `waiting_parts` boolean default false *(atau status turunan — lihat §4)*

**`work_order_checklist_items`** (opsional P1)
- `work_order_id`, `label`, `is_done`, `done_at`, `sort_order`

**`maintenance_checklist_templates`** (opsional P1.5)
- `category_id`, `label`, `sort_order` — di-copy ke WO saat create

### Relationships (target)
```
Vehicle 1─* WorkOrder *─1 MaintenanceCategory
WorkOrder *─1 Bay?
WorkOrder *─1 User? (mechanic)
WorkOrder *─1 Partner? (vendor)
WorkOrder 1─* WorkOrderItem
WorkOrder 1─* ChecklistItem
MaintenanceSchedule *─1 Vehicle
```

---

## 4. Status & Workflow

### Keep existing primary status
```
draft → pending → approved → in_progress → completed
                              ↘ cancelled
```

### Shop-floor flags (jangan pecah status berlebihan)
- `waiting_parts` boolean saat `in_progress` — muncul di kolom WIP “Menunggu parts”
- Jangan tambah 10 status baru; board memakai status + flag

### State side-effects
| Transition | Side effect |
|---|---|
| → `in_progress` | Set `started_at`; set vehicle `maintenance`; simpan `vehicle_status_before` sekali |
| → `completed` | Set `completed_at`; deduct stock (existing); update schedule last_service_*; restore vehicle status; mirror/hide fleet log |
| → `cancelled` | Reverse stock jika sudah deduct; restore vehicle status |
| → `approved` | (P2) optional soft-reserve parts |

### Concurrency
- Satu vehicle **satu** WO `in_progress` aktif (validasi) — cegah double workshop
- Satu bay **satu** WO `in_progress` (validasi P1) — opsional configurable

---

## 5. Fleet Integration

### Vehicle status
Gunakan `Vehicle::STATUS_MAINTENANCE` yang sudah ada. Jangan invent status `in_workshop` baru.

### `vehicle_maintenance_logs`
**Keputusan:** deprecate write-path manual di Fleet UI.

| Fase | Tindakan |
|---|---|
| P0 | Tab Fleet Vehicles → Show: section “Riwayat servis” query dari `work_orders` completed; hide form create log jika Maintenance installed |
| P1 | Hapus route create/update log dari menu utama (keep API destroy untuk cleanup legacy) |
| P2 | Optional migrate legacy logs → WO archived / read-only archive table |

Transportation report yang baca `VehicleMaintenanceLog` harus diganti aggregate dari WO costs (P2).

---

## 6. Soft Module Integration

| Module | Behavior if installed | If not |
|---|---|---|
| **Partners** | Vendor picker (supplier/workshop type); spend report by partner | Free-text `vendor_name` only |
| **Inventory** | Part lines + deduct on complete (existing) | Labor/other lines only; no stock |
| **Products** | Via inventory part picker | — |
| **Approvals** | Optional gate for WO estimated_cost > threshold | Use built-in `approve` permission |

Jangan hard-require Partners — banyak tenant rental kecil outsource tanpa master partner lengkap.

---

## 7. Information Architecture (UI)

### Nav (setelah P1)
```
Maintenance
├── Dashboard          (existing + WIP counts, due schedules)
├── WIP Board          (P1) — primary daily screen for shop
├── Work Orders        (list/filter/CRUD)
├── Bays               (P1 master)
├── Schedules
├── Categories
└── Analytics          (P2)
```

### WIP Board composition
- Kolom: Pending approval | Approved (queued) | In progress | Waiting parts | Done today
- Card: plate number, WO ref, bay, mechanic, priority, ETA
- Quick actions: Start / Waiting parts / Complete (permission-aware)
- Filter: bay, mechanic, priority

### Work Order form changes
- Service location toggle: In-house / Outsource
- In-house: bay + mechanic user select
- Outsource: partner vendor select (+ invoice number existing)
- Checklist section (P1)
- Hours estimated/actual (P1)

### Visual direction (align existing app chrome)
Ikuti design system tenant (Tailwind + existing layouts). WIP board: kanban columns, bukan dashboard card soup. Satu aksen status (pending/amber, in_progress/blue, waiting/orange, done/green) — flat, no glow.

---

## 8. Permissions

| Action | P0 | P1 | Notes |
|---|---|---|---|
| `view` | ✓ | ✓ | |
| `create` | ✓ | ✓ | |
| `update` | ✓ | ✓ | includes checklist tick |
| `delete` | ✓ | ✓ | |
| `approve` | ✓ | ✓ | |
| `assign` | — | ✓ | set bay/mechanic |
| `manage_bays` | — | ✓ | CRUD bays |

Mekanik role tipikal: `view` + `update` (+ `assign` jika kepala bengkel).

---

## 9. Automation (P2 detail)

### `php artisan maintenance:scan-due`
1. Active schedules
2. Mileage: `vehicle.odometer_km + alert_km_before >= next_service_odometer`
3. Calendar: `next_service_date <= today + alert_days_before`
4. Notify users with `maintenance,view`
5. If `auto_create_wo` and **overdue**: create draft WO (dedupe: jangan dobel jika open WO sama category+vehicle sudah ada)

### Settings
| Key | Default | |
|---|---|---|
| `maintenance.alert_km_before` | 500 | |
| `maintenance.alert_days_before` | 14 | |
| `maintenance.auto_create_wo` | false | |
| `maintenance.single_active_wo_per_vehicle` | true | |
| `maintenance.single_active_wo_per_bay` | true | |

---

## 10. Analytics (P2)

- Cost by vehicle (labor + parts) period
- Cost by category
- Vendor spend (partner)
- Average downtime hours (started_at → completed_at) while vehicle maintenance
- Schedule compliance: % preventive done on time

Reuse dashboard patterns dari modul lain; jangan chart-spam di P0/P1.

---

## 11. Data Migration / Compatibility

1. Backfill: tidak wajib — FK baru nullable
2. Existing WO: `service_location = in_house` jika mechanic_name filled; else biarkan null→default in_house
3. Feature detect Partners/Inventory di form props Inertia (pattern modul lain)
4. Tests: extend `MaintenanceCrudTest`, `WorkOrderStockDeductionTest`; tambah `WorkOrderVehicleStatusTest`, `WipBoardTest`, `MaintenanceScanDueTest`

---

## 12. Implementation Order (recommended sprints)

| Sprint | Deliverable | Why first |
|---|---|---|
| **S1** | P0 FKs + vehicle status sync + Fleet UI baca WO | Hilangkan dual history; fondasi aman |
| **S2** | Bays + assign fields + WIP Board | Shop floor value segera terasa |
| **S3** | Checklist + job card print + bay calendar | Operasional harian |
| **S4** | scan-due + auto WO + settings | Preventive loop tertutup |
| **S5** | Analytics + report migration dari VehicleMaintenanceLog | Owner insight |

---

## 13. Non-goals & Risks

| Risk | Mitigasi |
|---|---|
| Modul Workshop terpisah diminta sales | Desain ini = jawaban; workshop = capability Maintenance |
| Overbuild kanban | WIP Board P1 hanya 5 kolom + quick action |
| Partner wajib | Soft FK + fallback string |
| Downtime vehicle salah restore | Simpan `vehicle_status_before`; jangan hardcode selalu `active` |
| Double stock deduct | Tetap pakai `stock_deducted_at` existing |

---

## 14. Open Questions (perlu keputusan produk)

1. Apakah **satu tenant bisa punya multi-lokasi bengkel** (site), atau bay cukup flat list? → MVP: flat; site nanti jika multi-warehouse workshop.
2. Mekanik = User wajib punya role tertentu, atau cukup permission `update`?
3. Saat outsource, apakah vehicle status tetap `maintenance`? → **Ya** (unit tidak available).
4. Checklist template per category wajib di P1 atau P1.5? → Rekomendasi **P1.5**.

---

## 15. Success Metrics

- % WO in-house dengan mechanic_user_id terisi
- Waktu rata-rata approved → completed
- Zero divergensi: tidak ada vehicle `maintenance` tanpa open WO in_progress
- Fleet vehicle show: 100% riwayat dari WO (bukan log manual baru)
