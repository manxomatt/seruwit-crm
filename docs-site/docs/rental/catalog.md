---
title: Katalog Kendaraan & Simulasi Biaya
sidebar_position: 1
---

# Katalog Kendaraan & Simulasi Biaya

Endpoint publik untuk mencari armada sewa yang tersedia, rincian spesifikasi, paket proteksi/asuransi, dan kalkulasi estimasi total biaya sewa.

---

## 1. Daftar Kategori Kendaraan (Vehicle Classes)

<div className="endpoint-box">
  <span className="badge-get">GET</span>
  <code>/rental/classes</code>
</div>

**Response (200 OK):**
```json
{
  "classes": [
    {
      "key": "mpv",
      "name": "Multi-Purpose Vehicle (MPV)",
      "vehicle_count": 8
    },
    {
      "key": "suv",
      "name": "Sport Utility Vehicle (SUV)",
      "vehicle_count": 5
    },
    {
      "key": "sedan",
      "name": "Sedan",
      "vehicle_count": 3
    }
  ]
}
```

---

## 2. Cari Armada Tersedia (Available Vehicles)

Mencari mobil aktif dan menyaring yang siap disewa pada rentang tanggal tertentu.

<div className="endpoint-box">
  <span className="badge-get">GET</span>
  <code>/rental/vehicles</code>
</div>

### Query Parameters
| Parameter | Tipe | Contoh | Deskripsi |
| :--- | :--- | :--- | :--- |
| `start_date` | `date` | `2026-09-01` | Tanggal mulai sewa. |
| `end_date` | `date` | `2026-09-03` | Tanggal selesai sewa. |
| `rental_class` | `string` | `mpv` | Filter kategori mobil (opsional). |
| `available_only` | `int` | `1` | Hanya tampilkan mobil yang belum di-booking (1 / 0). |

**Response (200 OK):**
```json
{
  "vehicles": [
    {
      "id": 1,
      "brand": "Toyota",
      "model": "Innova Zenix",
      "year": 2024,
      "license_plate": "B 1234 ABC",
      "rental_class": "mpv",
      "seats": 7,
      "transmission": "automatic",
      "fuel_type": "hybrid",
      "thumbnail_url": "https://andito.seruwit-crm.test/storage/vehicles/zenix.jpg",
      "rates": {
        "daily": {
          "rate": 650000.0,
          "deposit_amount": 500000.0
        }
      },
      "is_available": true
    }
  ]
}
```

---

## 3. Detail Kendaraan

<div className="endpoint-box">
  <span className="badge-get">GET</span>
  <code>/rental/vehicles/{id}</code>
</div>

**Response (200 OK):**
```json
{
  "vehicle": {
    "id": 1,
    "brand": "Toyota",
    "model": "Innova Zenix",
    "year": 2024,
    "license_plate": "B 1234 ABC",
    "rental_class": "mpv",
    "seats": 7,
    "transmission": "automatic",
    "fuel_type": "hybrid",
    "description": "Mobil nyaman untuk perjalanan keluarga dan dinas luar kota.",
    "photos": [
      "https://andito.seruwit-crm.test/storage/vehicles/zenix_1.jpg",
      "https://andito.seruwit-crm.test/storage/vehicles/zenix_interior.jpg"
    ],
    "features": ["Air Conditioner", "Bluetooth Audio", "Wireless Charger", "Sunroof", "Captain Seats"],
    "rates": {
      "daily": {
        "rate": 650000.0,
        "deposit_amount": 500000.0
      }
    }
  }
}
```

---

## 4. Daftar Lokasi Pool / Depot

<div className="endpoint-box">
  <span className="badge-get">GET</span>
  <code>/rental/locations</code>
</div>

**Response (200 OK):**
```json
{
  "locations": [
    {
      "id": 1,
      "name": "Pool Pusat Pasteur",
      "address": "Jl. Dr. Djunjunan No. 120, Bandung",
      "latitude": -6.891234,
      "longitude": 107.591234
    }
  ]
}
```

---

## 5. Paket Asuransi / Proteksi Tambahan

<div className="endpoint-box">
  <span className="badge-get">GET</span>
  <code>/rental/insurance-packages?period_type=daily</code>
</div>

**Response (200 OK):**
```json
{
  "insurance_packages": [
    {
      "id": 1,
      "code": "INS-BASIC",
      "name": "Basic Protection (Third Party Liability)",
      "amount": 50000.0,
      "description": "Proteksi kecelakaan pihak ketiga hingga Rp 25.000.000."
    },
    {
      "id": 2,
      "code": "INS-FULL",
      "name": "Total Care Protection (All-Risk)",
      "amount": 100000.0,
      "description": "Proteksi lecet, baret, dan risiko total tanpa biaya deductible."
    }
  ]
}
```

---

## 6. Simulasi Biaya Sewa (Quote Calculation)

Menghitung rincian biaya sewa, durasi hari/minggu, tarif base, uang jaminan deposit, dan asuransi secara instan sebelum melakukan checkout.

<div className="endpoint-box">
  <span className="badge-post">POST</span>
  <code>/rental/quotes</code>
</div>

### Request Body (JSON)
```json
{
  "vehicle_id": 1,
  "start_date": "2026-09-01",
  "end_date": "2026-09-03",
  "period_type": "daily",
  "insurance_package_id": 2
}
```

**Response (200 OK):**
```json
{
  "quote": {
    "total_periods": 2,
    "period_type": "daily",
    "rate_per_period": 650000.0,
    "base_amount": 1300000.0,
    "deposit_amount": 500000.0,
    "insurance_amount": 200000.0,
    "total_amount": 1500000.0,
    "upfront_due": 500000.0,
    "balance_due": 1500000.0
  }
}
```
