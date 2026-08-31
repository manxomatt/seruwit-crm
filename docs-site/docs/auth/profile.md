---
title: Manajemen Profil Customer
sidebar_position: 2
---

# Manajemen Profil Customer

Endpoint untuk mengambil dan memperbarui data profil lengkap customer penyewa, termasuk kontak darurat dan unggah foto profil (avatar).

---

## 1. Ambil Profil Lengkap

<div className="endpoint-box">
  <span className="badge-get">GET</span>
  <code>/auth/profile</code>
</div>

**Header:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "profile": {
    "id": 15,
    "code": "PART-000015",
    "name": "Budi Gunawan",
    "phone": "6281234567890",
    "email": "budi.gunawan@example.com",
    "address": "Jl. Merdeka No. 45, Bandung",
    "avatar_url": "https://andito.seruwit-crm.test/storage/avatars/avatar123.jpg",
    "kyc_status": "verified",
    "is_kyc_verified": true,
    "is_kyc_pending": false,
    "emergency_contact": {
      "name": "Siti Rahma",
      "phone": "081299887766",
      "relationship": "Istri"
    },
    "created_at": "2026-08-01T10:00:00+07:00"
  }
}
```

---

## 2. Perbarui Profil Customer & Upload Avatar

Mendukung `multipart/form-data` untuk upload foto avatar sekaligus atau `application/json` jika tanpa file.

<div className="endpoint-box">
  <span className="badge-post">POST</span>
  <code>/auth/profile</code>
</div>

> *Juga mendukung HTTP method `PUT /auth/profile`.*

**Header:** `Authorization: Bearer {token}`

### Form-Data Parameters
| Parameter | Tipe | Wajib? | Deskripsi |
| :--- | :--- | :--- | :--- |
| `name` | `string` | **Ya** | Nama lengkap customer (Max 255 karakter). |
| `email` | `string` | Tidak | Alamat email aktif. |
| `address` | `string` | Tidak | Alamat domisili lengkap. |
| `avatar` | `file` | Tidak | Berkas gambar (JPG, PNG, WebP max 3MB). |
| `emergency_contact_name` | `string` | Tidak | Nama kerabat / kontak darurat. |
| `emergency_contact_phone` | `string` | Tidak | Nomor telepon kontak darurat. |
| `emergency_contact_relationship` | `string` | Tidak | Hubungan (contoh: *Orang Tua, Pasangan, Saudara*). |

**Response (200 OK):**
```json
{
  "message": "Profil berhasil diperbarui.",
  "profile": {
    "id": 15,
    "code": "PART-000015",
    "name": "Budi Gunawan",
    "phone": "6281234567890",
    "email": "budi.gunawan@example.com",
    "address": "Jl. Merdeka No. 45, Bandung",
    "avatar_url": "https://andito.seruwit-crm.test/storage/avatars/new_avatar.jpg",
    "kyc_status": "verified",
    "is_kyc_verified": true,
    "is_kyc_pending": false,
    "emergency_contact": {
      "name": "Siti Rahma",
      "phone": "081299887766",
      "relationship": "Istri"
    },
    "created_at": "2026-08-01T10:00:00+07:00"
  }
}
```
