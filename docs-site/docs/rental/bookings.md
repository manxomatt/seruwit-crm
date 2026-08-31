---
title: Pemesanan & Riwayat Booking
sidebar_position: 2
---

# Pemesanan & Riwayat Booking

Endpoint untuk membuat reservasi mobil baru, melihat detail pesanan melalui token publik pelacak, membatalkan sewa, dan mengambil riwayat pesanan customer.

---

## 1. Buat Reservasi Rental Baru

Membuat pesanan sewa baru. Dilindungi oleh proteksi `Idempotency-Key` agar jika koneksi HP terputus saat menekan tombol "Pesan", tidak terjadi pesanan ganda.

<div className="endpoint-box">
  <span className="badge-post">POST</span>
  <code>/rental/bookings</code>
</div>

**Header:**
* `Authorization: Bearer {token}`
* `Idempotency-Key: {uuid-v4}`

### Request Body (JSON)
```json
{
  "vehicle_id": 1,
  "start_date": "2026-09-01",
  "end_date": "2026-09-03",
  "period_type": "daily",
  "customer_name": "Budi Gunawan",
  "pickup_location_id": 1,
  "return_location_id": 1,
  "insurance_package_id": 2,
  "notes": "Tolong siapkan mobil dalam kondisi bersih."
}
```

**Response (201 Created):**
```json
{
  "message": "Pesanan rental berhasil dibuat.",
  "booking": {
    "code": "RNT-202609-0001",
    "public_token": "abc123def456publictoken789",
    "status": "reserved",
    "booker_phone": "6281234567890",
    "start_date": "2026-09-01",
    "end_date": "2026-09-03",
    "period_type": "daily",
    "total_periods": 2,
    "rate_per_period": 650000.0,
    "base_amount": 1300000.0,
    "deposit_amount": 500000.0,
    "deposit_received": false,
    "deposit_status": "unpaid",
    "total_amount": 1500000.0,
    "reserved_until": "2026-08-31T19:30:00+07:00",
    "payment": {
      "status": "unpaid",
      "total_invoiced": 0.0,
      "total_paid": 0.0,
      "balance_due": 1500000.0,
      "can_pay_balance": false,
      "invoices": []
    },
    "vehicle": {
      "id": 1,
      "brand": "Toyota",
      "model": "Innova Zenix",
      "license_plate": "B 1234 ABC"
    }
  }
}
```

---

## 2. Ambil Detail Pesanan (Tracking Token)

Melihat status real-time pesanan rental menggunakan `public_token`.

<div className="endpoint-box">
  <span className="badge-get">GET</span>
  <code>/rental/bookings/{public_token}</code>
</div>

**Header:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "booking": {
    "code": "RNT-202609-0001",
    "public_token": "abc123def456publictoken789",
    "status": "confirmed",
    "deposit_status": "settled",
    "deposit_received": true,
    "payment": {
      "status": "partial",
      "total_invoiced": 1500000.0,
      "total_paid": 500000.0,
      "balance_due": 1000000.0,
      "can_pay_balance": true,
      "invoices": [
        {
          "id": 10,
          "code": "INV-202609-0010",
          "status": "issued",
          "total": 1500000.0,
          "balance": 1000000.0
        }
      ]
    },
    "pickup_request": {
      "requested_at": null,
      "status": null,
      "can_check_in": true
    }
  }
}
```

---

## 3. Riwayat Pesanan Customer (My Bookings)

<div className="endpoint-box">
  <span className="badge-get">GET</span>
  <code>/rental/bookings</code>
</div>

**Header:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "bookings": [
    {
      "code": "RNT-202609-0001",
      "public_token": "abc123def456publictoken789",
      "status": "confirmed",
      "start_date": "2026-09-01",
      "end_date": "2026-09-03",
      "total_amount": 1500000.0,
      "vehicle": {
        "brand": "Toyota",
        "model": "Innova Zenix"
      }
    }
  ]
}
```

---

## 4. Batalkan Pesanan (Cancel Booking)

<div className="endpoint-box">
  <span className="badge-post">POST</span>
  <code>/rental/bookings/{public_token}/cancel</code>
</div>

**Header:** `Authorization: Bearer {token}`

### Request Body (JSON)
```json
{
  "cancelled_reason": "Perubahan rencana jadwal keluarga"
}
```

**Response (200 OK):**
```json
{
  "message": "Pesanan berhasil dibatalkan.",
  "booking": {
    "code": "RNT-202609-0001",
    "status": "cancelled",
    "cancelled_reason": "Perubahan rencana jadwal keluarga"
  }
}
```
