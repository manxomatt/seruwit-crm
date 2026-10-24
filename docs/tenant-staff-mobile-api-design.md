# Desain Arsitektur & Dokumentasi REST API: Aplikasi Mobile Tenant (Staff, Checker, Driver & Owner)

> **Dokumen Desain Sistem & Spesifikasi API**  
> **Target Aplikasi:** Mobile App Tenant (Android & iOS — Flutter / React Native)  
> **Status:** Siap Diimplementasikan  
> **Tanggal:** 24 Oktober 2026  
> **Konteks:** Seruwit Biz — Modul Rental Kendaraan & Multi-Tenant CRM  

---

## 1. Pendahuluan & Latar Belakang

Platform **Seruwit Biz** sebelumnya telah memiliki REST API untuk sisi **Customer / Pelanggan** (`/api/mobile/v1/*`). Namun, operasional harian perusahaan rental (tenant) membutuhkan mobilitas tinggi bagi staf internal mereka di lapangan:

1. **Owner / Manajer Cabang:** Membutuhkan kemudahan memantau omzet, ketersediaan unit, serta melakukan persetujuan (*approval*) cepat atas bukti transfer pembayaran dan perpanjangan sewa saat tidak berada di depan laptop.
2. **Petugas Lapangan / Checker:** Memerlukan aplikasi di smartphone untuk memeriksa kondisi fisik kendaraan saat serah terima (*handover*), mencatat kilometer dan level BBM, mengambil foto 4 sisi bodi, menjalankan inspeksi kerusakan berbasis AI, serta meminta tanda tangan digital penyewa.
3. **Driver / Sopir Karyawan:** Membutuhkan daftar surat perintah kerja (*Duty Order* / penjemputan bandara), navigasi rute, serta pencatatan klaim pengeluaran uang jalan (BBM, tol, parkir).

Dokumen ini mendesain secara lengkap **REST API khusus internal tenant** (`/api/staff/v1/*`) yang dibangun di atas layer bisnis Seruwit Biz yang sudah ada.

---

## 2. Arsitektur Teknis & Prinsip Desain

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    APLIKASI MOBILE STAF TENANT (FLUTTER / RN)               │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                      HTTPS: https://{subdomain}.seruwit.com/api/staff/v1/…
                      Headers:
                        Authorization: Bearer <sanctum_token>
                        Accept: application/json
                        X-Device-Id: <uuid>
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MIDDLEWARE & GATEWAY STACK                          │
│                                                                             │
│  1. Stancl Tenancy: InitializeTenancyByDomain (Switch DB ke tenant_<id>)    │
│  2. EnsureTenantIsActive: Cek status langganan tenant tidak disuspend       │
│  3. AuthenticateStaffSanctum: Validasi Bearer Token via Laravel Sanctum     │
│  4. DynamicRateLimiting: Proteksi brute-force & spamming                    │
│  5. RolePermissionGuard: Validasi izin akses (RBAC module & action)         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     BACKEND SERVICES & ELOQUENT ENGINES                     │
│                                                                             │
│  • RentalHandoverService       • RentalAiInspectionService (Gemini Vision)  │
│  • RentalConfirmationService   • RentalStatusBoard & AvailabilityBoard      │
│  • RentalDutyOrderService      • RentalWhatsAppNotifier                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Karakteristik Teknis:
* **Autentikasi:** Laravel Sanctum Token (`HasApiTokens`). Token memiliki masa berlaku (*expiry*) yang dapat dikonfigurasi (default: 30 hari).
* **Multi-Tenancy:** Otomatis mendeteksi subdomain atau custom domain tenant. Database schema langsung terisolasi ke `tenant_<id>`.
* **State & Idempotency:** Aksi mutasi penting (konfirmasi pembayaran, handover submit) mendukung header `Idempotency-Key` untuk mencegah data ganda akibat sinyal buruk di lapangan.
* **Format Response:** Format envelope standar yang konsisten:
  * Sukses: `{"success": true, "data": { ... }, "meta": { ... }}`
  * Gagal: `{"success": false, "error": { "code": "STRING_CODE", "message": "Pesan deskriptif", "details": [] }}`

---

## 3. Matriks Peran & Hak Akses (RBAC)

