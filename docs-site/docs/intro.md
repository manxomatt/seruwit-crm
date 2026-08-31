---
slug: /
title: Pengantar & Base URL
sidebar_position: 1
---

# Seruwit Rental Mobile API v1

Selamat datang di dokumentasi resmi **Seruwit Rental Mobile JSON API**. API ini dirancang khusus untuk membangun aplikasi mobile customer (Android & iOS) dengan performa tinggi, alur transaksi aman, serta kepatuhan penuh terhadap kebijakan Google Play Store & Apple App Store.

---

## 🌐 Arsitektur Multi-Tenancy & Base URL

Seruwit CRM beroperasi dengan arsitektur **Multi-Tenant**. Setiap tenant rental mobil memiliki subdomain / custom domain tersendiri.

* **Base URL Format:**
  `https://{tenant-subdomain}.seruwit.com/api/mobile/v1`
* **Contoh Base URL Lokal (Herd/Sail):**
  `https://andito.seruwit-crm.test/api/mobile/v1`

---

## 📋 Standar Header HTTP

Setiap request dari aplikasi mobile harus menyertakan header berikut:

| Header | Nilai Contoh | Keterangan |
| :--- | :--- | :--- |
| `Accept` | `application/json` | **Wajib**. Memastikan server selalu mengembalikan response JSON. |
| `Content-Type` | `application/json` | Gunakan untuk request JSON (atau `multipart/form-data` untuk upload berkas). |
| `Authorization` | `Bearer {token}` | **Wajib** untuk endpoint terproteksi setelah customer login. |
| `Idempotency-Key` | `uuid-v4-string` | Direkomendasikan untuk endpoint pemesanan & pembayaran guna mencegah *double-charge*. |

---

## 🚦 Inisialisasi Aplikasi (Bootstrap)

Sebelum customer melakukan aksi apa pun, aplikasi mobile memanggil endpoint `bootstrap` untuk mengunduh identitas tenant dan konfigurasi branding dinamis.

### 1. Health Check
<div className="endpoint-box">
  <span className="badge-get">GET</span>
  <code>/health</code>
</div>

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2026-08-31T17:30:00+07:00"
}
```

---

### 2. Bootstrap Config & Branding
<div className="endpoint-box">
  <span className="badge-get">GET</span>
  <code>/bootstrap</code>
</div>

**Response (200 OK):**
```json
{
  "tenant": {
    "id": "andito",
    "name": "Andito Rental Mobil"
  },
  "brand": {
    "name": "Andito Rental",
    "logo_url": "https://andito.seruwit-crm.test/storage/brand/logo.png",
    "primary_color": "#0284c7",
    "phone": "6281234567890"
  },
  "surfaces": {
    "rental": {
      "enabled": true,
      "gateway_available": true,
      "period_types": ["daily", "weekly", "monthly"]
    }
  },
  "min_app_version": null,
  "api_version": 1
}
```
