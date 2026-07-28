# Accounting (GL) — Module Design Document

**Module key (usulan):** `accounting` (folder `Accounting`)  
**Tier:** Foundation (inti keuangan perusahaan)  
**Depends on:** `partners`  
**Soft depends on:** `invoicing`, `receivables`, `payables`, `sales`, `purchasing`, `inventory`, `pos`, `billing`, `promotions`, `rental`  
**Tidak menggantikan:** dokumen operasional (Invoice, SO, PO, POS). Modul ini **memposting** peristiwa operasional ke buku besar.

> **Verdict saat ini:** Seruwit sudah punya **finance operasional** (jual–beli–tagih–bayar). Belum punya **sistem accounting lengkap** (COA, jurnal, GL, bank, periode, laporan keuangan formal).

---

## 0. Problem & Opportunity

### Problem
Uang sudah tercatat di banyak silo: Invoice/Payment, Supplier Bill, POS shift, uang jalan, promo settlement, product.cost. Tidak ada satu sumber kebenaran akun → tidak bisa menghasilkan Neraca / Laba Rugi / Trial Balance yang diaudit.

### Opportunity
Tambah lapisan **General Ledger** di atas dokumen yang sudah ada, dengan posting otomatis (event-driven) + jurnal manual, tanpa memaksa rewrite Sales/Purchasing.

### Personas
| Persona | Kebutuhan |
|---|---|
| **Controller / Finance** | COA, jurnal, closing, laporan keuangan |
| **AP/AR clerk** | Subledger yang reconcile ke GL |
| **Kasir / kas bank** | Buku kas/bank + rekonsiliasi |
| **Auditor** | Jejak posting dari dokumen sumber |
| **Owner** | P&L, BS, cash flow per periode |

---

## 1. Peta kondisi vs target

| Area | Status sekarang | Target accounting lengkap |
|---|---|---|
| Invoice customer | Ada (`invoicing`) | Post ke AR + Revenue (+ Tax) |
| AR payment | Ada (`receivables`) | Post ke Cash/Bank + clear AR |
| Supplier bill | Ada (`payables`) | Post ke AP + Expense/Inventory |
| Bill payment | Ada (`payables`) | Post ke Cash/Bank + clear AP |
| SO/GIN/PO/GRN | Ada (stock qty + moving avg cost) | Post COGS / Inventory / Accrual |
| POS sale & shift | Ada (cash float) | Post Cash + Revenue; variance → account |
| Promo credit note | Ada | Sudah invoice negatif → post seperti CN |
| Rental invoice | Belum otomatis | Lengkapi dulu, lalu post |
| **Chart of Accounts** | Tidak ada | **Modul baru** |
| **Journal / GL** | Tidak ada | **Modul baru** |
| **Bank book & recon** | Hanya bank partner | **Modul baru** |
| **Fiscal period / close** | Tidak ada | **Modul baru** |
| **Tax books (PPN/PPh)** | Flat `ecommerce.tax_*` | Perluas + mapping akun |
| **Fixed assets** | Fleet ops saja | Opsional fase lanjut |
| **Payroll GL** | Incentive saja | Opsional / modul HR terpisah |
| **Multi-currency** | Tidak | Fase lanjut |
| **Dimensions** (cost center, site) | Warehouse ada | Optional analytic dimensions |

---

## 2. Arsitektur target

```
  ┌─────────────────────────────────────────────────────────────┐
  │                 OPERATIONAL DOCUMENTS (existing)            │
  │  SO/GIN · PO/GRN · Invoice · Payment · Bill · POS · Promo  │
  └────────────────────────────┬────────────────────────────────┘
                               │ AccountingPoster (events)
                               ▼
  ┌─────────────────────────────────────────────────────────────┐
  │              ACCOUNTING MODULE (baru)                       │
  │  COA · Journals · GL lines · Periods · Bank · Reports       │
  └─────────────────────────────────────────────────────────────┘
```

**Prinsip:**
1. **Dokumen operasional tetap master** untuk qty/harga/status.  
2. **GL adalah proyeksi berimbang** (debit = credit) dari peristiwa yang sudah final (issued/confirmed/paid).  
3. Posting **idempotent** per `(source_type, source_id, event)` — void/reverse = jurnal reverse, bukan hapus.  
4. Soft-depend: tenant tanpa Accounting tetap jalan; dengan Accounting = posting aktif.

