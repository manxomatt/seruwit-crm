# Fitur Pelunasan Pembayaran Invoice di Step Payments

## 1. Latar Belakang

Saat ini proses pelunasan pembayaran invoice dilakukan dengan mengklik invoice di halaman `module/rental/{id}`, yang kemudian mengarahkan user ke halaman `module/invoicing/invoices/{id}`. Flow ini terputus dan tidak terpusat di module Rental.

Fitur ini memindahkan proses pembayaran invoice ke dalam step Payments di halaman Rental Show, agar staff bisa menyelesaikan seluruh transaksi pembayaran tanpa harus keluar dari module Rental.

---

## 2. Saat Ini (Current State)

| Aspek | Deskripsi |
|-------|-----------|
| **Lokasi pembayaran** | Halaman `module/invoicing/invoices/{id}` |
| **Tombol yang ada** | "Mark Paid", "Record Payment", "Pay Invoice" (Midtrans) |
| **Flow** | User klik invoice → diarahkan ke halaman Invoicing → bayar di sana |
| **Data di Rental Show** | Prop `payment`: `total_invoiced`, `total_paid`, `balance_due`, `status`, + list `invoices` |
| **Deposit** | Sudah bisa dilakukan di Rental Show (Receive Deposit, Pay Online, Settle Deposit) |

**Masalah:** User harus keluar dari halaman Rental untuk membayar invoice, flow tidak terpusat.

---

## 3. Yang Akan Diubah

### A. Entry Point: Step 7 (Payments) di Rental Show

Tombol **"Pay Invoices"** muncul jika:
- `invoicingEnabled = true`
- `balance_due > 0`

### B. UI: Modal Payment Form

Klik tombol **"Pay Invoices"** → buka modal dengan form:

```
┌─────────────────────────────────────────────┐
│  Bayar Invoice - {rental.code}              │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐    │
│  │ Daftar Invoice                      │    │
│  │ ┌─────────────────────────────────┐ │    │
│  │ │ INV-001  |  Due: 15 Jan 2027    │ │    │
│  │ │ Balance: Rp 1.500.000           │ │    │
│  │ │ [Allocate: Rp 1.500.000    ]   │ │    │
│  │ ├─────────────────────────────────┤ │    │
│  │ │ INV-002  |  Due: 20 Jan 2027    │ │    │
│  │ │ Balance: Rp 800.000             │ │    │
│  │ │ [Allocate: Rp 800.000      ]   │ │    │
│  │ └─────────────────────────────────┘ │    │
│  │                                       │    │
│  │ Total Allocated: Rp 2.300.000        │    │
│  │ [Match Amount] ← isi amount dengan  │    │
│  │                total allocated        │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  Payment Date: [2026-01-10]                  │
│  Method:        [Transfer          ▼]        │
│  Type:          [Settlement        ▼]        │
│  Bank Account:  [BCA 123456789     ▼]        │
│  Amount:        [Rp 2.300.000      ]         │
│  Reference:     [TRF-001           ]         │
│  Notes:         [Pelunasan sewa... ]         │
│                                              │
│  [Cancel]  [Record Payment]                  │
└─────────────────────────────────────────────┘
```

### C. Backend Flow

```
User submit form
    ↓
POST module/rental/{rental}/pay-invoices
    ↓
RentalActionController::payInvoices()
    ↓
Validasi:
  - amount > 0
  - allocations ada dan jumlahnya cocok dengan amount
  - method valid (cash/transfer/giro/card/other)
  - type valid (down_payment/installment/settlement/other)
    ↓
PaymentRecorder::record([
    partner_id     => rental.partner_id,
    payment_date   => request.payment_date,
    amount         => request.amount,
    type           => request.type (default: settlement),
    method         => request.method,
    company_bank_account_id => request.company_bank_account_id,
    reference_number => request.reference_number,
    notes          => request.notes,
    allocations    => [
        { invoice_id: 1, amount: 1500000 },
        { invoice_id: 2, amount: 800000 },
    ],
])
    ↓
PaymentRecorder:
  1. Buat Payment record (status: posted)
  2. Buat PaymentAllocation per invoice
  3. Lock invoice, validasi balance, create allocation
  4. syncInvoice() → update amount_paid, status invoice
  5. (Opsional) AccountingBridge::paymentRecorded()
    ↓
Return back() with success message
    ↓
Frontend: Inertia refresh → payment summary ter-update
    ↓
Jika balance_due <= 0 → stepper bisa lanjut ke step 8 (Pickup)
```

### D. Frontend Flow

```
Step 7 (Payments):
  ├── Tampilkan ringkasan deposit & balance_due
  ├── Tombol "Receive Deposit" (jika deposit_amount > 0)
  ├── Tombol "Pay Online" (jika eligible)
  ├── Tombol "Settle Deposit" (jika deposit received & returned)
  └── TOMBOL BARU: "Pay Invoices" (jika balance_due > 0 & invoicingEnabled)
         ↓
Klik "Pay Invoices" → buka modal
         ↓
Modal: form pembayaran (list invoice + form fields)
         ↓
Submit → router.post() ke pay-invoices endpoint
         ↓
onSuccess: 
  - Tutup modal
  - Refresh page (Inertia) untuk update payment summary
  - Jika balance_due <= 0, auto-advance stepper ke step 8
```

