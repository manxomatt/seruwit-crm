# Document PDF Template Customization — Product & Engineering Design

**Audience:** Product, backend, frontend  
**Scope:** Tenant-level customization untuk dokumen PDF Rental Contract, Rental Handover, dan Invoice  
**Stack UI:** Laravel 12 + Inertia.js v2 + React 18 + Tailwind CSS v3  
**Renderer:** DomPDF via controller PDF existing  
**Status:** Plan disetujui untuk fase 1

---

## 1. Latar belakang

Saat ini tenant dapat menghasilkan 3 dokumen PDF utama selama proses bisnis rental:

1. `Rental Contract`
2. `Rental Handover / Berita Acara Serah Terima`
3. `Invoice`

Ketiga PDF tersebut masih memakai template Blade yang teks dan layout-nya hardcoded. Akibatnya:

- admin/pemilik tenant tidak bisa menyesuaikan wording bisnis masing-masing tenant,
- kebutuhan branding tenant belum fleksibel,
- perubahan kecil pada layout harus selalu melalui developer,
- dokumen sulit diadaptasi untuk variasi operasional tenant.

Target fitur ini adalah memberi kemampuan kepada admin/pemilik tenant untuk mengatur template dokumen PDF secara mandiri, tetapi tetap aman dan stabil untuk proses render PDF.

---

## 2. Tujuan fitur

Fitur ini dibuat agar tenant bisa:

- mengubah teks konten dokumen,
- memilih tata letak dasar dokumen,
- menampilkan atau menyembunyikan section tertentu,
- melakukan preview hasil template,
- mengembalikan template ke default bawaan sistem.

Fitur ini **tidak** ditujukan untuk menjadi page builder bebas penuh. Fokus fase 1 adalah fleksibilitas yang cukup, tetapi tetap stabil saat render DomPDF.

---

## 3. Keputusan produk yang dikunci

| Area | Keputusan |
|---|---|
| Lokasi pengaturan | Tambahan tab baru di `Rental Settings` |
| Scope | Per tenant |
| Dokumen yang didukung | Contract, Handover, Invoice |
| Engine editor | Controlled editor + rich text terbatas |
| Penyimpanan fase 1 | `settings` tenant dalam format JSON |
| Render PDF | Tetap memakai Blade PDF existing sebagai shell |
| Preview | Menggunakan sample data rental/invoice nyata |
| Permission | Reuse permission `rental,view` dan `rental,update` |
| Reset | Per dokumen, kembali ke default sistem |

### Anti-pola

Hal berikut **tidak** masuk fase 1:

- raw HTML/CSS bebas penuh dari user,
- drag-and-drop layout builder,
- custom Blade template per tenant,
- multi-version publish workflow,
- multi-language template per dokumen,
- attachment PDF otomatis ke email.

---

## 4. Pendekatan desain

### 4.1 Prinsip utama

Karena dokumen dirender ke PDF, desain harus mengutamakan:

- kestabilan layout saat print,
- konsistensi data bisnis,
- keamanan dari input HTML liar,
- fallback yang aman jika tenant belum pernah mengatur template.

Karena itu fase 1 memakai pendekatan:

- **layout preset**
- **section-based content**
- **rich text hanya pada area tertentu**
- **placeholder whitelist**

### 4.2 Kenapa bukan editor bebas

PDF bisnis sering rusak jika user diberi kebebasan HTML/CSS total:

- page break tidak konsisten,
- tabel panjang pecah tidak rapi,
- posisi signature mudah bergeser,
- CSS DomPDF tidak sekuat browser modern.

Jadi untuk fase 1, sistem akan tetap mengontrol shell layout dan area render utama, sementara tenant hanya mengatur bagian yang memang aman untuk diubah.

---

## 5. Dokumen yang dikelola

Tenant dapat mengelola 3 template:

| Code | Dokumen | Modul render |
|---|---|---|
| `rental_contract` | Perjanjian sewa kendaraan | Rental |
| `rental_handover` | Berita acara serah terima | Rental |
| `rental_invoice` | Invoice | Invoicing |

Masing-masing template memiliki:

- `name`
- `layout_preset`
- `content`
- `options`

---

## 6. Lokasi fitur di UI

Fitur ditambahkan sebagai tab baru di halaman `Rental Settings`.

### Tab settings

- `General`
- `Rates`
- `Document Templates` ← baru

Alasan penempatan:

- Contract dan Handover jelas berada dalam domain Rental
- Invoice masih bagian dari rangkaian proses rental untuk tenant
- admin cukup membuka satu area pengaturan untuk semua dokumen operasional rental

---

## 7. Desain UI fase 1

Satu halaman editor dengan tiga area utama.

