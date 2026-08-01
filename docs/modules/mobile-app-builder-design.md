# Mobile App Builder (Tenant AAB)
## Platform Design Document

**Feature key:** `mobile_apps` (modul Foundation baru — *platform capability*, bukan vertikal bisnis)  
**UI label:** Mobile App  
**Depends on (hard):** `media` (ikon/splash)  
**Soft depends on:** `shuttle` / `rental` (surface booking yang di-bundle; entitlement “boleh generate” mengikuti vertikal terpasang)  
**Tidak bergantung pada:** Inertia CRM pages sebagai isi app — shell mobile adalah **repo React terpisah**

**New tables (MVP):** 3 · **New pages (CRM):** 3 · **Repo eksternal:** 1 (Capacitor shell)  
**Estimasi file inti di CRM:** ~20  
**Prasyarat produk:** kanal booking publik stabil (Shuttle §14 P0–P2; Rental public channel setara)

> **Keputusan inti:** Satu template Capacitor + React (bundled assets, **bukan** WebView remote URL). Tiap tenant mengisi branding + target API → Laravel **mengorkestrasi** build → GitHub Actions **mengeksekusi** `npm run build` + `bundleRelease` → artifact `.aab` kembali ke CRM untuk diunduh. Bukan satu listing Play Store multi-tenant.
>
> **Google Play:** sepenuhnya tanggung jawab **masing-masing tenant**. Seruwit tidak punya / tidak mengelola Play Console tenant; batas produk = unduh `.aab` siap upload. Tenant yang buat akun Play, listing, privacy policy, content rating, upload, review, dan release.

---

## 0. Tujuan & Batasan MVP

### Problem
Tenant travel/rental ingin app Android bermerek sendiri di Play Store. Membangun native per tenant tidak scalable. Remote WebView ke URL rentan terhadap offline/UX store review dan tidak sesuai keputusan produk (bundle React di dalam Capacitor).

### Opportunity
White-label **CI**: satu source shell, inject config per build, kelola seluruh siklus hidup dari workspace Laravel tenant.

### Personas

| Persona | Kebutuhan |
|---|---|
| **Owner / admin tenant** | Isi nama app, ikon, warna, package id → klik Build → unduh `.aab` → **upload & kelola sendiri di Play Console mereka** |
| **Ops platform (Seruwit)** | Pantau gagal build, kuota Actions, keystore platform, rate limit — **bukan** akun/listing Play tenant |
| **End user (penumpang / penyewa)** | Install app bermerek tenant dari Play (listing tenant); booking lewat UI React lokal + API tenant |

### In scope (MVP)

- CRUD **profil app** per tenant (1 profil aktif per `vertical` + `platform=android` di MVP)
- Trigger build `.aab` dari UI CRM via GitHub Actions `workflow_dispatch`
- Lacak status build + simpan artifact di storage tenant
- Inject build-time: `appId`, `appName`, `apiBaseUrl`, theme, icon/splash, `enabledSurfaces`
- Signing dengan **keystore platform** (satu keystore Seruwit di GitHub Secrets) — cukup untuk sideload / internal testing; dokumentasikan batasan Play
- Checklist bantuan di UI: langkah upload manual ke Play Console **tenant** (bukan otomasi)
- Rate limit build + permission + entitlement paket
- Callback aman (HMAC / one-time token) dari CI → Laravel

### Out of scope (fase berikutnya)

- iOS / `.ipa` / App Store Connect
- Keystore **per tenant** + Play Console API upload otomatis (dan segala otomasi atas akun Play tenant)
- Mengelola / menyimpan kredensial Play Console tenant di Seruwit
- OTA / Capgo / live update bundle JS tanpa republish store
- Push notification FCM end-to-end (hanya siapkan hook opsional)
- App Gallery / sideload portal terkelola
- Build di dalam proses PHP/Herd (Android SDK di app server)
- Satu binary / satu `applicationId` untuk semua tenant
- Satu Play Developer account / listing multi-tenant yang dioperasikan Seruwit

### Anti-pola (jangan)

