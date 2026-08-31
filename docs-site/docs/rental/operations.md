---
title: Operasional Sewa (Perpanjangan & Check-In)
sidebar_position: 1
---

# Operasional Sewa (Perpanjangan & Check-In)

Endpoint untuk menangani operasional harian sewa: pengajuan perpanjangan durasi sewa saat mobil sedang dipakai, serta digital check-in serah terima kendaraan dengan tanda tangan digital tanpa kertas (*paperless*).

---

## 1. Pengajuan Perpanjangan Sewa (Rental Extension)

Customer yang sedang menyewa mobil (status `active`) dapat mengajukan penambahan hari sewa langsung dari aplikasi mobile. Sistem akan mengecek ketersediaan unit dan menghitung estimasi biaya tambahan.

<div className="endpoint-box">
  <span className="badge-post">POST</span>
  <code>/rental/bookings/{public_token}/extend</code>
</div>

**Header:** `Authorization: Bearer {token}`

### Request Body (JSON)
| Parameter | Tipe | Wajib? | Deskripsi |
| :--- | :--- | :--- | :--- |
| `new_end_date` | `date` | **Ya** | Tanggal selesai baru (harus setelah tanggal selesai saat ini). |
| `notes` | `string` | Tidak | Alasan perpanjangan (opsional). |

```json
{
  "new_end_date": "2026-09-05",
  "notes": "Ingin memperpanjang liburan keluarga di Bandung 2 hari lagi."
}
```

**Response (201 Created):**
```json
{
  "message": "Pengajuan perpanjangan sewa berhasil dikirim dan menunggu persetujuan admin.",
  "extension_request": {
    "id": 4,
    "requested_end_date": "2026-09-05",
    "estimated_periods": 2,
    "estimated_amount": 1300000.0,
    "status": "pending",
    "notes": "Ingin memperpanjang liburan keluarga di Bandung 2 hari lagi.",
    "created_at": "2026-08-31T17:30:00+07:00"
  },
  "booking": {
    "code": "RNT-202609-0001",
    "status": "active"
  }
}
```

---

## 2. Riwayat Pengajuan Perpanjangan Sewa

Melihat daftar pengajuan perpanjangan sewa (pending, disetujui, atau ditolak) dan perpanjangan yang telah aktif.

<div className="endpoint-box">
  <span className="badge-get">GET</span>
  <code>/rental/bookings/{public_token}/extensions</code>
</div>

**Header:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "requests": [
    {
      "id": 4,
      "requested_end_date": "2026-09-05",
      "estimated_periods": 2,
      "estimated_amount": 1300000.0,
      "status": "approved",
      "notes": "Ingin memperpanjang liburan keluarga di Bandung 2 hari lagi.",
      "staff_notes": "Disetujui. Unit tersedia.",
      "reviewed_at": "2026-08-31T18:00:00+07:00",
      "created_at": "2026-08-31T17:30:00+07:00"
    }
  ],
  "extensions": [
    {
      "id": 2,
      "original_end_date": "2026-09-03",
      "new_end_date": "2026-09-05",
      "extended_periods": 2,
      "additional_amount": 1300000.0,
      "created_at": "2026-08-31T18:00:00+07:00"
    }
  ]
}
```

---

## 3. Digital Check-In & Tanda Tangan Serah Terima (Handover)

Sebelum mobil diserahkan ke penyewa, customer menyetujui Syarat & Ketentuan Sewa serta membubuhkan tanda tangan digital pada layar sentuh aplikasi (*Signature Canvas*).

<div className="endpoint-box">
  <span className="badge-post">POST</span>
  <code>/rental/bookings/{public_token}/check-in</code>
</div>

**Header:** `Authorization: Bearer {token}`

### Request Body (JSON)
| Parameter | Tipe | Wajib? | Deskripsi |
| :--- | :--- | :--- | :--- |
| `terms_agreed` | `boolean` | **Ya** | Harus bernilai `true`. |
| `customer_signature` | `string` | **Ya** | Data URI gambar base64 tanda tangan canvas (`data:image/png;base64,...`). |
| `pickup_notes` | `string` | Tidak | Catatan serah terima (misal: "Diantar ke lobi hotel Aston jam 8 pagi"). |

```json
{
  "terms_agreed": true,
  "customer_signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "pickup_notes": "Diantar ke lobi hotel Aston jam 8 pagi."
}
```

**Response (200 OK):**
```json
{
  "message": "Permintaan serah terima mobil berhasil dikirim.",
  "booking": {
    "code": "RNT-202609-0001",
    "status": "confirmed",
    "pickup_request": {
      "requested_at": "2026-08-31T17:30:00+07:00",
      "status": "pending",
      "customer_signature_url": "https://andito.seruwit-crm.test/storage/rental/pickup-signatures/sig_123.png",
      "terms_agreed": true,
      "notes": "Diantar ke lobi hotel Aston jam 8 pagi.",
      "can_check_in": false
    }
  }
}
```
