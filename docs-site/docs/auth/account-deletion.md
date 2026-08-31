---
title: Hapus Akun (Google Play Policy)
sidebar_position: 3
---

# Hapus Akun (Account Deletion)

Google Play Store dan Apple App Store mewajibkan aplikasi yang memiliki sistem akun untuk menyediakan opsi **Hapus Akun Mandiri** di dalam aplikasi.

---

## Ketentuan & Proteksi Keamanan Bisnis Rental

Untuk mencegah penipuan atau penghilangan unit armada sewa, akun customer **TIDAK DAPAT DIHAPUS** apabila customer masih memiliki transaksi sewa kendaraan yang sedang berjalan (*aktif, reserved, atau menunggu pengembalian*).

### Alur yang Terjadi saat Akun Dihapus:
1. Server memeriksa status seluruh pesanan rental nomor HP tersebut.
2. Jika ada rental aktif, permintaan ditolak dengan kode `400 Bad Request`.
3. Jika bersih, data pribadi di-*anonymize* (`name: "Deleted User"`, NIK, nomor SIM, dan dokumen dibersihkan).
4. Record customer di-*soft delete*.
5. **Seluruh sesi Bearer Token** yang aktif dicabut secara permanen.

---

## Endpoint Hapus Akun

<div className="endpoint-box">
  <span className="badge-delete">DELETE</span>
  <code>/auth/account</code>
</div>

**Header:** `Authorization: Bearer {token}`

### Response Sukses (200 OK)
```json
{
  "ok": true,
  "message": "Akun Anda telah berhasil dihapus."
}
```

### Response Gagal jika Ada Rental Berjalan (400 Bad Request)
```json
{
  "code": "active_rentals_exist",
  "message": "Akun tidak dapat dihapus selama Anda masih memiliki transaksi rental aktif atau berjalan."
}
```