API ini menerapkan otorisasi ketat berbasis peran (*roles*) staf di schema tenant:

| Role | Cakupan Fitur | Hak Akses Utama |
|---|---|---|
| **Owner / General Admin** | Akses Penuh | Dashboard finansial, status armada, approval pembayaran, approval sewa |
| **Branch Manager** | Operasional & Persetujuan | Monitoring armada cabang, approval bukti bayar, jadwal serah terima |
| **Field Checker / Inspector** | Operasional Lapangan | Cek fisik kendaraan, checklist STNK/BBM, foto 4 sisi, AI Inspection, tanda tangan digital |
| **Company Driver** | Penugasan Lapangan | Melihat SPK (Duty Order), update status tugas, klaim biaya BBM/tol/parkir |

---

## 4. Spesifikasi Lengkap Endpoint API (`/api/staff/v1`)

### A. Autentikasi Staf

#### 1. Login Staf (`POST /api/staff/v1/auth/login`)
Digunakan oleh seluruh staf untuk masuk ke aplikasi mobile.

* **Request Body:**
```json
{
  "login": "checker1@acmerental.com", // email atau username
  "password": "SecretPassword123!",
  "device_name": "Samsung Galaxy A54 (Lapangan 01)"
}
```

* **Response Success (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "7|k9a8b7c6d5e4f3a2b1c0sanctumtoken...",
    "user": {
      "id": 12,
      "name": "Rian Hidayat",
      "username": "rian_checker",
      "email": "checker1@acmerental.com",
      "phone": "081234567891",
      "roles": ["field_checker"],
      "permissions": [
        "rental.view",
        "rental.handover",
        "fleet.view"
      ]
    }
  }
}
```

* **Response Error (422 / 401):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email/username atau password salah."
  }
}
```

#### 2. Profil Staf (`GET /api/staff/v1/auth/me`)
Mengambil info sesi pengguna aktif dan daftar izin.

#### 3. Logout Staf (`POST /api/staff/v1/auth/logout`)
Mencabut token perangkat saat ini.

---

### B. Dashboard & Monitoring Armada (Untuk Owner & Manajer)

#### 1. Ringkasan Operasional Hari Ini (`GET /api/staff/v1/dashboard/summary`)
* **Headers:** `Authorization: Bearer <token>`
* **Response Success (200 OK):**
```json
{
  "success": true,
  "data": {
    "vehicles": {
      "total": 45,
      "on_rent": 28,
      "available": 12,
      "maintenance": 3,
      "booked_today": 5
    },
    "handovers_today": {
      "pickup_pending": 4,
      "pickup_completed": 3,
      "return_pending": 6,
      "return_completed": 2
    },
    "approvals_pending": {
      "payment_proofs": 3,
      "extensions": 2
    },
    "revenue_snapshot": {
      "today_cash_collected": 7500000,
      "month_to_date": 142000000,
      "currency": "IDR"
    }
  }
}
```

---

### C. Approval Cepat (Persetujuan Finansial & Perpanjangan)

#### 1. Daftar Bukti Transfer Menunggu Konfirmasi (`GET /api/staff/v1/approvals/payments`)
Mengambil daftar reservasi dengan status `deposit_proof_status = 'pending'`.

