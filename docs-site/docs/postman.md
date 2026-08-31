---
title: Postman Collection
sidebar_position: 6
---

# Postman Collection

Untuk mempermudah integrasi dan pengujian API secara langsung, file Postman Collection v2.1 telah tersedia di dalam repositori proyek.

---

## 📥 Lokasi File Collection

File collection tersimpan di direktori:
```bash
docs/api/seruwit-mobile-booking-v1.postman_collection.json
```

---

## 🚀 Cara Menggunakan di Postman

1. Buka aplikasi **Postman**.
2. Klik tombol **Import** di pojok kiri atas.
3. Seret (*drag and drop*) file `seruwit-mobile-booking-v1.postman_collection.json`.
4. Di tab **Variables** collection, ubah nilai `baseUrl` sesuai domain tenant Anda:
   * **Domain Lokal (Herd/Sail):** `https://andito.seruwit-crm.test`
   * **Domain Produksi:** `https://tenant-anda.seruwit.com`
5. Jalankan request **Send OTP** lalu **Verify OTP**.
6. Skrip pengujian otomatis di Postman akan secara otomatis menyimpan token otentikasi ke variabel `{{token}}` sehingga seluruh request lainnya dapat langsung dieksekusi tanpa perlu copy-paste token manual.