---

## 4. Perubahan File yang Dibutuhkan

### Backend

| File | Perubahan |
|------|-----------|
| `modules/Rental/Http/Controllers/RentalActionController.php` | Tambah method `payInvoices()` |
| `modules/Rental/RentalModule.php` | Tambah route `POST rental/{rental}/pay-invoices` |
| `modules/Rental/Support/RentalInvoiceService.php` | Mungkin tambah helper untuk validasi invoice rental |

### Frontend

| File | Perubahan |
|------|-----------|
| `modules/Rental/resources/js/PostConfirm/PostConfirmPanel.tsx` | Tambah tombol "Pay Invoices" + modal |
| `modules/Rental/resources/js/PostConfirm/types.ts` | Tambah action `pay_invoices` |
| `modules/Rental/resources/js/Pages/Modules/Rental/Show.tsx` | Tambah handler untuk `pay_invoices` action |

---

## 5. Pertimbangan Penting

### A. Payment Type
- **Default: `settlement`** — karena biasanya user melunasi seluruh invoice rental
- Tapi form tetap allow ubah ke `installment` untuk pembayaran sebagian

### B. Multi-Invoice Allocation
- Form menunjukkan semua invoice rental yang masih ada balance-nya
- User input allocation per invoice
- Validasi: total allocation harus sama dengan payment amount

### C. Payment Methods
- Reuse metode yang sama dengan deposit: `cash`, `transfer`, `giro`, `card`, `other`
- Logic `company_bank_account_id` sama (hanya untuk transfer/giro)

### D. After Payment
- `onSuccess` → Inertia refresh untuk update `payment` prop
- Jika `balance_due <= 0`, auto-set `lifecycleStep` ke 8 (Pickup)
- Show success toast/message

### E. Module Availability
- Cek `invoicingEnabled` (sudah ada di Show page)
- Cek `PaymentRecorder` class exists (Receivables module active)
- Jika Receivables tidak aktif, tombol "Pay Invoices" tidak muncul

### F. Edge Cases
| Kondisi | Handle |
|---------|--------|
| Invoice sudah paid/void | Tidak muncul di list allocation |
| Allocation melebihi balance | Validasi server-side, reject |
| Payment amount != total allocation | Validasi server-side, reject |
| Partner tidak ada | Rental pasti punya partner, tidak perlu select |
| Multiple payments ke invoice yang sama | PaymentRecorder handle via lockForUpdate |

---

## 6. Alternatif yang Dipertimbangkan

| Alternatif | Kelebihan | Kekurangan |
|------------|-----------|------------|
| **Tombol "Pay Invoices" di step 7** (yang dipilih) | Terintegrasi di Rental, flow terpusat | Perlu buat form baru |
| Link ke halaman Invoicing (current) | Tidak perlu duplikasi | Flow terputus, user harus pindah module |
| Reuse form Receivables via iframe/embed | Konsisten dengan Invoicing | Kompleks, over-engineering |
| Auto-pay semua invoice (tanpa form) | Simple | Tidak fleksibel, tidak ada record payment method |

---

## 7. Ringkasan Flow Lengkap

```
┌──────────────────────────────────────────────────────┐
│  User di module/rental/4 → Step 7: Payments          │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │ Deposit: Rp 500.000  [Received ✓]            │    │
│  │ Balance Due: Rp 1.800.000                    │    │
│  │                                              │    │
│  │ [Receive Deposit] [Pay Online] [Settle]      │    │
│  │                                              │    │
│  │ INVOICES:                                    │    │
│  │ • INV-001: Rp 1.200.000 (issued)             │    │
│  │ • INV-002: Rp 600.000 (partially_paid)       │    │
│  │                                              │    │
│  │ [Pay Invoices] ← TOMBOL BARU                 │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
                    ↓ Klik
┌──────────────────────────────────────────────────────┐
│  Modal: Pay Invoices                                │
│                                                      │
│  Invoice List:                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │ INV-001  Due: 15 Jan 2027  Balance: 1.200.000│    │
│  │ [Allocate: 1.200.000            ] [Full]     │    │
│  │ INV-002  Due: 20 Jan 2027  Balance: 600.000  │    │
│  │ [Allocate: 600.000             ] [Full]     │    │
│  └──────────────────────────────────────────────┘    │
│  Total Allocated: Rp 1.800.000  [Match Amount]      │
│                                                      │
│  Payment Date: [2026-01-10]                         │
│  Method:        [Transfer ▼]                        │
│  Type:          [Settlement ▼]                      │
│  Bank Account:  [BCA 123456789 ▼]                   │
│  Amount:        [1.800.000]                         │
│  Reference:     [TRF-001]                           │
│  Notes:         [Pelunasan sewa #4]                 │
│                                                      │
│  [Cancel]  [Record Payment]                         │
└──────────────────────────────────────────────────────┘
                    ↓ Submit
┌──────────────────────────────────────────────────────┐
│  Payment recorded successfully                       │
│  - Payment code: PAY-2026-0042                      │
│  - INV-001: paid                                    │
│  - INV-002: paid                                    │
│                                                      │
│  [OK] → Page refresh → balance_due = 0              │
│       → Stepper auto-advance ke Step 8 (Pickup)     │
└──────────────────────────────────────────────────────┘
```