* **Response Success (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 104,
      "booking_number": "RNT-202610-0089",
      "customer_name": "Budi Santoso",
      "customer_phone": "081234567890",
      "vehicle_name": "Toyota Innova Zenix 2.0 V",
      "amount": 500000,
      "payment_type": "deposit",
      "bank_target": "BCA (PT Acme Rental Sejahtera)",
      "proof_image_url": "https://acme.seruwit.com/storage/tenant_1/rental/deposit-proofs/proof_104.jpg",
      "uploaded_at": "2026-10-24T10:15:00Z"
    }
  ]
}
```

#### 2. Konfirmasi Pembayaran (`POST /api/staff/v1/approvals/payments/{rental_id}/confirm`)
Menyetujui pembayaran deposit. Otomatis mengubah status booking menjadi `confirmed`, mengalokasikan unit kendaraan, dan mengirimkan pesan WhatsApp konfirmasi ke customer via `RentalConfirmationService`.

* **Request Body:**
```json
{
  "notes": "Pembayaran diverifikasi via mutasi m-BCA jam 10:20"
}
```

* **Response Success (200 OK):**
```json
{
  "success": true,
  "data": {
    "rental_id": 104,
    "booking_number": "RNT-202610-0089",
    "status": "confirmed",
    "confirmed_at": "2026-10-24T10:22:15Z"
  }
}
```

#### 3. Tolak Pembayaran (`POST /api/staff/v1/approvals/payments/{rental_id}/reject`)
* **Request Body:**
```json
{
  "reason": "Nominal mutasi tidak ditemukan atau bukti transfer buram/palsu."
}
```

#### 4. Review Perpanjangan Sewa (`POST /api/staff/v1/approvals/extensions/{request_id}/review`)
* **Request Body:**
```json
{
  "action": "approve", // atau "reject"
  "staff_notes": "Disetujui. Mobil tidak memiliki jadwal sewa berikutnya."
}
```

---

### D. Serah Terima Kendaraan & AI Inspection (Untuk Checker / Staf Lapangan)

Fitur utama petugas lapangan saat berhadapan langsung dengan mobil dan customer.

#### 1. Jadwal Serah Terima Hari Ini (`GET /api/staff/v1/handovers/today`)
* **Query Params:** `type=all|pickup|return`
* **Response Success (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "rental_id": 104,
      "booking_number": "RNT-202610-0089",
      "type": "pickup", // pickup (handover out) atau return (handover in)
      "scheduled_at": "2026-10-24 14:00",
      "location": "Kantor Pusat / Depot Bandara",
      "customer": {
        "name": "Budi Santoso",
        "phone": "081234567890"
      },
      "vehicle": {
        "id": 8,
        "name": "Toyota Innova Zenix 2.0 V",
        "license_plate": "B 1234 ZK",
        "color": "Hitam Metalik"
      },
      "status": "ready_for_inspection"
    }
  ]
}
```

#### 2. Eksekusi Handover Out / Serah Terima ke Customer (`POST /api/staff/v1/handovers/{rental_id}/out`)
Menyimpan lembar kondisi awal sebelum mobil dibawa penyewa.

* **Request Body (Multipart/Form-Data):**
```
odometer_km: 35120
fuel_level: "full"               // "empty", "quarter", "half", "three_quarters", "full"
cleanliness: "clean"             // "dirty", "clean", "very_clean"
stnk_present: true
spare_tire_present: true
jack_tool_present: true
inspection_photos[front]: (File binary JPG/PNG)
inspection_photos[rear]: (File binary JPG/PNG)
inspection_photos[left]: (File binary JPG/PNG)
inspection_photos[right]: (File binary JPG/PNG)
staff_signature: (File binary PNG tanda tangan petugas)
customer_signature: (File binary PNG tanda tangan customer)
notes: "Baret halus di dekat spion kanan bawaan unit."
```

* **Response Success (200 OK):**
```json
{
  "success": true,
  "data": {
    "rental_id": 104,
    "status": "active",
    "odometer_start": 35120,
    "fuel_level_start": "full",
    "handover_out_at": "2026-10-24T14:15:00Z",
    "pdf_contract_url": "https://acme.seruwit.com/storage/tenant_1/contracts/contract_104.pdf"
  }
}
```

#### 3. AI Inspection Deteksi Kerusakan (`POST /api/staff/v1/handovers/{rental_id}/ai-inspect`)
Mengirimkan foto kendaraan ke **Gemini Vision AI Engine** (`RentalAiInspectionService`) untuk mendeteksi apakah ada penyok atau goresan baru dibandingkan foto saat *Handover Out*.

* **Request Body (Multipart):**
```
photo: (File binary foto bodi bagian yang dicurigai)
angle: "rear_bumper"
```

* **Response Success (200 OK):**
```json
{
  "success": true,
  "data": {
    "damage_detected": true,
    "severity": "moderate",
    "description": "Ditemukan goresan dalam sepanjang ±12 cm dan sedikit penyok pada bemper belakang sebelah kiri.",
    "estimated_repair_cost": 450000,
    "confidence_score": 0.94
  }
}
```

#### 4. Eksekusi Handover In / Pengembalian Kendaraan (`POST /api/staff/v1/handovers/{rental_id}/in`)
Mencatat kepulangan unit, kalkulasi kelebihan jam sewa (*overtime*), dan kekurangan BBM.

