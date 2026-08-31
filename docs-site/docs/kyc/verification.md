---
title: Verifikasi Identitas (KYC)
sidebar_position: 1
---

# Verifikasi Identitas (KYC)

Verifikasi identitas (Know Your Customer) adalah modul wajib pada bisnis rental kendaraan untuk memvalidasi KTP, SIM A pengemudi, foto selfie dengan KTP, dan kontak darurat sebelum mobil diserahkan.

---

## 1. Cek Status KYC Customer

<div className="endpoint-box">
  <span className="badge-get">GET</span>
  <code>/auth/kyc</code>
</div>

**Header:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "status": "verified",
  "is_verified": true,
  "is_pending": false,
  "is_rejected": false,
  "submitted_at": "2026-08-30T10:00:00+07:00",
  "verified_at": "2026-08-30T14:30:00+07:00",
  "rejected_reason": null,
  "id_number_masked": "3201********0001",
  "license_number_masked": "1234****9012",
  "license_expires_at": "2029-12-31",
  "id_card_photo_url": "https://andito.seruwit-crm.test/storage/kyc/ktp_xxx.jpg",
  "driver_license_photo_url": "https://andito.seruwit-crm.test/storage/kyc/sim_xxx.jpg",
  "selfie_photo_url": "https://andito.seruwit-crm.test/storage/kyc/selfie_xxx.jpg",
  "emergency_contact": {
    "name": "Siti Rahma",
    "phone": "081299887766",
    "relationship": "Istri"
  }
}
```

---

## 2. Unggah Dokumen KYC

Mengirimkan foto dokumen KTP, SIM A, foto selfie memegang KTP, dan kontak darurat.

<div className="endpoint-box">
  <span className="badge-post">POST</span>
  <code>/auth/kyc</code>
</div>

**Header:** `Authorization: Bearer {token}`  
**Content-Type:** `multipart/form-data`

### Form-Data Parameters
| Parameter | Tipe | Wajib? | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id_number` | `string` | **Ya** | Nomor NIK KTP (16 digit). |
| `license_number` | `string` | **Ya** | Nomor SIM A Pengemudi. |
| `license_expires_at` | `date` | **Ya** | Masa berlaku SIM (Format: `YYYY-MM-DD`). |
| `id_card_photo` | `file` | **Ya** | Foto fisik e-KTP (JPG/PNG max 5MB). |
| `driver_license_photo` | `file` | **Ya** | Foto fisik SIM A (JPG/PNG max 5MB). |
| `selfie_photo` | `file` | **Ya** | Foto selfie customer memegang KTP (JPG/PNG max 5MB). |
| `emergency_contact_name` | `string` | **Ya** | Nama kontak darurat / kerabat. |
| `emergency_contact_phone` | `string` | **Ya** | No HP kontak darurat. |
| `emergency_contact_relationship` | `string` | **Ya** | Hubungan keluarga / kerabat. |

**Response (200 OK):**
```json
{
  "message": "Dokumen verifikasi KYC berhasil dikirim. Tim admin kami akan meninjaunya dalam 1x24 jam.",
  "kyc": {
    "status": "pending",
    "is_verified": false,
    "is_pending": true,
    "is_rejected": false,
    "submitted_at": "2026-08-31T17:30:00+07:00",
    "verified_at": null,
    "rejected_reason": null,
    "id_number_masked": "3201********0001",
    "license_number_masked": "1234****9012"
  }
}
```
