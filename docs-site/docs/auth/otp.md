---
title: Otentikasi Passwordless OTP
sidebar_position: 1
---

# Otentikasi Passwordless OTP

Sistem otentikasi customer menggunakan nomor telepon dan kode OTP 6-digit. Setelah OTP diverifikasi, server menerbitkan **Bearer Token** dengan masa aktif 30 hari.

---

## 1. Kirim Kode OTP (Send OTP)

Mengirimkan 6-digit kode OTP ke nomor telepon customer (via WhatsApp / SMS).

<div className="endpoint-box">
  <span className="badge-post">POST</span>
  <code>/auth/otp/send</code>
</div>

### Request Body (JSON)
| Parameter | Tipe | Wajib? | Deskripsi |
| :--- | :--- | :--- | :--- |
| `phone` | `string` | **Ya** | Nomor handphone customer (contoh: `081234567890` atau `6281234567890`). |

**Contoh Request:**
```json
{
  "phone": "081234567890"
}
```

**Response (200 OK):**
```json
{
  "ok": true,
  "message": "Kode OTP telah dikirim ke nomor Anda.",
  "expires_in": 300
}
```

---

## 2. Verifikasi Kode OTP (Verify OTP)

Memvalidasi kode OTP yang dimasukkan oleh customer dan menerbitkan token sesi.

<div className="endpoint-box">
  <span className="badge-post">POST</span>
  <code>/auth/otp/verify</code>
</div>

### Request Body (JSON)
| Parameter | Tipe | Wajib? | Deskripsi |
| :--- | :--- | :--- | :--- |
| `phone` | `string` | **Ya** | Nomor handphone yang sama saat meminta OTP. |
| `code` | `string` | **Ya** | Kode 6 digit OTP. |

**Contoh Request:**
```json
{
  "phone": "081234567890",
  "code": "123456"
}
```

**Response (200 OK):**
```json
{
  "token": "40_character_plain_bearer_token_string_here",
  "token_type": "Bearer",
  "expires_at": "2026-09-30T17:30:00+07:00",
  "phone": "6281234567890"
}
```

> **Catatan:** Simpan nilai `token` ke dalam Secure Storage (EncryptedSharedPreferences / iOS Keychain) pada aplikasi mobile, lalu sematkan pada header `Authorization: Bearer {token}` di setiap request berikutnya.

---

## 3. Cek Status Login (Me)

<div className="endpoint-box">
  <span className="badge-get">GET</span>
  <code>/auth/me</code>
</div>

**Header:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "phone": "6281234567890"
}
```

---

## 4. Logout

Mencabut sesi token pada perangkat saat ini.

<div className="endpoint-box">
  <span className="badge-post">POST</span>
  <code>/auth/logout</code>
</div>

**Header:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "ok": true
}
```