---

## 3. Modul / fitur yang harus dilengkapi

Urutan = rekomendasi implementasi (lihat §9 Roadmap).

### A. Inti GL — wajib untuk “accounting lengkap”

| # | Fitur / sub-modul | Isi singkat |
|---|---|---|
| **A1** | **Chart of Accounts (COA)** | Kode akun, nama, tipe (asset/liability/equity/revenue/expense), normal balance, parent (hierarchy), aktif/nonaktif, akun kontrol AR/AP/Inventory/Tax |
| **A2** | **Fiscal calendar & period** | Tahun buku, periode bulanan (atau custom), status `open` / `soft_close` / `hard_close`, lock posting |
| **A3** | **Journal entries** | Header + lines (account, debit, credit, partner?, warehouse?, memo); tipe: `manual`, `auto`, `opening`, `closing`, `reversal`; status draft/posted/void |
| **A4** | **General Ledger** | View saldo per akun × periode; drill ke journal lines; running balance |
| **A5** | **Account mapping (posting rules)** | Mapping event → template jurnal (mis. `invoice.issued` → Dr AR / Cr Revenue / Cr Tax Output) per tenant; override per warehouse/channel opsional |
| **A6** | **AccountingPoster service** | Listener/service yang dipanggil dari Invoicing, Receivables, Payables, Sales, Purchasing, POS, Promotions |

### B. Kas & bank — wajib praktis

| # | Fitur | Isi |
|---|---|---|
| **B1** | **Company bank/cash accounts** | Rekening kas/bank perusahaan (bukan `PartnerBankAccount`); link ke COA akun kas |
| **B2** | **Bank transactions** | Mutasi: deposit, withdrawal, transfer antar kas, fee; sumber: payment/bill payment/manual/POS deposit |
| **B3** | **Bank reconciliation** | Statement import (CSV MVP) → match ke transaksi; selisih → jurnal penyesuaian |
| **B4** | **POS cash → bank** | Closing shift: expected cash → setoran ke akun kas toko / bank; variance ke akun selisih kas |

### C. Subledger & recon — wajib kualitas buku

| # | Fitur | Isi |
|---|---|---|
| **C1** | **AR control account** | Saldo GL AR = Σ open invoices − payments (laporan rekonsiliasi) |
| **C2** | **AP control account** | Sama untuk supplier bills |
| **C3** | **Inventory control** | Saldo GL Inventory ≈ valuasi stok (moving avg yang sudah ada) |
| **C4** | **Aging ↔ GL** | Aging Receivables/Payables tetap di modul lama; tambah cek “aging total vs GL” |

### D. Pajak — wajib Indonesia (MVP lalu lengkap)

| # | Fitur | Isi |
|---|---|---|
| **D1** | **Tax codes** | PPN 11%/12%, non-taxable, inclusive/exclusive; ganti ketergantungan tunggal `ecommerce.tax_*` bertahap |
| **D2** | **Tax payable / receivable accounts** | Mapping ke COA (PPN keluaran / masukan) |
| **D3** | **WHT (PPh 23/dst)** | Fase 2 — potong di bill payment / invoice |
| **D4** | **e-Faktur / SPT export** | Fase lanjut (integrasi DJP) — di luar MVP GL |

### E. Laporan keuangan — wajib “lengkap”

| # | Laporan | Sumber |
|---|---|---|
| **E1** | Trial Balance | GL per periode |
| **E2** | Income Statement (P&L) | Revenue & expense accounts |
| **E3** | Balance Sheet | Asset/liability/equity + net income YTD |
| **E4** | Cash Flow (indirect MVP) | Perubahan kas dari GL + klasifikasi |
| **E5** | General Journal / GL detail | Cetak audit |
| **E6** | Partner statement | Dari AR/AP + optional GL |

### F. Persediaan & COGS accounting — sangat disarankan distributor