- WebView `server.url` ke situs tenant sebagai isi utama app
- Fork repo Capcitor per tenant
- Menyimpan GitHub PAT di browser / `.env` tenant
- Menjalankan Gradle di queue worker Laravel produksi
- Memakai session cookie CRM Inertia untuk auth app mobile
- Menganggap PWA publik = pengganti penuh tanpa API contract yang eksplisit untuk native client

---

## 1. Posisi di arsitektur platform

```
Central (Seruwit)                    Tenant schema
─────────────────                    ─────────────
GITHUB_* config                      mobile_app_profiles
callback HMAC secret                 mobile_app_builds
(opsional) build quota global        mobile_app_build_events (opsional)
                                     media: icon / splash

Repo: seruwit-mobile-booking-shell   GitHub Actions
(React + Capacitor, terpisah)   ←──  npm build → cap sync → bundleRelease
```

| Lapisan | Peran |
|---|---|
| **Laravel CRM** | Control plane: UI, validasi, antrian, otorisasi, penyimpanan `.aab`, riwayat |
| **GitHub Actions** | Build farm: inject config, build React, sync Capacitor, sign, artifact |
| **Mobile shell repo** | Satu template bundled SPA; tidak berisi logika CRM staff |
| **Public booking API** | Runtime data (jadwal, hold, OTP, tiket) — sudah / akan ada di modul vertikal |

**Tier:** `Foundation` — kemampuan platform lintas vertikal, bukan operasi travel/rental itu sendiri.

**Layering:** `mobile_apps` boleh soft-check `shuttle` / `rental` terpasang; jangan hard-`requires` keduanya (tenant bisa hanya salah satu).

---

## 2. Keputusan arsitektur

| Aspek | Keputusan | Alasan |
|---|---|---|
| Isi WebView | **Bundled** hasil `vite build` di `dist/` / `android/app/src/main/assets/public` | Offline shell; review store lebih jelas; sesuai brief |
| Remote URL | **Tidak** sebagai primary content | Update web ≠ update binary; produk memilih bake |
| Orkestrasi | Laravel | UX tenant + multi-tenant auth sudah ada |
| Eksekusi build | GitHub Actions | SDK/JDK/RAM; secrets keystore; menit CI terukur |
| Source shell | Repo terpisah (bukan `resources/js` Inertia) | Surface B2C ≠ CRM; release cycle berbeda |
| Identitas app | 1 `applicationId` per tenant (+ per surface bila perlu) | Listing Play terpisah; branding jujur |
| Config tenant | Bake saat CI + sebagian theme dari API `/mobile/bootstrap` | Bake untuk identitas native; API untuk data yang sering berubah |
| Auth end user | Token setelah OTP (Sanctum personal access / token khusus mobile) | Origin `capacitor://` ≠ domain tenant |
| Signing MVP | Keystore platform di Actions secrets | Sederhana; cukup internal/closed testing |
| Google Play | **Tenant-owned** — akun, listing, upload, release di tangan tenant | Seruwit hanya supply `.aab`; hindari liability & ops Play Console |
| OTA | Belum | Kurangi scope; dokumentasikan sebagai P2 |

### Hubungan dengan Shuttle §14 / Rental

```
PWA publik (/book/…)     = surface web (sudah / paralel)
Mobile shell (bundled)   = surface native yang memanggil API yang sama
```

Jangan duplikasi domain booking. Shell hanya UI client; spine tetap `ShuttleBooking` / Rental booking + `channel = passenger` (atau setara rental).

Urutan produk yang disarankan:

1. Public API booking stabil (sudah untuk Shuttle P0–P2)
2. Kontrak OpenAPI/`/api/mobile/*` yang dipakai shell
3. Template Capacitor + workflow manual
4. Modul CRM `mobile_apps` (dokumen ini)
5. OTA / keystore per tenant / iOS

---

## 3. Komponen sistem

### 3.1 Modul Laravel `modules/MobileApps/`

