# Seruwit CRM — Ringkasan Project

CRM multi-tenant berbasis SaaS: setiap perusahaan (tenant) mendapatkan workspace sendiri di subdomain sendiri, dengan CMS + modul CRM lengkap yang datanya terisolasi penuh per tenant di level schema PostgreSQL.

## Teknologi

| Lapisan | Teknologi |
|---|---|
| Backend | Laravel 12, PHP 8.5 |
| Frontend | React 18 + Inertia.js v2 + TypeScript, Tailwind CSS v3, Vite |
| Autentikasi | Laravel Breeze (login email/username), Sanctum |
| Database | PostgreSQL — **satu database, satu schema per tenant** |
| Multi-tenancy | `stancl/tenancy` v3.10 (`PostgreSQLSchemaManager`) |
| Testing | PHPUnit 11 — 189 test, berjalan di PostgreSQL (database `seruwit_crm_testing`) |

## Arsitektur Multi-Tenant

```
seruwit.com  (central)          PostgreSQL: 1 database
├─ Landing page marketing       ├─ schema public (central)
├─ Registrasi tenant (SaaS)     │   tenants, domains, users (identitas global),
├─ Portal workspace + SSO       │   tenant_users, invitations, impersonation tokens
├─ Panel super admin            ├─ schema tenant_<id> per tenant
└─ Terima undangan              │   users, roles, permissions, pages, posts,
                                │   media, menus, settings, todos, dst.
acme.seruwit.com (tenant)
└─ Aplikasi CRM lengkap + website publik milik tenant
```

Konsep kunci:

- **Identifikasi via domain** — request ke subdomain/custom domain tenant otomatis mengalihkan seluruh koneksi database ke schema tenant tersebut (`search_path`). Kode aplikasi (model, controller) tidak perlu tahu-menahu soal tenant.
- **Identitas terpusat + resource syncing** — satu akun (email) bisa menjadi anggota banyak perusahaan dengan **peran berbeda di tiap perusahaan**. Nama/email/password tersinkron otomatis antara central dan semua tenant; role tetap lokal per tenant.
- **Provisioning otomatis** — pembuatan tenant memicu pipeline: buat schema → migrasi → seeding (roles, permissions, menus, settings). Workspace langsung siap pakai.
- **Isolasi menyeluruh** — data database (per schema), file upload (`storage/tenant_<id>/…`, disajikan via route asset tenancy), dan sesi login (cookie per domain).

## Fitur yang Sudah Dikembangkan

### Aplikasi CRM / CMS (berjalan per tenant)
- **Dashboard** per peran + pencarian global
- **Pages** — halaman CMS dengan page builder, penetapan homepage, render publik (`/p/{slug}`)
- **Posts & Blog** — manajemen artikel + blog publik (`/blog`)
- **Carousels** — carousel beserta manajemen & pengurutan gambar
- **Media Library** — upload, picker, bulk delete; file terisolasi per tenant
- **Menus** — menu dinamis per peran
- **Settings** — pengaturan situs per tenant (nama, logo, kontak, dsb.)
- **Users, Roles & Permissions** — RBAC custom per modul+aksi (view/create/update/delete); admin melewati semua cek
- **Todos, Live Updates, Analytics**
- **Profil** — edit profil, avatar, ganti password

### Landing Page (central)
- Tema CRM segar & minimalis, warna utama biru terang (sky blue): header sticky, hero dengan mockup dashboard pipeline, 6 kartu fitur, strip keunggulan, CTA gradasi biru, footer — konten diambil dari Settings.

### Autentikasi & Identitas
- Login dengan email **atau** username; pencatatan `last_login_at`
- Registrasi = **pendaftaran perusahaan** (nama, email, password, nama perusahaan, subdomain) → tenant dibuat → langsung SSO masuk workspace; registrasi dinonaktifkan di domain tenant
- Validasi subdomain: format, daftar reserved (`www`, `admin`, `api`, …), ketersediaan

### Portal Workspace & SSO
- `/workspaces` (central): daftar perusahaan milik user, klik → token impersonation sekali-pakai (TTL 60 detik) → sesi login terbuka di domain tenant
- Tenant switcher lintas domain tanpa login ulang

### Onboarding & Administrasi Platform
- **Dua pintu pembuatan tenant**: registrasi mandiri (SaaS) dan panel super admin (`/admin/tenants`: list, buat untuk pelanggan, tangguhkan/aktifkan) — gate `manage-tenants`
- **Penangguhan tenant**: seluruh request ke tenant suspended diblokir (403)
- **Sistem undangan**: admin workspace mengundang via email + pilihan peran; undangan berlaku 7 hari; penerima baru cukup set nama+password, penerima lama tinggal menerima — keduanya berakhir SSO langsung masuk workspace

## Perintah Penting

```bash
composer dev              # server + queue + log + vite sekaligus
php artisan test --compact
composer deploy           # migrate central + migrate semua tenant + cache config/route/view
php artisan tenants:migrate   # migrasi seluruh schema tenant
pg_dump -n 'tenant<id>' seruwit_crm   # backup satu tenant
```

## Konfigurasi Penting

| Kunci | Keterangan |
|---|---|
| `CENTRAL_SERVES_APP` | `true` (default, dev): CRM juga disajikan di central. **Set `false` di produksi** — central hanya landing, auth, portal, admin |
| `config/tenancy.php` | Schema manager PostgreSQL, central domains, bootstrapper (database, filesystem, queue aktif; cache menunggu Redis) |
| Migrasi | `database/migrations/` = central; `database/migrations/tenant/` = per tenant |
| Route | `routes/web.php` = central (prefix nama `central.`); `routes/tenant.php` = domain tenant; `routes/app.php` = aplikasi CRM bersama |

## Catatan Produksi

1. Wildcard DNS `*.domain.com` + wildcard SSL (Cloudflare/Caddy)
2. Ubah pipeline provisioning ke queued (`shouldBeQueued(true)`) + jalankan queue worker
3. PgBouncer harus *session mode* (schema separation bergantung `search_path`)
4. Aktifkan `CacheTenancyBootstrapper` saat pindah ke Redis (`CACHE_STORE=redis`)