| # | Fitur | Isi |
|---|---|---|
| **F1** | **Post GRN** | Dr Inventory / Cr GRNI atau AP (jika bill simultaneous) |
| **F2** | **Post GIN / POS stock out** | Dr COGS / Cr Inventory (pakai cost moving average) |
| **F3** | **Opname / adjustment** | Dr/Cr Inventory vs Inventory Adj expense/income |
| **F4** | **Purchase return / sales return** | Reverse inventory & COGS / credit note sudah ada di ops |

### G. Closing & kontrol

| # | Fitur | Isi |
|---|---|---|
| **G1** | **Period soft close** | Blok dokumen opsional; masih boleh jurnal adjusting |
| **G2** | **Hard close** | Tidak ada posting ke periode tertutup kecuali unclose (permission khusus) |
| **G3** | **Year-end closing** | Jurnal penutup income → retained earnings (auto) |
| **G4** | **Opening balances** | Import saldo awal COA + AR/AP open items |

### H. Opsional (fase lanjut, bukan blocker “GL hidup”)

| # | Fitur | Catatan |
|---|---|---|
| **H1** | Fixed assets + depresiasi | Link fleet vehicles sebagai FA |
| **H2** | Budget vs actual | Per akun / cost center |
| **H3** | Cost centers / projects | Analytic dimensions di journal lines |
| **H4** | Multi-currency & FX reval | Setelah IDR stabil |
| **H5** | Payroll posting | Setelah modul HR/payroll |
| **H6** | Intercompany | Multi-entity |
| **H7** | Rental auto-invoice | Lengkapi `rental` dulu, lalu mapping |

### I. Melengkapi finance operasional yang masih bolong (pra/paralel GL)

Sebelum atau bersamaan fase A–B, tutup gap operasional:

| Gap | Aksi |
|---|---|
| Rental → Invoice | Implement create invoice dari rental (modul sudah `requires: invoicing`) |
| Payment terms master | Net 30/45 di partner & invoice/bill due date |
| Giro / clearing | Status payment `pending_clearance` → cleared (untuk bank recon) |
| Unified tax settings | Pindah dari hanya `ecommerce.*` ke `accounting.tax_*` atau `tax_codes` |

---

## 4. Usulan struktur modul & tabel

### Modul tunggal `accounting` (disarankan)
Satu module key agar entitlement/plan sederhana; submenu: COA, Journals, Ledger, Bank, Periods, Reports, Mappings.

Alternatif: pecah `accounting` + `banking` — hanya jika paket komersial memerlukannya.

### Tabel inti (MVP)

#### `account_types` (atau enum di kode)
`asset`, `liability`, `equity`, `revenue`, `expense`, `contra_*` opsional

#### `accounts`
| Kolom | Keterangan |
|---|---|
| `code` | unik, mis. `1100` |
| `name` | |
| `type` | |
| `parent_id` | hierarchy |
| `is_postable` | false untuk header |
| `is_active` | |
| `normal_balance` | debit/credit |
| `currency` | default IDR |
| `system_role` | nullable enum: `ar_control`, `ap_control`, `inventory`, `cogs`, `cash`, `tax_output`, `tax_input`, `sales_revenue`, `pos_revenue`, … |

#### `fiscal_years` / `fiscal_periods`
`year`, `period_index`, `starts_on`, `ends_on`, `status`

#### `journal_entries`
`number`, `period_id`, `entry_date`, `type`, `status`, `source_type`, `source_id`, `event`, `memo`, `posted_at`, `posted_by`

#### `journal_lines`
`journal_entry_id`, `account_id`, `debit`, `credit`, `partner_id?`, `warehouse_id?`, `memo`

Constraint app-level: Σ debit = Σ credit; tidak boleh keduanya > 0 pada baris yang sama.

#### `accounting_posting_rules`
`event_key`, `line_role`, `account_id` atau `system_role`, `formula` (amount source), `sort`

#### `company_bank_accounts`
`name`, `bank_name`, `account_number`, `account_id` (COA kas), `is_default`

#### `bank_transactions` / `bank_reconciliations` (+ items)
MVP fase B.

#### `accounting_source_links` (opsional)
Index cepat `(source_type, source_id, event) → journal_entry_id` untuk idempotency.