```
modules/MobileApps/
├─ MobileAppsModule.php          # key mobile_apps, tier Foundation, menus, permissions
├─ Database/Migrations/
│  ├─ …_create_mobile_app_profiles_table.php
│  └─ …_create_mobile_app_builds_table.php
├─ Http/
│  ├─ Controllers/
│  │  ├─ MobileAppProfileController.php
│  │  ├─ MobileAppBuildController.php
│  │  └─ MobileAppBuildCallbackController.php   # central/internal
│  └─ Requests/
│     ├─ UpdateMobileAppProfileRequest.php
│     └─ StoreMobileAppBuildRequest.php
├─ Models/
│  ├─ MobileAppProfile.php
│  └─ MobileAppBuild.php
├─ Jobs/
│  ├─ DispatchGithubMobileBuild.php
│  └─ PollGithubMobileBuildStatus.php           # fallback jika webhook terlambat
├─ Services/
│  ├─ GithubActionsClient.php
│  ├─ MobileBuildConfigAssembler.php            # susun inputs + tenant-config.json
│  └─ MobileBuildArtifactIngester.php
└─ resources/js/Pages/MobileApps/
   ├─ Index.tsx          # profil + status terakhir
   ├─ Edit.tsx           # form branding / package
   └─ Builds/Index.tsx   # riwayat + download
```

Callback boleh di **central routes** (`routes/web.php` / `routes/api.php` central) karena dipanggil GitHub tanpa cookie tenant; body membawa `tenant_id` + `build_uuid` lalu `tenancy()->initialize()`.

### 3.2 Repo shell `seruwit-mobile-booking-shell` (eksternal)

```
seruwit-mobile-booking-shell/
├─ package.json                 # React 18 + Vite + Capacitor 6/7
├─ capacitor.config.ts          # appId/appName di-overwrite CI
├─ index.html
├─ public/
│  └─ tenant-config.json        # diganti CI sebelum build (fallback kosong di git)
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ config/loadTenantConfig.ts
│  ├─ api/client.ts             # baseURL dari config; Bearer token
│  ├─ features/
│  │  ├─ shuttle/…              # screen booking travel (feature-flagged)
│  │  └─ rental/…               # screen booking rental (feature-flagged)
│  └─ theme/applyTheme.ts
├─ android/                     # committed Cap project
├─ resources/                   # icon-only placeholders; diganti CI
├─ scripts/
│  └─ apply-tenant-config.mjs   # tulis config, unduh icon, patch capacitor + strings.xml
└─ .github/workflows/
   └─ build-aab.yml
```

Prinsip shell:

- **Satu** codebase; surface diaktifkan lewat `enabledSurfaces: ["shuttle"]`.
- Tidak embed token staff CRM.
- Semua data bisnis via HTTPS ke `apiBaseUrl`.
- Deep link opsional: `https://{tenant}/book/...` → buka screen yang sama (P1).

### 3.3 GitHub Actions workflow

**Trigger:** `workflow_dispatch` (+ `repository_dispatch` opsional dengan payload JSON lebih kaya).

**Inputs (MVP):**

| Input | Contoh |
|---|---|
| `build_id` | UUID build di CRM |
| `tenant_id` | `acme` |
| `package_id` | `com.acme.travel` |
| `app_name` | `ACME Travel` |
| `api_base_url` | `https://acme.seruwit.test` |
| `version_name` | `1.0.3` |
| `version_code` | `12` |
| `primary_color` | `#0B6E4F` |
| `enabled_surfaces` | `shuttle` (CSV) |
| `icon_url` | signed URL media |
| `splash_url` | signed URL media |
| `callback_url` | `https://seruwit.test/api/internal/mobile-builds/callback` |
| `callback_token` | one-time |

**Steps (ringkas):**

1. Checkout shell @ `main` (atau tag release shell yang di-pin di config Laravel)
2. `node scripts/apply-tenant-config.mjs` (env dari inputs)
3. `npm ci` → `npm run build`
4. `npx cap sync android`
5. Decode keystore dari secret → `signingConfigs` release
6. `./gradlew bundleRelease`
7. Upload artifact Actions + `curl` callback `status=success` + URL unduh sementara **atau** upload langsung ke Laravel presigned PUT
8. `if: failure()` → callback `status=failed` + cuplikan log