### 7.1 Sidebar kiri

Daftar dokumen:

- Kontrak Rental
- Berita Acara Serah Terima
- Invoice

Fungsi:

- memilih dokumen aktif untuk diedit,
- menampilkan status apakah template masih default atau sudah dikustomisasi.

### 7.2 Panel tengah

Form editor template:

- Nama template
- Preset layout:
  - `Classic`
  - `Compact`
  - `Corporate`
- Toggle section:
  - tampilkan logo
  - tampilkan alamat perusahaan
  - tampilkan nomor telepon
  - tampilkan footer
  - tampilkan block tanda tangan
  - toggle spesifik per dokumen
- Text content:
  - title
  - subtitle
  - intro HTML
  - terms HTML
  - notes label
  - footer HTML

### 7.3 Panel kanan

Panel bantuan:

- daftar placeholder siap pakai,
- keterangan scope setiap placeholder,
- tombol preview,
- tombol reset ke default.

---

## 8. Komponen konten yang bisa dikustomisasi

### 8.1 Rental Contract

Bagian yang bisa diatur:

- judul dokumen,
- subjudul,
- intro,
- label ringkasan biaya,
- ketentuan singkat,
- footer,
- tampil/sembunyikan signature block,
- tampil/sembunyikan identitas perusahaan.

### 8.2 Rental Handover

Bagian yang bisa diatur:

- judul dokumen,
- subjudul,
- intro,
- label checkout,
- label return,
- tampil/sembunyikan damage section,
- tampil/sembunyikan signature block,
- footer.

### 8.3 Invoice

Bagian yang bisa diatur:

- judul invoice,
- subtitle,
- label bill-to,
- footer / catatan pembayaran,
- tampil/sembunyikan stamp lunas,
- tampil/sembunyikan signature block,
- tampil/sembunyikan identitas perusahaan.

---

## 9. Placeholder system

User tidak memasukkan Blade syntax bebas. Sistem menyediakan placeholder whitelist yang di-resolve aman saat render.

### Contoh placeholder contract

- `{{ rental.code }}`
- `{{ rental.start_date }}`
- `{{ rental.end_date }}`
- `{{ rental.total_amount }}`
- `{{ partner.name }}`
- `{{ partner.code }}`
- `{{ vehicle.name }}`
- `{{ vehicle.plate_number }}`
- `{{ company.name }}`
- `{{ today }}`

### Contoh placeholder handover

- `{{ rental.code }}`
- `{{ partner.name }}`
- `{{ vehicle.name }}`
- `{{ vehicle.plate_number }}`
- `{{ checkout.time }}`
- `{{ return.time }}`
- `{{ company.name }}`

### Contoh placeholder invoice

- `{{ invoice.code }}`
- `{{ invoice.issue_date }}`
- `{{ invoice.due_date }}`
- `{{ invoice.total }}`
- `{{ partner.name }}`
- `{{ company.name }}`

---

## 10. Penyimpanan data fase 1

Untuk fase 1, template disimpan di `settings` tenant agar implementasi lebih cepat, minim migration baru, dan mengikuti pola settings modul yang sudah ada.

### Grup settings

Disimpan dalam group private module, misalnya `rental_internal`.

### Key yang direncanakan

- `rental.document_templates`

Value disimpan sebagai JSON object yang memuat seluruh konfigurasi 3 dokumen.

### Contoh shape data

```json
{
  "rental_contract": {
    "name": "Template Kontrak Default",
    "layout_preset": "classic",
    "content": {
      "title": "Perjanjian Sewa Kendaraan",
      "subtitle": "{{ rental.code }} - {{ today }}",
      "intro_html": "<p>Dokumen ini merupakan perjanjian resmi...</p>",
      "terms_html": "<ol><li>Penyewa bertanggung jawab...</li></ol>",
      "notes_label": "Catatan",
      "footer_html": "<p>Dokumen ini sah tanpa cap basah.</p>"
    },
    "options": {
      "show_logo": true,
      "show_address": true,
      "show_phone": true,
      "show_footer": true,
      "show_signature": true
    }
  }
}
```

### Catatan evolusi

Jika kebutuhan tenant berkembang, fase berikutnya dapat dipindahkan ke tabel terpisah seperti `document_templates` dan `document_template_versions`. Namun itu belum diperlukan untuk fase 1.

---

## 11. Arsitektur backend

### 11.1 Service utama

Direncanakan satu service:

- `DocumentTemplateManager`

Tanggung jawab:

- menyediakan default template,
- mengambil template tenant,
- merge template tenant dengan default,
- menyimpan update,
- reset per dokumen,
- resolve placeholder untuk preview dan PDF final.

### 11.2 Request validation

Request baru:

- `UpdateDocumentTemplateRequest`

Validasi mencakup:

- code dokumen valid,
- preset layout valid,
- field content berbentuk string,
- options boolean,
- hanya section yang diizinkan yang boleh dikirim.

### 11.3 Controller

Endpoint yang direncanakan:

- `GET /rental/settings?tab=documents`
- `PATCH /rental/settings/documents/{code}`
- `POST /rental/settings/documents/{code}/reset`
- `GET /rental/settings/documents/{code}/preview`

Fungsi:

- render halaman settings tab documents,
- simpan perubahan template,
- reset ke default,
- preview sample PDF.

---

## 12. Integrasi dengan PDF existing

Controller render PDF saat ini tetap dipakai:

- `RentalPdfController`
- `InvoicePdfController`

Perubahan fase 1:

- controller memanggil `DocumentTemplateManager`,
- manager mengembalikan payload template resolved,
- Blade PDF existing tetap menjadi shell layout,
- teks hardcoded dipindah bertahap menjadi variable template.

### Pola render

Saat request PDF:

1. controller load data bisnis seperti sekarang,
2. manager resolve template tenant untuk jenis dokumen,
3. placeholder dirender ke nilai final,
4. Blade menerima:
   - data bisnis,
   - company info,
   - template content,
   - template options,
   - preset layout.

---

## 13. Preview flow

Preview fase 1 memakai data nyata agar hasilnya realistis.

### Contract / Handover

Ambil sample rental terbaru yang eligible:

- contract: minimal confirmed
- handover: active / returned / completed

### Invoice

Ambil sample invoice terbaru:

- issued
- paid

Jika belum ada data sample, UI menampilkan empty state yang menjelaskan bahwa preview membutuhkan data dokumen nyata.

---

## 14. Permission dan akses

Fase 1 akan reuse permission modul Rental:

- view page: `permission:rental,view`
- update template: `permission:rental,update`

Target user:

- admin tenant
- owner / role setara yang memang sudah punya akses pengaturan rental

---

## 15. Scope fase 1

### In scope

- tab `Document Templates`
- edit 3 dokumen
- preset layout
- show/hide section
- rich text untuk intro, terms, footer
- placeholder whitelist
- preview
- reset ke default

### Out of scope

- HTML/CSS bebas penuh
- version history
- publish/draft workflow
- multi-language template
- send PDF attachment otomatis
- editor drag-and-drop

---

## 16. Rencana implementasi teknis

### Langkah 1

- tambah `documents` sebagai tab baru di Rental Settings
- share props template ke Inertia page

### Langkah 2

- buat `DocumentTemplateManager`
- siapkan default config untuk 3 dokumen
- simpan template di `settings`

### Langkah 3

- buat form editor Inertia React
- pakai `HtmlEditor` untuk area rich text
- tambah preview, save, reset

### Langkah 4

- integrasikan Contract PDF ke resolver template
- integrasikan Handover PDF ke resolver template
- integrasikan Invoice PDF ke resolver template

### Langkah 5

- tambahkan feature test backend minimal:
  - tab documents render,
  - update template tersimpan,
  - reset kembali ke default,
  - PDF tetap bisa di-stream setelah template aktif.

---

## 17. Risiko dan mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| HTML user merusak tampilan PDF | PDF rusak saat print | pakai controlled fields + whitelist area editor |
| Placeholder salah tulis | hasil dokumen tidak sesuai | tampilkan daftar placeholder dan fallback aman |
| Belum ada sample preview | preview kosong | tampilkan empty state informatif |
| Invoice ada di modul berbeda | integrasi lintas modul | resolver dibuat netral di level app/support |
| Tenant ingin kebebasan penuh layout | ekspektasi berlebih | komunikasikan batasan fase 1 sejak awal |

---

## 18. Arah pengembangan setelah fase 1

Fase lanjutan yang memungkinkan:

1. version history template
2. duplicate template
3. publish / draft
4. multi-language per template
5. custom branding lebih kaya
6. kirim PDF attachment otomatis via email
7. migrasi storage dari `settings` ke tabel dedicated jika kompleksitas meningkat

---

## 19. Ringkasan keputusan akhir

Untuk fase 1, fitur ini akan dibangun dengan prinsip:

- **aman untuk PDF**
- **cukup fleksibel untuk tenant**
- **cepat diintegrasikan ke codebase saat ini**

Pendekatan final:

- UI di tab baru `Rental Settings > Document Templates`
- penyimpanan memakai `settings` tenant JSON
- editor berbasis section + preset
- render PDF tetap memakai Blade existing
- preview dan reset tersedia sejak fase 1

Dokumen ini menjadi acuan implementasi tahap awal fitur custom template PDF tenant.