* **Request Body:**
```json
{
  "odometer_km": 35580,
  "fuel_level": "half", // awal "full" -> selisih setengah tangki
  "is_fuel_charge_applied": true,
  "damages": [
    {
      "description": "Goresan bemper belakang kiri",
      "cost": 450000,
      "charge_to_customer": true
    }
  ],
  "customer_signature": "data:image/png;base64,...",
  "notes": "Pengembalian tepat waktu, unit sudah diperiksa bersama penyewa."
}
```

* **Response Success (200 OK):**
```json
{
  "success": true,
  "data": {
    "rental_id": 104,
    "status": "returned",
    "final_settlement": {
      "base_rental_amount": 1800000,
      "overtime_penalty": 0,
      "fuel_penalty": 200000,
      "damage_claim": 450000,
      "deposit_held": 500000,
      "balance_due_from_customer": 150000,
      "deposit_refund_amount": 0
    }
  }
}
```

---

### E. Penugasan Driver / Sopir Karyawan

Jika tenant melayani paket *Car + Driver* atau layanan antar-jemput armada.

#### 1. Jadwal Tugas Sopir Hari Ini (`GET /api/staff/v1/driver/duties`)
Mengambil penugasan (`RentalDutyOrder`) yang terikat pada akun sopir yang sedang login.

* **Response Success (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "duty_id": 55,
      "rental_id": 104,
      "type": "with_driver", // "with_driver", "dropoff_delivery", "pickup_fetch"
      "status": "assigned",  // "assigned", "on_duty", "completed"
      "start_at": "2026-10-24 08:00",
      "end_at": "2026-10-24 20:00",
      "destination": "Bandara Soekarno Hatta - Hotel Pullman Thamrin",
      "customer": {
        "name": "Budi Santoso",
        "phone": "081234567890"
      },
      "vehicle": {
        "name": "Toyota Innova Zenix",
        "license_plate": "B 1234 ZK"
      }
    }
  ]
}
```

#### 2. Update Status Perjalanan (`POST /api/staff/v1/driver/duties/{duty_id}/status`)
* **Request Body:**
```json
{
  "status": "on_duty", // "on_duty", "arrived_destination", "completed"
  "latitude": -6.175392,
  "longitude": 106.827153
}
```

#### 3. Klaim Pengeluaran Uang Jalan (`POST /api/staff/v1/driver/duties/{duty_id}/expenses`)
Mencatat bukti bon BBM, tol, atau parkir yang dibayar sopir menggunakan kas operasional (`RentalDutyOrderExpense`).

* **Request Body (Multipart):**
```
category: "fuel" // "fuel", "toll", "parking", "other"
amount: 250000
receipt_photo: (File binary struk pembayaran)
notes: "Isi Pertamax 20 liter di SPBU Pasteur"
```

---

## 5. Rencana Struktur File di Codebase

Untuk mengimplementasikan arsitektur ini, struktur file baru ditambahkan ke direktori modul `modules/Rental/Http/Controllers/Api/Staff/`:

```
modules/Rental/
├── Http/
│   ├── Controllers/
│   │   └── Api/
│   │       └── Staff/
│   │           ├── StaffAuthController.php
│   │           ├── StaffDashboardApiController.php
│   │           ├── StaffApprovalApiController.php
│   │           ├── StaffHandoverApiController.php
│   │           └── StaffDriverDutyApiController.php
│   ├── Requests/
│   │   └── Api/
│   │       └── Staff/
│   │           ├── StaffLoginRequest.php
│   │           ├── ExecuteHandoverOutRequest.php
│   │           ├── ExecuteHandoverInRequest.php
│   │           └── StoreDutyExpenseRequest.php
│   └── Resources/
│       └── Api/
│           └── Staff/
│               ├── StaffUserResource.php
│               ├── HandoverTaskResource.php
│               └── DutyOrderResource.php
routes/
└── staff_api.php   <── Didaftarkan di routes/tenant.php
```

---

## 6. Contoh Implementasi Kode (Backend Laravel 12)

### A. Registrasi Trait Sanctum pada User Model
`app/Models/User.php`:
```php
namespace App\Models;