**Pinning:** CRM menyimpan `shell_ref` (tag semver shell, mis. `v1.4.0`) di profile/build agar tenant tidak ikut breaking change tak terkendali.

---

## 4. Model data

### 4.1 `mobile_app_profiles` (tenant)

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | ulid/uuid | |
| `platform` | string | MVP: `android` |
| `vertical` | string | `shuttle` \| `rental` \| `combined` (MVP awal: satu vertical per profil) |
| `app_name` | string | Max 30 (batas launcher) |
| `package_id` | string | `com.company.app` — unik per tenant; validasi format Java package |
| `api_base_url` | string | Default: origin tenant saat ini; harus host milik tenant |
| `primary_color` | string | Hex |
| `icon_media_id` | fk nullable | Media ≥ 512×512 PNG |
| `splash_media_id` | fk nullable | |
| `enabled_surfaces` | json | `["shuttle"]` |
| `shell_ref` | string | Tag repo shell, default dari `config('mobile_apps.default_shell_ref')` |
| `version_name` | string | Semver yang akan dipakai build berikutnya |
| `next_version_code` | unsigned int | Auto-increment tiap build sukses |
| `is_active` | bool | |
| `timestamps` | | |

Unique: `(platform, package_id)` dalam tenant; praktik: satu baris android aktif dulu.

### 4.2 `mobile_app_builds` (tenant)

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | ulid/uuid | Dipakai sebagai `build_id` ke CI |
| `mobile_app_profile_id` | fk | |
| `status` | string | lihat state machine |
| `version_name` | string | Snapshot saat dispatch |
| `version_code` | unsigned int | Snapshot |
| `shell_ref` | string | Snapshot |
| `config_snapshot` | json | Seluruh inputs yang dikirim (audit) |
| `github_run_id` | string nullable | Diisi setelah run diketahui |
| `github_run_url` | string nullable | Untuk debug ops |
| `artifact_path` | string nullable | Path storage tenancy |
| `artifact_bytes` | unsigned bigint nullable | |
| `artifact_sha256` | string nullable | |
| `error_message` | text nullable | Pesan aman untuk UI |
| `error_log` | text nullable | Cuplikan CI (ops / admin) |
| `callback_token_hash` | string | Hash token one-time |
| `queued_at` / `started_at` / `finished_at` | timestamps nullable | |
| `requested_by` | fk users | |
| `timestamps` | | |

### 4.3 State machine

```
draft? (tidak perlu)
   → queued          # record dibuat, job dispatch diantrikan
   → dispatching     # HTTP ke GitHub OK / sedang kirim
   → building        # run Actions running (dari poll/callback started)
   → ingesting       # mengunduh/menyimpan artifact
   → ready           # .aab tersedia
   → failed          # terminal
   → cancelled       # opsional MVP+
```

Transisi ilegal ditolak di model/service. Retry = **build baru** (row baru), bukan mutate `failed` → `queued` tanpa jejak.

### 4.4 Central config (bukan tabel tenant)

`config/mobile_apps.php` + env:

```
MOBILE_APPS_GITHUB_TOKEN=
MOBILE_APPS_GITHUB_OWNER=
MOBILE_APPS_GITHUB_REPO=seruwit-mobile-booking-shell
MOBILE_APPS_GITHUB_WORKFLOW=build-aab.yml
MOBILE_APPS_DEFAULT_SHELL_REF=v1.0.0
MOBILE_APPS_CALLBACK_HMAC=          # atau derive dari APP_KEY
MOBILE_APPS_MAX_BUILDS_PER_DAY=3
MOBILE_APPS_ARTIFACT_DISK=local     # mengikuti tenancy filesystems
```

Jangan `env()` di luar config.

---

## 5. Alur end-to-end

