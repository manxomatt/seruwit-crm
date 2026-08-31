---
title: Pembayaran (Midtrans & Transfer Manual)
sidebar_position: 1
---

# Pembayaran (Midtrans & Transfer Manual)

Sistem pembayaran rental mobil mendukung **Payment Gateway Otomatis (Midtrans Snap)** untuk pembayaran instan via QRIS, Virtual Account, Kartu Kredit, serta **Transfer Bank Manual** langsung ke rekening resmi tenant.

---

## 1. Ambil Rekening Bank & Metode Pembayaran

Mendapatkan daftar rekening bank resmi tenant beserta status ketersediaan payment gateway.

<div className="endpoint-box">
  <span className="badge-get">GET</span>
  <code>/rental/payment-methods</code>
</div>

**Response (200 OK):**
```json
{
  "gateway_available": true,
  "bank_accounts": [
    {
      "id": 1,
      "bank_name": "Bank Central Asia (BCA)",
      "account_number": "8830123456",
      "account_holder": "PT SERUWIT RENTAL INDONESIA",
      "is_default": true
    },
    {
      "id": 2,
      "bank_name": "Bank Mandiri",
      "account_number": "1310009988771",
      "account_holder": "PT SERUWIT RENTAL INDONESIA",
      "is_default": false
    }
  ]
}
```

---

## 2. Bayar Uang Muka DP (Online Gateway Midtrans)

Membuat sesi transaksi checkout Midtrans Snap untuk pembayaran uang muka / deposit sewa.

<div className="endpoint-box">
  <span className="badge-post">POST</span>
  <code>/rental/bookings/{public_token}/pay-deposit</code>
</div>

**Header:**
* `Authorization: Bearer {token}`
* `Idempotency-Key: {uuid-v4}`

**Response (200 OK):**
```json
{
  "payment": {
    "mode": "midtrans_snap",
    "redirect_url": "https://app.sandbox.midtrans.com/snap/v2/vtweb/xxxx-token-xxxx",
    "snap_token": "xxxx-token-xxxx",
    "amount": 500000.0,
    "expires_at": "2026-08-31T19:30:00+07:00"
  },
  "booking": {
    "code": "RNT-202609-0001",
    "status": "reserved"
  }
}
```

> **Tips Integrasi Mobile:** Pada Flutter/React Native, Anda dapat membuka `redirect_url` menggunakan In-App WebView atau memanggil SDK native Midtrans menggunakan `snap_token`.

---

## 3. Upload Bukti Transfer Manual (Deposit Proof)

Apabila customer memilih metode transfer manual ke rekening bank tenant, customer mengunggah foto struk bukti transfer.

<div className="endpoint-box">
  <span className="badge-post">POST</span>
  <code>/rental/bookings/{public_token}/deposit-proof</code>
</div>

**Header:** `Authorization: Bearer {token}`  
**Content-Type:** `multipart/form-data`

### Form-Data Parameters
| Parameter | Tipe | Wajib? | Deskripsi |
| :--- | :--- | :--- | :--- |
| `deposit_proof` | `file` | **Ya** | Foto bukti transfer (JPG, PNG, PDF max 5MB). |
| `company_bank_account_id` | `int` | Tidak | ID rekening bank tujuan transfer. |
| `notes` | `string` | Tidak | Catatan customer (misal nama pengirim). |

**Response (200 OK):**
```json
{
  "message": "Bukti transfer pembayaran uang muka berhasil diunggah dan sedang ditinjau admin.",
  "booking": {
    "code": "RNT-202609-0001",
    "deposit_payment_method": "transfer",
    "deposit_proof": {
      "path": "rental/deposit-proofs/proof_123.jpg",
      "url": "https://andito.seruwit-crm.test/storage/rental/deposit-proofs/proof_123.jpg",
      "status": "pending",
      "uploaded_at": "2026-08-31T17:30:00+07:00",
      "rejected_reason": null,
      "company_bank_account_id": 1
    }
  }
}
```

---

## 4. Pelunasan Sisa Tagihan Sewa (Pay Balance / Invoice)

Membayar sisa tagihan sewa / invoice yang belum lunas via Midtrans Snap.

<div className="endpoint-box">
  <span className="badge-post">POST</span>
  <code>/rental/bookings/{public_token}/pay-balance</code>
</div>

**Header:**
* `Authorization: Bearer {token}`
* `Idempotency-Key: {uuid-v4}`

### Request Body (JSON / Opsional)
```json
{
  "invoice_id": null
}
```
*(Kosongkan `invoice_id` jika ingin sistem otomatis memilih tagihan terbuka yang belum l).*

**Response (200 OK):**
```json
{
  "payment": {
    "mode": "midtrans_snap",
    "redirect_url": "https://app.sandbox.midtrans.com/snap/v2/vtweb/yyyy-invoice-snap-yyyy",
    "snap_token": "yyyy-invoice-snap-yyyy",
    "amount": 1000000.0,
    "expires_at": null
  },
  "invoice": {
    "id": 10,
    "code": "INV-202609-0010",
    "status": "issued",
    "total": 1500000.0,
    "balance": 1000000.0
  },
  "booking": {
    "code": "RNT-202609-0001",
    "status": "confirmed"
  }
}
```