---

## 5. Event posting (kontrak)

Setiap peristiwa final memanggil:

```
AccountingPoster::post(SourceEvent $event): ?JournalEntry
```

**SourceEvent:** `key` (string), `source_type`, `source_id`, `occurred_at`, `partner_id?`, `warehouse_id?`, `amounts` (named: `gross`, `tax`, `net`, `cogs`, `paid`, …), `currency`

### Event key MVP (prioritas)

| Event | Debit | Credit |
|---|---|---|
| `invoice.issued` | AR | Revenue (+ Tax Output bila ada) |
| `invoice.voided` | reverse | |
| `credit_note.issued` | Revenue/Tax (or contra) | AR |
| `ar_payment.recorded` | Cash/Bank | AR |
| `ar_payment.voided` | reverse | |
| `supplier_bill.issued` | Expense atau Inventory/GRNI | AP (+ Tax Input) |
| `bill_payment.recorded` | AP | Cash/Bank |
| `grn.confirmed` | Inventory | GRNI (atau AP jika billed) |
| `gin.confirmed` / `pos_sale.completed` | COGS | Inventory |
| `pos_sale.completed` (revenue) | Cash (atau split tender) | POS Revenue (+ Tax) |
| `pos_shift.closed` (variance) | Cash shortage expense / overage income | Cash |
| `promo_award.settled_credit` | (sudah via credit_note.issued) | |
| `stock_opname.adjusted` | Adj / Inventory | Inventory / Adj |

Jumlah mengikuti dokumen sumber (snapshot), bukan dihitung ulang dari katalog.

---

## 6. Permissions

| Aksi | Siapa |
|---|---|
| `accounting.view` | Lihat COA, GL, laporan |
| `accounting.manage_coa` | Admin / controller |
| `accounting.journal` | Buat/edit draft jurnal |
| `accounting.post` | Post jurnal |
| `accounting.period` | Soft/hard close |
| `accounting.bank` | Transaksi & recon |
| `accounting.map` | Ubah posting rules |
| `accounting.unclose` | Super restricted |

---

## 7. UI (submenu Accounting)

1. **Dashboard** — periode aktif, unposted queue, AR/AP vs GL variance  
2. **Chart of Accounts** — tree + CRUD  
3. **Journals** — list/filter/create/post/reverse  
4. **Ledger** — pilih akun + periode  
5. **Bank** — accounts, transactions, reconcile  
6. **Periods** — open/close  
7. **Mappings** — event → accounts  
8. **Reports** — TB, P&L, BS, CF  
9. **Opening balances** wizard (setup)

Nav: grup sidebar `finance` bersama Invoicing / Receivables / Payables (atau grup baru `accounting`).

---

## 8. Integrasi dengan modul existing

| Modul | Perubahan |
|---|---|
| `invoicing` | Setelah issue/void → `AccountingPoster` |
| `receivables` | Setelah payment record/void |
| `payables` | Setelah bill issue & payment |
| `sales` | GIN confirm / return confirm → COGS & inventory |
| `purchasing` | GRN confirm / return |
| `pos` | Sale complete, void, shift close |
| `promotions` | Settlement CN sudah lewat invoicing |
| `billing` | Invoice dari DO sudah lewat invoicing; trip allowance settle → kas/expense (fase B) |
| `inventory` | Opname adjustment |
| `partners` | Tetap master; `PartnerBankAccount` ≠ company bank |
| Settings | Seed default COA + default mappings saat install Accounting |

**Jangan** memindahkan AR/AP UI ke Accounting; Accounting **membaca** dan **memosting**.

---

## 9. Roadmap implementasi