```
┌─────────────┐  validate   ┌──────────────────┐  workflow_dispatch  ┌──────────────┐
│ Tenant UI   │ ──────────► │ Laravel          │ ──────────────────► │ GitHub       │
│ Build AAB   │             │ MobileAppBuild   │                     │ Actions      │
└─────────────┘             │ + Job Dispatch   │                     └──────┬───────┘
                            └────────┬─────────┘                            │
                                     │                                      │ apply-tenant
                                     │                                      │ npm run build
                                     │                                      │ cap sync
                                     │                                      │ bundleRelease
                                     │         callback + artifact          │
                                     │ ◄────────────────────────────────────┘
                                     ▼
                            storage/tenant_…/mobile-apps/{build}.aab
                                     ▼
                            UI status ready + Download
```

### Sequensi detail

1. User buka **Mobile App → Edit**: isi nama, package, warna, upload icon/splash, pilih surfaces.
2. Validasi: format `package_id`, icon size, `api_base_url` host ∈ domain tenant, vertical terpasang.
3. User klik **Generate AAB**.
4. `StoreMobileAppBuildRequest`: cek tidak ada build `queued|dispatching|building|ingesting`; cek kuota harian; authorize permission.
5. Snapshot config → `MobileAppBuild` `queued` → dispatch `DispatchGithubMobileBuild`.
6. Job panggil `GithubActionsClient::dispatch(...)`; update `dispatching` → setelah OK biarkan `building` (atau tunggu callback `started`).
7. Actions build; on success: prefer **presigned upload** ke Laravel **atau** callback berisi artifact URL + Laravel job unduh.
8. `MobileBuildArtifactIngester` verifikasi ukuran/sha, simpan path, status `ready`, increment `next_version_code` pada profile.
9. On failure: status `failed`, simpan `error_message` user-safe.
10. Fallback: `PollGithubMobileBuildStatus` tiap N menit untuk build yang stuck > threshold.

---

## 6. Inject config (bundled React)

### 6.1 `tenant-config.json` (di-bake)

```json
{
  "tenantId": "acme",
  "appName": "ACME Travel",
  "apiBaseUrl": "https://acme.seruwit.com",
  "primaryColor": "#0B6E4F",
  "enabledSurfaces": ["shuttle"],
  "buildId": "019…",
  "versionName": "1.0.3",
  "versionCode": 12,
  "minApiVersion": 1
}
```

Vite memasukkan file ini ke `public/` sebelum build sehingga tersedia di runtime sebagai `/tenant-config.json` di dalam asset Capacitor.

Alternatif/komplemen: `import.meta.env.VITE_*` via `define` di `apply-tenant-config.mjs` — pilih **satu** sumber kebenaran (disarankan file JSON agar mudah di-audit di `config_snapshot`).

### 6.2 Native patches (script CI)

- `capacitor.config.ts`: `appId`, `appName`
- `android/app/build.gradle`: `applicationId`, `versionCode`, `versionName`
- `res/mipmap*` + splash dari icon/splash URL
- `strings.xml`: `app_name`

### 6.3 Runtime bootstrap (opsional P1)

`GET {apiBaseUrl}/api/mobile/v1/bootstrap` mengembalikan nama dagang terbaru, toggle payment, feature flags — **tanpa** mengganti `applicationId`. Theme berat tetap dari bake agar splash/launcher konsisten.

---

## 7. Kontrak API untuk shell (runtime)

> **Desain penuh (request/response, auth, error code, urutan implementasi):**  
> [`mobile-booking-api-design.md`](./mobile-booking-api-design.md)

Prefix: `/api/mobile/v1` di **domain tenant** (tenancy middleware + throttle ketat).

| Area | Endpoint (sketsa) | Keterangan |
|---|---|---|
| Bootstrap | `GET /bootstrap` | Branding ringan + flags |
| Auth | `POST /auth/otp/send`, `POST /auth/otp/verify` | Issue Bearer token |
| Shuttle | corridors, departures, holds, tickets, pay, bookings | Façade JSON atas service PWA |
| Rental | stub sampai channel publik siap | |

Header: `Authorization: Bearer`, `X-App-Version`, `Idempotency-Key` (hold/pay).