use Laravel\Sanctum\HasApiTokens;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, ResourceSyncing;
    // ...
}
```

### B. Pendaftaran Route Tenant API
`routes/tenant.php`:
```php
// Route API Staf Tenant (Bearer Sanctum Token)
Route::middleware([
    'api',
    \Stancl\Tenancy\Middleware\InitializeTenancyByDomain::class,
    \Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains::class,
    \App\Http\Middleware\EnsureTenantIsActive::class,
])->prefix('api/staff/v1')->group(base_path('routes/staff_api.php'));
```

`routes/staff_api.php`:
```php
use Illuminate\Support\Facades\Route;
use Modules\Rental\Http\Controllers\Api\Staff\StaffAuthController;
use Modules\Rental\Http\Controllers\Api\Staff\StaffDashboardApiController;
use Modules\Rental\Http\Controllers\Api\Staff\StaffApprovalApiController;
use Modules\Rental\Http\Controllers\Api\Staff\StaffHandoverApiController;
use Modules\Rental\Http\Controllers\Api\Staff\StaffDriverDutyApiController;

Route::post('/auth/login', [StaffAuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [StaffAuthController::class, 'logout']);
    Route::get('/auth/me', [StaffAuthController::class, 'me']);

    // Dashboard & Monitoring
    Route::get('/dashboard/summary', [StaffDashboardApiController::class, 'summary']);

    // Approvals (Finansial & Sewa)
    Route::prefix('approvals')->group(function () {
        Route::get('/payments', [StaffApprovalApiController::class, 'paymentProofs']);
        Route::post('/payments/{rental}/confirm', [StaffApprovalApiController::class, 'confirmPayment']);
        Route::post('/payments/{rental}/reject', [StaffApprovalApiController::class, 'rejectPayment']);
        Route::post('/extensions/{request}/review', [StaffApprovalApiController::class, 'reviewExtension']);
    });

    // Handover & Inspeksi Lapangan
    Route::prefix('handovers')->group(function () {
        Route::get('/today', [StaffHandoverApiController::class, 'today']);
        Route::post('/{rental}/out', [StaffHandoverApiController::class, 'handoverOut']);
        Route::post('/{rental}/in', [StaffHandoverApiController::class, 'handoverIn']);
        Route::post('/{rental}/ai-inspect', [StaffHandoverApiController::class, 'aiInspect']);
    });

    // Driver & SPK Tugas
    Route::prefix('driver')->group(function () {
        Route::get('/duties', [StaffDriverDutyApiController::class, 'index']);
        Route::post('/duties/{duty}/status', [StaffDriverDutyApiController::class, 'updateStatus']);
        Route::post('/duties/{duty}/expenses', [StaffDriverDutyApiController::class, 'storeExpense']);
    });
});
```

---

## 7. Keamanan & Rekomendasi Deployment

1. **Token Scope & Expiration:**
   Sanctum token dikonfigurasi untuk kadaluarsa dalam 30 hari. Jika perangkat staf hilang atau dicuri, Admin tenant dapat mencabut (*revoke*) token staf langsung dari menu CRM **User Management**.
2. **File Upload Handover:**
   Foto bodi mobil dan tanda tangan digital disimpan di disk penyimpanan terisolasi per tenant (`storage/tenant_<id>/rental/handovers/`) dan dioptimalkan (*resize / compression*) sebelum disimpan agar hemat kuota dan cepat saat diakses kembali.
3. **Offline Sync Capability:**
   Untuk aplikasi mobile lapangan (checker di basement gedung / luar kota tanpa sinyal stabil), developer aplikasi mobile disarankan menerapkan antrean lokal (*SQLite / WatermelonDB*) agar foto inspeksi dapat tersimpan di HP dan otomatis terunggah saat koneksi internet kembali online.

---

## 8. Kesimpulan & Langkah Eksekusi

Dengan spesifikasi ini:
* **Logika Backend:** Memanfaatkan 100% service yang sudah teruji di Seruwit Biz.
* **Kesiapan Mobile Developer:** Tim pengembang mobile (Flutter / React Native) dapat langsung bekerja mengikuti kontrak payload JSON yang tertera di dokumen ini.
* **Skalabilitas:** Setiap tenant memiliki data dan kredensial yang terisolasi penuh sesuai arsitektur schema-per-tenant Stancl.