| Fase | Isi | Hasil bisnis |
|---|---|---|
| **0** | Dokumen ini + keputusan arsitektur | Alignment |
| **A0** | Module scaffold, permissions, menu, migrations COA/period/journal | Skeleton |
| **A1** | COA CRUD + seed standar distributor IDR + fiscal periods | Buku siap diisi |
| **A2** | Manual journal + post + Trial Balance | Accounting dasar hidup |
| **A3** | Posting rules + poster untuk Invoice + AR Payment + Bill + Bill Payment | AR/AP masuk GL |
| **A4** | Inventory/COGS posting (GRN/GIN/POS) + recon inventory | Distributor-ready |
| **B1** | Company bank accounts + link payment methods → kas | Kas terlihat |
| **B2** | Bank recon MVP + POS shift variance posting | Kas harian terkunci |
| **C1** | P&L + Balance Sheet + period soft/hard close | Laporan keuangan |
| **C2** | Opening balance + year-end close | Go-live cutover |
| **D** | Tax codes + WHT; rental invoice gap; payment terms | Compliance & kelengkapan ops |
| **E** | FA, budget, multi-currency, e-Faktur | Enterprise |

### Out of scope fase A
- Multi-entity consolidation  
- Full IFRS complex instruments  
- Automatic e-Faktur DJP  
- Payroll  

---

## 10. Seed COA minimal (contoh distributor)

| Kode | Nama | Type | system_role |
|---|---|---|---|
| 1100 | Kas | asset | `cash` |
| 1110 | Bank | asset | `bank` |
| 1200 | Piutang Usaha | asset | `ar_control` |
| 1300 | Persediaan | asset | `inventory` |
| 1400 | PPN Masukan | asset | `tax_input` |
| 2100 | Hutang Usaha | liability | `ap_control` |
| 2200 | PPN Keluaran | liability | `tax_output` |
| 2300 | Hutang GRNI | liability | `grni` |
| 3100 | Modal | equity | |
| 3200 | Laba Ditahan | equity | `retained_earnings` |
| 4100 | Pendapatan Penjualan | revenue | `sales_revenue` |
| 4110 | Pendapatan POS | revenue | `pos_revenue` |
| 4200 | Potongan Penjualan | contra revenue | `sales_discount` |
| 5100 | HPP | expense | `cogs` |
| 6100 | Beban Operasional | expense | |
| 6200 | Selisih Kas | expense | `cash_variance` |

Tenant boleh rename/extend; `system_role` dipakai mapping default.

---

## 11. Testing (fase A)

- Jurnal manual tidak bisa post jika debit ≠ credit  
- Period hard-closed menolak posting  
- Issue invoice dua kali tidak dobel-post (idempotent)  
- Void invoice membuat reversal yang menyeimbangkan  
- TB: total debit = total credit  
- Setelah payment penuh, recon AR control ≈ 0 untuk invoice itu  
- GRN+GIN: Inventory GL bergerak sesuai cost  

---

## 12. Keputusan desain (usulan — bisa dikunci kemudian)

| # | Usulan | Alasan |
|---|---|---|
| 1 | Satu modul `accounting`, bukan pecah dini | Entitlement & posting terpusat |
| 2 | Event-sourced posting dari dokumen ops | Hindari dual entry manual ganda |
| 3 | Moving average cost tetap sumber COGS | Sudah ada di Purchasing/Inventory |
| 4 | IDR-first; multi-currency nanti | Sesuai CRM sekarang |
| 5 | Rental invoice & payment terms dilengkapi paralel | Gap ops sebelum/saat GL |
| 6 | Tax codes bertahap; e-Faktur belakangan | GL dulu, compliance dokumen kemudian |

---

## 13. Estimasi kasar (engineering)

| Fase | Effort kasar |
|---|---|
| A0–A2 (COA, period, manual JE, TB) | 1.5–2.5 minggu |
| A3 (AR/AP auto-post) | 1–1.5 minggu |
| A4 (inventory/COGS/POS) | 1–2 minggu |
| B1–B2 (bank + recon MVP) | 1.5–2 minggu |
| C1–C2 (FS + close + opening) | 1–1.5 minggu |

**Total MVP “buku lengkap dipakai finance”:** ~7–10 minggu engineering fokus (tergantung depth recon & laporan).

---

## 14. Ringkasan satu kalimat

Untuk accounting lengkap, **lengkapi modul Foundation `accounting` (COA → Jurnal → GL → Mapping posting → Bank → Periode → Laporan)**, **hubungkan ke dokumen yang sudah ada**, dan **tutup gap operasional** (rental invoice, tax codes, payment terms) — jangan membangun ulang Invoicing/Receivables/Payables.