**Reuse:** delegasi ke `PassengerBookingService` / OTP / Midtrans yang sama dengan `/book/shuttle`. Response JSON murni; CORS hanya untuk `/api/mobile/*`.


---

## 8. Signing, Play Store, dan distribusi

### Keputusan terkunci: Play diserahkan ke tenant

Seruwit **tidak** menjadi publisher Play untuk app tenant. Setiap tenant:

1. Memiliki / mendaftar **Play Console** sendiri (biaya developer Google ditanggung tenant).
2. Membuat listing sendiri (`applicationId` = `package_id` dari profil CRM).
3. Mengunduh `.aab` dari CRM lalu **upload manual** (Internal testing → Closed → Production sesuai proses mereka).
4. Mengurus store listing, screenshots, privacy policy, content rating, Data safety, dan komunikasi review Google.

Seruwit hanya: build, sign (keystore platform MVP), simpan artifact, sediakan checklist bantuan.

### MVP

| Item | Keputusan |
|---|---|
| Keystore | Satu platform keystore di GitHub Secrets (`MOBILE_UPLOAD_KEYSTORE_BASE64`, alias, passwords) |
| Output | `.aab` signed |
| Distribusi | Tenant unduh dari CRM → upload manual ke **Play Console milik tenant** **atau** internal testing / sideload |
| `applicationId` | Unik per tenant → **listing terpisah** di akun Play tenant |
| Play Console / Developer API | **Tidak** diintegrasikan di MVP; kredensial Play tidak disimpan di Seruwit |

### Batasan yang harus ditampilkan di UI

- Biaya developer Play, review Google, dan kebijakan store per `applicationId` = tanggung jawab tenant.
- Seruwit tidak mengupload, tidak memonitor status review Play, dan tidak memiliki akses ke Play Console tenant.
- Keystore platform berarti untuk publish produksi jangka panjang tenant idealnya migrasi ke **Play App Signing** / keystore mereka sendiri (P2); dokumentasikan risiko upgrade signing.
- Play memerlukan privacy policy URL, content rating, Data safety, dsb. — di luar otomasi MVP; sediakan checklist di halaman bantuan.

### P2 (nanti) — tetap opsional; default tetap tenant-owned Play

- Generate/upload keystore terenkripsi per tenant (KMS) agar cocok dengan Play App Signing milik tenant.
- Integrasi Play Developer API **hanya jika** tenant secara eksplisit menghubungkan akun mereka (OAuth / service account mereka) — bukan akun Seruwit bertindak sebagai publisher.
- iOS: Fastlane + App Store Connect API (runner macOS), model kepemilikan setara (tenant-owned).

---

## 9. UI CRM (Inertia)

### Halaman

1. **MobileApps/Index** — ringkasan profil, status build terakhir, CTA Edit / Build / Download.
2. **MobileApps/Edit** — form profil + preview warna + upload icon/splash (komponen Media existing).
3. **MobileApps/Builds** — tabel riwayat: versi, status, waktu, error, unduh bila `ready`.

### UX rules

- Satu composition: fokus “App Android tenant”, bukan dashboard metrik.
- Selama `building`: polling Inertia (`router.reload({ only: ['latestBuild'] })`) atau poll interval 5–10s; kosongkan dengan skeleton.
- Tombol Build disabled jika ada build aktif atau kuota habis; tampilkan sisa kuota.
- Download lewat route authorized (bukan URL storage publik mentah).

### Menu

Di bawah Settings / Workspace (bukan di dalam menu Shuttle operasional):

- Label: **Mobile App**
- Visible jika modul `mobile_apps` terpasang **dan** (opsional) minimal satu surface vertikal eligible terpasang.

---

## 10. Permissions, entitlement, multi-tenancy

### Permissions (tenant)

| Permission | Arti |
|---|---|
| `mobile_apps.view` | Lihat profil & riwayat |
| `mobile_apps.manage` | Edit profil branding |
| `mobile_apps.build` | Trigger generate AAB |
| `mobile_apps.download` | Unduh artifact |

Admin role tenant: semua. Role lain: assign lewat UI roles existing.

### Entitlement

- Modul `mobile_apps` dijual lewat **plan** (central `plans` / module_settings).
- Soft gate tambahan: `enabled_surfaces` hanya boleh berisi vertikal yang `isInstalled` + entitled.
- Super admin boleh melihat agregat gagal build (fase ops; bukan MVP wajib).

### Isolasi

- Row & file di schema/storage tenant.
- Callback central meng-`initialize` tenant dari `tenant_id` terpercaya + token build.
- Validasi `api_base_url` / icon URL tidak boleh keluar dari domain/media tenant.

---

## 11. Keamanan

| Ancaman | Mitigasi |
|---|---|
| PAT bocor ke frontend | Token hanya server; Jobs memakai config |
| Callback palsu | One-time token hashed; HMAC body; expire 2 jam; bind `build_id` |
| SSRF via `icon_url` | Hanya URL media internal / signed milik tenant |
| Package id tabrakan antar tenant | Unik di tenant; edukasi unik global di Play (validasi format saja di MVP) |
| Abuse CI menit | Rate limit harian + max 1 concurrent build / tenant |
| Artifact bocor | Download gated permission + temporary signed route |
| Log CI berisi secret | Mask di workflow; `error_log` di-sanitize sebelum simpan |

---

## 12. Observability & operasi

- Simpan `github_run_url` untuk debug.
- Log Laravel: `mobile_apps.build.{queued,dispatched,ready,failed}`.
- Alert ops (P1): gagal berturut-turut / queue stuck > 30 menit.
- Metric kasar: jumlah build/hari, success rate (bisa dari query table).

---

## 13. Testing

### Feature tests CRM

- Unauthorized tidak bisa build/download.
- Validasi `package_id` / concurrent build / kuota.
- Dispatch job dipanggil dengan inputs benar (`Http::fake` ke api.github.com).
- Callback success → `ready` + file ada; token reuse ditolak.
- Callback untuk build orang lain / tenant salah → 403/404.
- Surface `shuttle` ditolak jika modul belum terpasang.

### Shell / CI

- Unit script `apply-tenant-config.mjs` (Node).
- Workflow diuji manual di repo shell dulu sebelum wiring CRM.
- Contract test API mobile (PHPUnit) untuk endpoint yang dikonsumsi shell.

Jangan mengandalkan tinker sebagai verifikasi utama.

---

## 14. Phased delivery

| Fase | Isi | Exit criteria |
|---|---|---|
| **M0** | Repo shell + workflow manual `workflow_dispatch` + 1 tenant hardcode | `.aab` terinstall di device, hit API staging |
| **M1** | Modul CRM: profile + build + callback + download + tests | Tenant self-serve generate tanpa buka GitHub |
| **M2** | `/api/mobile/v1` parity penuh dengan PWA shuttle (+ rental bila siap) | Shell tidak memanggil HTML Inertia |
| **M3** | Polling fallback, kuota plan-aware, pin `shell_ref`, checklist upload Play **manual** di UI | Tenant paham alur unduh → Play Console sendiri; operasional build stabil |
| **M4** | OTA (Capgo) dan/atau keystore per tenant; Play API **opsional** (koneksi akun tenant) | Update UI tanpa full store gate untuk JS; Play tetap tenant-owned |

**Dependency keras:** M1 boleh jalan dengan API publik existing; M2 merapikan kontrak khusus mobile.

Sinkronisasi dengan Shuttle design: ganti §14.8 **P3** dari “wrapper di atas PWA” menjadi “bundled Capacitor shell + App Builder (dokumen ini)” — remote WebView **bukan** target.

---

## 15. Estimasi permukaan kerja

| Area | Perkiraan |
|---|---|
| Migrasi + model + factory | 2 file migrasi, 2 model, 2 factory |
| Services + jobs + GitHub client | ~5 kelas |
| Controllers + form requests + routes | ~6 kelas |
| Inertia pages | 3 halaman |
| Config + `.env.example` | 1 config |
| Feature tests | 1–2 berkas test |
| Repo shell (terpisah) | scaffold Cap + screens MVP + workflow |
| Docs / checklist Play | halaman bantuan singkat di UI (bukan markdown user-facing wajib) |

---

## 16. Kriteria siap implementasi M1

- [ ] Design ini disetujui (terutama: bundled vs remote, keystore platform, modul Foundation, **Play tenant-owned**)
- [ ] Repo shell minimal (hello + load `tenant-config` + satu screen ping API) + workflow menghasilkan `.aab`
- [ ] Secret GitHub & env staging siap
- [ ] Keputusan host callback (central URL) & format artifact transfer (presigned PUT vs unduh artifact Actions)
- [ ] Public/mobile API cukup untuk demo screen (boleh subset)

### Keputusan terbuka (perlu konfirmasi sebelum coding)

1. **Artifact transfer:** (A) CI upload ke presigned URL Laravel, atau (B) Laravel unduh GitHub artifact API?
2. **Profil:** satu app `combined` (shuttle+rental) vs app terpisah per vertical?
3. **Package id default:** auto-generate `com.seruwit.{tenant}` vs wajib diisi tenant (Play uniqueness)?
4. **Apakah M1 boleh rilis tanpa Rental surface** (hanya shuttle dulu)?

---

## Lampiran A — Contoh `build-aab.yml` (sketsa)

```yaml
name: Build tenant AAB
on:
  workflow_dispatch:
    inputs:
      build_id: { required: true, type: string }
      package_id: { required: true, type: string }
      app_name: { required: true, type: string }
      api_base_url: { required: true, type: string }
      version_code: { required: true, type: string }
      version_name: { required: true, type: string }
      # … sisanya
jobs:
  bundle:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { ref: ${{ inputs.shell_ref || github.ref }} }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: 21 }
      - name: Apply tenant config
        run: node scripts/apply-tenant-config.mjs
        env:
          PACKAGE_ID: ${{ inputs.package_id }}
          # …
      - run: npm ci
      - run: npm run build
      - run: npx cap sync android
      - name: Sign & bundle
        run: |
          # decode keystore, gradle bundleRelease
      - name: Callback success
        if: success()
        run: |
          curl -fsS -X POST "$CALLBACK_URL" \
            -H "Authorization: Bearer $CALLBACK_TOKEN" \
            -F "build_id=$BUILD_ID" \
            -F "status=success" \
            -F "artifact=@app-release.aab"
```

*(Sketsa — detail step signing mengikuti template Capacitor resmi saat implementasi.)*

## Lampiran B — Contoh payload callback

```json
{
  "build_id": "019abc…",
  "tenant_id": "acme",
  "status": "success",
  "version_code": 12,
  "artifact_sha256": "…",
  "github_run_id": "123456789",
  "github_run_url": "https://github.com/…/actions/runs/123456789"
}
```

Multipart bila mengunggah file langsung; atau `artifact_upload` terpisah ke presigned URL lalu callback JSON tanpa body file.

## Lampiran C — Perbandingan opsi (keputusan terkunci)

| Opsi | Dipilih? | Catatan |
|---|---|---|
| Remote WebView URL | ❌ | Bertentangan dengan brief |
| Bundled React di Capacitor | ✅ | |
| Build di server Laravel | ❌ | Ops & keamanan buruk |
| Orkestrasi Laravel + Actions | ✅ | |
| Satu Play listing multi-tenant | ❌ | Branding & review |
| Play Console dikelola Seruwit | ❌ | Keputusan produk: Play diserahkan ke masing-masing tenant |
| Tenant-owned Play (unduh `.aab` → upload manual) | ✅ | Batas Seruwit = artifact; listing/release = tenant |
| Keystore platform MVP | ✅ | Per-tenant di M4 |
| Shell di monorepo CRM | ❌ (disarankan) | Release & CI Android terpisah lebih bersih |

---

*Dokumen ini adalah kontrak desain sebelum implementasi M0/M1. Perubahan keputusan terbuka (§16) harus di-update di sini sebelum coding.*
