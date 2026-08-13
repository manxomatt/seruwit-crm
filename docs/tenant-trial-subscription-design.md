# Fitur Trial 7 Hari & Aktivasi Paket Berlangganan Bulanan

> **Tujuan:** Tenant yang mendaftar mandiri mendapatkan akses workspace selama **7 hari trial**. Setelah masa trial berakhir, tenant **wajib mengaktivasi paket berlangganan bulanan** untuk melanjutkan akses.

---

## 1. Saat Ini (Current State)

| Aspek | Deskripsi |
|-------|-----------|
| **Registrasi** | User daftar di `/register` → verifikasi email → onboarding form → provisioning otomatis |
| **Plan setelah onboarding** | Tenant langsung dapat plan `'trial'` tanpa batasan waktu |
| **Trial expiry** | **Tidak ada** — trial berlangsung selamanya sampai admin men-suspend |
| **Billing/Subscription** | **Tidak ada sistem billing SaaS** — Midtrans hanya untuk transaksi bisnis tenant (invoice, deposit rental) |
| **Suspension** | Hanya manual oleh admin/reseller via `TenantController::toggleStatus()` |
| **Middleware akses** | `EnsureTenantIsActive` memblokir tenant dengan `status !== 'active'` |

**Masalah:**
1. Trial tidak memiliki masa berakhir — tenant bisa menggunakan selamanya tanpa berlangganan
2. Tidak ada pengingat sebelum trial berakhir
3. Tidak ada mekanisme payment collection untuk paket berlangganan
4. Tidak ada transisi otomatis dari trial ke paid plan

---

## 2. Yang Akan Diubah

### A. Konsep Baru: Trial + Subscription

```
┌─────────────────────────────────────────────────────────────┐
│  Timeline Tenant                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Day 0      Day 7      Day 8+                               │
│     │          │          │                                  │
│     ▼          ▼          ▼                                  │
│  [Onboarding] [Trial]  [Suspended / Active]                  │
│     │          │        │   │                                │
│     │          │        │   ├── Activated (paid) → Active    │
│     │          │        │   └── Not activated → Suspended    │
│     │          │        │                                    │
│     │          ├── Notification: "3 days left" (Day 4)      │
│     │          ├── Notification: "1 day left" (Day 6)       │
│     │          └── Auto-suspend (Day 7 00:00)               │
│     │                                                       │
└─────────────────────────────────────────────────────────────┘
```

### B. Status Tenant yang Baru

| Status | Deskripsi |
|--------|-----------|
| `active` | Tenant aktif — trial belum habis ATAU sudah berlangganan |
| `suspended` | Trial habis, belum aktivasi paket — Akses diblokir |
| `cancelled` | Tenant di-nonaktifkan secara manual (sudah ada) |

### C. Plan Baru dengan Pricing

Plan kini menyimpan metadata langganan:

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `price` | decimal(12,2) | Harga per bulan (IDR) |
| `currency` | string(3) | Mata uang, default `IDR` |
| `interval` | string(20) | Interval langganan: `month`, `year` |
| `trial_days` | integer | Masa trial gratis (hari), default `7` |
| `is_trial` | boolean | Apakah ini plan trial (hanya `trial` plan) |

### D. Subscription Model

Setiap tenant yang sudah aktivasi memiliki record subscription:

```
┌──────────────────────────────────────────────────────────┐
│ subscriptions (central)                                  │
├──────────────────────────────────────────────────────────┤
│ id (bigint) PK                                           │
│ tenant_id (string) FK → tenants.id                       │
│ plan_id (bigint) FK → plans.id                           │
│ starts_at (datetime)                                     │
│ ends_at (datetime)                                       │
│ status (string) → active, cancelled, expired             │
│ created_at, updated_at                                   │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema Changes

### A. Migration: `tenants` table — tambah kolom trial

```php
// database/migrations/20xx_xx_xx_xx_xx_add_trial_fields_to_tenants_table.php

Schema::table('tenants', function (Blueprint $table) {
    $table->timestamp('trial_ends_at')->nullable()->after('status');
    $table->boolean('is_trial_expired')->default(false)->after('trial_ends_at');
});
```

### B. Migration: `plans` table — tambah kolom pricing & trial

```php
// database/migrations/20xx_xx_xx_xx_xx_add_pricing_to_plans_table.php

Schema::table('plans', function (Blueprint $table) {
    $table->decimal('price', 12, 2)->nullable()->after('sort_order');
    $table->string('currency', 3)->default('IDR')->after('price');
    $table->string('interval', 20)->default('month')->after('currency');
    $table->integer('trial_days')->default(7)->after('interval');
    $table->boolean('is_trial')->default(false)->after('trial_days');
});
```

### C. Migration: `subscriptions` table (baru)

```php
// database/migrations/20xx_xx_xx_xx_xx_create_subscriptions_table.php

Schema::create('subscriptions', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id'); // FK ke tenants.id
    $table->foreignId('plan_id')->constrained()->cascadeOnDelete();
    $table->timestamp('starts_at');
    $table->timestamp('ends_at')->nullable();
    $table->string('status', 32)->default('active');
    // Cancel / downgrade purposes:
    $table->timestamp('cancelled_at')->nullable();
    $table->timestamp('ended_at')->nullable();
    $table->timestamps();

    $table->unique(['tenant_id']);
    $table->index('status');
    $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
});
```

### D. Seeders: Update PlanSeeder

- Trial plan: `trial_days = 7`, `is_trial = true`, `price = 0`
- Paid plans: `trial_days = 0`, `is_trial = false`, `price` sesuai paket

---

## 4. Perubahan Backend

### A. Tenant Model — tambah relasi & accessor

**File:** `app/Models/Tenant.php`

```php
// Relasi subscription
public function subscription(): BelongsTo
{
    return $this->belongsTo(Subscription::class);
}

// Accessor: apakah sedang dalam masa trial
public function getIsOnTrialAttribute(): bool
{
    return $this->trial_ends_at !== null && $this->trial_ends_at->isFuture();
}

// Accessor: apakah trial sudah expired
public function getIsTrialExpiredAttribute(): bool
{
    return $this->trial_ends_at !== null && $this->trial_ends_at->isPast();
}

// Scope: tenant yang masih trial
public function scopeOnTrial($query)
{
    return $query->where('trial_ends_at', '>', now());
}

// Scope: tenant yang trial-nya expired
public function scopeTrialExpired($query)
{
    return $query->where('trial_ends_at', '<=', now())
                 ->where('is_trial_expired', false);
}
```

### B. Plan Model — tambah kolom baru

**File:** `app/Models/Plan.php`

```php
protected $fillable = [
    'key', 'name', 'description', 'modules', 'sort_order',
    'is_default', 'price', 'currency', 'interval', 'trial_days', 'is_trial',
];

protected function casts(): array
{
    return [
        'modules' => 'array',
        'sort_order' => 'integer',
        'is_default' => 'boolean',
        'price' => 'decimal:2',
        'trial_days' => 'integer',
        'is_trial' => 'boolean',
    ];
}
```

### C. Subscription Model (baru)

**File:** `app/Models/Subscription.php`

```php
class Subscription extends Model
{
    use CentralConnection;

    const STATUS_ACTIVE = 'active';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_EXPIRED = 'expired';

    protected $fillable = [
        'tenant_id', 'plan_id', 'starts_at', 'ends_at',
        'status', 'cancelled_at', 'ended_at',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE
            && $this->ends_at === null || $this->ends_at->isFuture();
    }

    public function cancel(): void
    {
        $this->update([
            'status' => self::STATUS_CANCELLED,
            'cancelled_at' => now(),
        ]);
    }
}
```

### D. ProvisionSelfServeTenantJob — set trial_ends_at

**File:** `app/Jobs/ProvisionSelfServeTenantJob.php`

```php
// Setelah tenant dibuat:
$plan = app(PlanRepository::class)->find(Plan::KEY_TRIAL);
$tenant->update([
    'plan' => Plan::KEY_TRIAL,
    'trial_ends_at' => now()->addDays($plan->trial_days), // 7 hari
    'is_trial_expired' => false,
    'status' => 'active',
]);
```

### E. SubscriptionService (baru)

**File:** `app/Services/SubscriptionService.php`

```php
class SubscriptionService
{
    public function activate(Tenant $tenant, Plan $plan, ?Payment $payment = null): Subscription
    {
        return DB::transaction(function () use ($tenant, $plan) {
            $now = now();
            $subscription = Subscription::create([
                'tenant_id' => $tenant->id,
                'plan_id' => $plan->id,
                'starts_at' => $now,
                'ends_at' => $plan->interval === 'year'
                    ? $now->addYear()
                    : $now->addMonth(),
                'status' => Subscription::STATUS_ACTIVE,
            ]);

            // Update tenant
            $tenant->update([
                'plan' => $plan->key,
                'trial_ends_at' => null,
                'is_trial_expired' => false,
                'status' => 'active',
            ]);

            // Generate invoice untuk periode pertama (jika harga > 0)
            if ($plan->price > 0) {
                // TODO: buat subscription invoice
            }

            return $subscription;
        });
    }

    public function cancel(Tenant $tenant): void
    {
        $subscription = $tenant->subscription;
        if ($subscription) {
            $subscription->cancel();
        }

        $tenant->update([
            'trial_ends_at' => null,
            'is_trial_expired' => true,
            'status' => 'suspended',
        ]);
    }

    public function expireTrials(): int
    {
        return Tenant::query()
            ->trialExpired()
            ->where('is_trial_expired', false)
            ->each(function ($tenant) {
                $tenant->update([
                    'status' => 'suspended',
                    'is_trial_expired' => true,
                ]);
            })
            ->count();
    }
}
```

### F. Scheduled Job: Expire Trials

**File:** `routes/console.php` — tambah scheduled command

```php
Schedule::command('subscription:expire-trials')
    ->dailyAt('00:05')
    ->withoutOverlapping();
```

**File:** `app/Console/Commands/ExpireTrials.php`

```php
class ExpireTrials extends Command
{
    protected $signature = 'subscription:expire-trials';
    protected $description = 'Suspend tenants whose trial period has expired';

    public function handle(SubscriptionService $service): int
    {
        $count = $service->expireTrials();
        $this->info("Expired {$count} trials.");
        return 0;
    }
}
```

### G. Notification untuk Trial Expiry

**File:** `app/Notifications/TrialExpiringNotification.php`

```php
class TrialExpiringNotification extends Notification
{
    use DatabaseNotifications;

    public function __construct(
        public Tenant $tenant,
        public int $daysLeft,
    ) {}

    public function via($notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'trial_expiring',
            'tenant_id' => $this->tenant->id,
            'tenant_name' => $this->tenant->name,
            'days_left' => $this->daysLeft,
            'trial_ends_at' => $this->tenant->trial_ends_at,
            'url' => route('central.subscription.show', $this->tenant),
        ];
    }
}
```

**Scheduled notification jobs** (`routes/console.php`):

```php
// 3 hari sebelum expiry
Schedule::call(function () {
    Tenant::query()
        ->onTrial()
        ->whereDate('trial_ends_at', now()->addDays(3))
        ->each(fn ($tenant) => $tenant->owner?->notify(
            new TrialExpiringNotification($tenant, 3)
        ));
})->dailyAt('08:00');

// 1 hari sebelum expiry
Schedule::call(function () {
    Tenant::query()
        ->onTrial()
        ->whereDate('trial_ends_at', now()->addDay())
        ->each(fn ($tenant) => $tenant->owner?->notify(
            new TrialExpiringNotification($tenant, 1)
        ));
})->dailyAt('08:00');
```

### H. Middleware — Update EnsureTenantIsActive

**File:** `app/Http/Middleware/EnsureTenantIsActive.php`

```php
public function handle(Request $request, Closure $next): Response
{
    if (tenancy()->initialized) {
        $tenant = tenant();

        // Trial expired & no subscription → block
        if ($tenant->status === 'suspended' || $tenant->is_trial_expired) {
            return WorkspaceSuspendedPage::toResponse($request);
        }

        // Status non-active → block
        if ($tenant->status !== 'active') {
            return WorkspaceSuspendedPage::toResponse($request);
        }
    }

    return $next($request);
}
```

### I. Controller untuk Subscription Activation

**File:** `app/Http/Controllers/Central/SubscriptionController.php` (baru)

```php
class SubscriptionController extends Controller
{
    public function show(Tenant $tenant): Response
    {
        $plans = Plan::query()
            ->where('is_trial', false)
            ->where('is_default', true)
            ->orWhere('key', '!=', 'trial')
            ->ordered()
            ->get();

        $subscription = $tenant->subscription;

        return Inertia::render('Central/Subscription/Activate', [
            'tenant' => $tenant,
            'plans' => $plans,
            'subscription' => $subscription,
            'trialEndsAt' => $tenant->trial_ends_at,
            'isOnTrial' => $tenant->isOnTrial,
        ]);
    }

    public function activate(Request $request, Tenant $tenant, SubscriptionService $service): RedirectResponse
    {
        $request->validate([
            'plan_id' => 'required|exists:plans,id',
            'payment_method' => 'nullable|string|max:50',
        ]);

        $plan = Plan::findOrFail($request->plan_id);

        $subscription = $service->activate($tenant, $plan);

        return redirect()
            ->route('central.workspaces.index')
            ->with('success', 'Paket berhasil diaktifkan.');
    }
}
```

**Routes** (`routes/web.php`):

```php
Route::domain($centralDomain)
    ->middleware(['auth'])
    ->prefix('subscription')
    ->name('central.subscription.')
    ->group(function () {
        Route::get('/activate/{tenant}', [SubscriptionController::class, 'show'])
            ->name('show');
        Route::post('/activate/{tenant}', [SubscriptionController::class, 'activate'])
            ->name('activate');
    });
```

---

## 5. Perubahan Frontend

### A. Onboarding — Tampilkan Trial Info

**File:** `resources/js/Pages/Central/Onboarding.tsx`

Setelah provisioning selesai, tampilkan:

```
┌─────────────────────────────────────────────┐
│  🎉 Workspace Berhasil Dibuat!              │
├─────────────────────────────────────────────┤
│                                             │
│  ✅ Trial 7 hari gratis dimulai              │
│                                             │
│  Anda memiliki akses penuh ke semua modul    │
│  selama 7 hari. Setelah itu, pilih paket     │
│  berlangganan untuk melanjutkan.             │
│                                             │
│  Trial berakhir: 20 Agustus 2026             │
│                                             │
│  [ Masuk ke Workspace ]                     │
│  [ Lihat Paket Berlangganan ]               │
└─────────────────────────────────────────────┘
```

### B. Tenant Dashboard — Trial Banner

**File:** `resources/js/Pages/Central/Workspaces/Index.tsx` (atau Dashboard)

Tampilkan banner trial untuk tenant dengan `trial_ends_at` di masa depan:

```
┌─────────────────────────────────────────────────────┐
│ ⏳ Masa Trial: 4 hari tersisa (berakhir 20 Agt)    │
│                                                     │
│ [ Aktivasi Paket Sekarang ]  [ Lihat Paket ]        │
└─────────────────────────────────────────────────────┘
```

### C. Subscription Activation Page

**File:** `resources/js/Pages/Central/Subscription/Activate.tsx` (baru)

```
┌──────────────────────────────────────────────────────┐
│  Aktivasi Paket Berlangganan                          │
├──────────────────────────────────────────────────────┤
│  Trial berakhir dalam: 4 hari                         │
├──────────────────────────────────────────────────────┤
│  Pilih Paket:                                         │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │    BASIC     │  │     PRO      │                 │
│  │  Rp 500K/bln │  │ Rp 1.5Jt/bln │                 │
│  │              │  │              │                 │
│  │ ✓ 5 Modul    │  │ ✓ 20 Modul   │                 │
│  │ ✓ Support    │  │ ✓ Priority   │                 │
│  │              │  │   Support     │                 │
│  │ [Pilih]      │  │ [Pilih]      │                 │
│  └──────────────┘  └──────────────┘                 │
│                                                      │
│  Metode Pembayaran:                                   │
│  [Transfer Bank ▼]                                    │
│                                                      │
│  [ Batalkan ]  [ Aktivasi Sekarang ]                  │
└──────────────────────────────────────────────────────┘
```

### D. Suspended Workspace Page

**File:** `resources/js/Pages/Central/Workspace/Suspended.tsx` (baru)

Ketika tenant suspended, tampilkan:

```
┌──────────────────────────────────────────────────────┐
│  ⚠️ Workspace Ditangguhkan                            │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Masa trial Anda telah berakhir pada 20 Agustus 2026. │
│                                                      │
│  Untuk melanjutkan menggunakan aplikasi,             │
│  aktifkan paket berlangganan bulanan.                │
│                                                      │
│  [ Aktivasi Paket Sekarang ]                         │
│  [ Hubungi Admin ]                                    │
└──────────────────────────────────────────────────────┘
```

---

## 6. API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/subscription/activate/{tenant}` | Form aktivasi paket |
| `POST` | `/subscription/activate/{tenant}` | Proses aktivasi paket |
| `GET` | `/api/tenant/subscription/status` | Cek status subscription (tenant context) |
| `GET` | `/api/tenant/trial/status` | Cek status trial (tenant context) |

---

## 7. Notifikasi & Pengingat

### Jadwal Notifikasi

| Kapan | Event | Channel |
|-------|-------|---------|
| Day 4 (H-3) | `TrialExpiringNotification` | Database + Email |
| Day 6 (H-1) | `TrialExpiringNotification` | Database + Email |
| Day 7 (expired) | `TrialExpiredNotification` | Database + Email |
| Day 8+ (belum activate) | `TrialSuspendedNotification` | Database + Email |

### Template Email (contoh)

**Subject:** `[Seruwit CRM] Masa trial {nama_tenant} berakhir dalam {x} hari`

> Halo {nama_owner},
>
> Workspace **{nama_tenant}** Anda masih dalam masa trial gratis.
> Trial akan berakhir pada **{tanggal_berakhir}**.
>
> Setelah trial berakhir, workspace akan ditangguhkan sampai
> Anda mengaktivasi paket berlangganan bulanan.
>
> [Aktivasi Paket Sekarang]

---

## 8. Arsitektur Lengkap (Sequence Diagram)

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Browser │     │   Central    │     │ Provisioning │     │  Database    │
└────┬─────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
     │                   │                     │                    │
     │  POST /onboarding │                     │                    │
     │──────────────────>│                     │                    │
     │                   │  dispatch Job       │                    │
     │                   │────────────────────────────────────────>│
     │                   │                     │  create tenant    │
     │                   │                     │  trial_ends_at    │
     │                   │                     │  = now+7days      │
     │                   │                     │──────────────────>│
     │                   │                     │                    │
     │  Poll status      │                     │                    │
     │──────────────────>│                     │                    │
     │  STATUS_READY     │                     │                    │
     │<──────────────────│                     │                    │
     │                   │                     │                    │
     │  Redirect to      │                     │                    │
     │  tenant domain    │                     │                    │
     │<──────────────────│                     │                    │
     │                   │                     │                    │
     │  GET /dashboard   │                     │                    │
     │──────────────────────────────────────>│                    │
     │                   │                     │                    │
     │                   │  EnsureTenantIsActive│                    │
     │                   │  → isOnTrial? yes    │                    │
     │                   │  → allow access      │                    │
     │                   │                     │                    │
     │  Dashboard HTML   │                     │                    │
     │<──────────────────│                     │                    │
     │                   │                     │                    │
     │                   │                     │                    │
     │  Day 4: H-3 email notification (cron)                     │
     │                   │                     │                    │
     │  Day 6: H-1 email notification (cron)                     │
     │                   │                     │                    │
     │  Day 7 00:00:      │                     │                    │
     │  subscription:     │                     │                    │
     │  expire-trials     │                     │                    │
     │  (cron)            │                     │                    │
     │──────────────────────────────────────>│                    │
     │                   │  UPDATE tenants      │                    │
     │                   │  SET status='suspended'                  │
     │                   │  WHERE trial_ends_at  │                    │
     │                   │  <= now              │                    │
     │                   │────────────────────────────────────────>│
     │                   │                     │                    │
     │  Day 7+ user       │                     │                    │
     │  akses tenant      │                     │                    │
     │──────────────────────────────────────>│                    │
     │                   │  EnsureTenantIsActive│                    │
     │                   │  → status=suspended  │                    │
     │                   │  → BLOCK             │                    │
     │  403 / Suspended   │                     │                    │
     │<──────────────────│                     │                    │
     │                   │                     │                    │
     │  Admin activate    │                     │                    │
     │  subscription      │                     │                    │
     │──────────────────────────────────────>│                    │
     │                   │  UPDATE tenants      │                    │
     │                   │  SET status='active' │                    │
     │                   │  trial_ends_at=NULL  │                    │
     │                   │  create subscription │                    │
     │                   │────────────────────────────────────────>│
     │                   │                     │                    │
     │  Akses kembali     │                     │                    │
     │──────────────────────────────────────>│                    │
     │  Dashboard HTML    │                     │                    │
     │<──────────────────│                     │                    │
```

---

## 9. File Yang Akan Ditambah/Diubah

| # | File | Action | Deskripsi |
|---|------|--------|-----------|
| 1 | `database/migrations/..._add_trial_fields_to_tenants_table.php` | **Buat** | Tambah `trial_ends_at`, `is_trial_expired` ke `tenants` |
| 2 | `database/migrations/..._add_pricing_to_plans_table.php` | **Buat** | Tambah pricing fields ke `plans` |
| 3 | `database/migrations/..._create_subscriptions_table.php` | **Buat** | Tabel `subscriptions` (central) |
| 4 | `database/seeders/PlanSeeder.php` | **Ubah** | Isi pricing + trial_days |
| 5 | `app/Models/Tenant.php` | **Ubah** | Tambah relasi subscription, accessor isOnTrial |
| 6 | `app/Models/Plan.php` | **Ubah** | Tambah fillable + cast pricing fields |
| 7 | `app/Models/Subscription.php` | **Buat** | Model subscription baru |
| 8 | `app/Jobs/ProvisionSelfServeTenantJob.php` | **Ubah** | Set `trial_ends_at` saat provisioning |
| 9 | `app/Services/SubscriptionService.php` | **Buat** | Service activate/cancel/expire trials |
| 10 | `app/Console/Commands/ExpireTrials.php` | **Buat** | Command `subscription:expire-trials` |
| 11 | `app/Notifications/TrialExpiringNotification.php` | **Buat** | Notifikasi H-3, H-1 |
| 12 | `app/Notifications/TrialExpiredNotification.php` | **Buat** | Notifikasi trial expired |
| 13 | `app/Notifications/TrialSuspendedNotification.php` | **Buat** | Notifikasi workspace suspended |
| 14 | `app/Http/Controllers/Central/SubscriptionController.php` | **Buat** | Controller aktivasi paket |
| 15 | `app/Http/Middleware/EnsureTenantIsActive.php` | **Ubah** | Cek `is_trial_expired` |
| 16 | `routes/web.php` | **Ubah** | Tambah route subscription |
| 17 | `routes/console.php` | **Ubah** | Tambah scheduled jobs |
| 18 | `resources/js/Pages/Central/Onboarding.tsx` | **Ubah** | Tampilkan info trial setelah provisioning |
| 19 | `resources/js/Pages/Central/Workspaces/Index.tsx` | **Ubah** | Trial banner di dashboard |
| 20 | `resources/js/Pages/Central/Subscription/Activate.tsx` | **Buat** | Halaman pilih & aktivasi paket |
| 21 | `resources/js/Pages/Central/Workspace/Suspended.tsx` | **Buat** | Halaman workspace ditangguhkan |
| 22 | `app/Providers/AppServiceProvider.php` | **Ubah** | Gate untuk manage-subscriptions (opsional) |

---

## 10. Testing Strategy

### Unit Tests

| Test | Target |
|------|--------|
| `SubscriptionService::activate()` | Membuat subscription, update tenant plan |
| `SubscriptionService::cancel()` | Set status cancelled, suspend tenant |
| `SubscriptionService::expireTrials()` | Suspend tenant dengan trial expired |
| `Tenant::isOnTrial` accessor | Return true jika trial_ends_at di masa depan |
| `Tenant::isTrialExpired` accessor | Return true jika trial_ends_at lewat |

### Feature Tests

| Test | Target |
|------|--------|
| `OnboardingTest::self_serve_sets_trial_ends_at` | Tenant baru punya trial_ends_at = +7 hari |
| `SubscriptionTest::user_can_activate_plan` | POST activate → tenant active, plan updated |
| `SubscriptionTest::trial_expiry_blocks_access` | Trial expired → 403 / suspended page |
| `SubscriptionTest::activated_tenant_can_access` | Activated → akses normal |
| `ExpireTrialsCommandTest::suspends_expired_trials` | Command suspend batch expired trials |
| `NotificationTest::sends_trial_expiring_3_days` | Notifikasi H-3 terkirim |
| `NotificationTest::sends_trial_expiring_1_day` | Notifikasi H-1 terkirim |

### Minimal test command:
```bash
php artisan test --filter=SubscriptionTest
php artisan test --filter=ExpireTrialsCommandTest
```

---

## 11. Migration Plan

### Phase 1: Database & Model (Week 1)
1. Buat migrations untuk `trial_ends_at`, `is_trial_expired`, pricing di `plans`, tabel `subscriptions`
2. Update `Tenant` model + `Plan` model
3. Buat `Subscription` model
4. Update `PlanSeeder` dengan pricing

### Phase 2: Backend Logic (Week 2)
1. Buat `SubscriptionService`
2. Update `ProvisionSelfServeTenantJob` untuk set trial_ends_at
3. Buat `ExpireTrials` command
4. Tambah scheduled jobs di `console.php`
5. Update `EnsureTenantIsActive` middleware
6. Buat notification classes

### Phase 3: Frontend (Week 3)
1. Update onboarding success page
2. Buat trial banner di workspace dashboard
3. Buat halaman aktivasi paket
4. Buat halaman suspended workspace

### Phase 4: Testing & Polish (Week 4)
1. Tulis semua unit & feature tests
2. Integration test end-to-end flow
3. Review & fine-tuning UX

---

## 12. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Tenant existing yang sudah 'trial' tanpa expiry | Tidak ada `trial_ends_at` → tidak bisa di-expire | Migration backfill: set `trial_ends_at = null` untuk existing, mereka tetap aktif sampai manual |
| Scheduled job gagal | Trial tidak expired → tenant tetap akses | Tambah monitoring + alert jika job gagal, fallback manual admin |
| Notification email tidak terkirim | Tenant tidak tahu trial akan habis | Kirim juga notification in-app (bell dropdown) |
| Payment collection gagal | Tenant bayar tapi subscription tidak aktif | Transaksi dalam DB transaction, rollback jika gagal |
| Tenant akses via direct URL bypass | Menghindari suspended page | `EnsureTenantIsActive` middleware dicek di setiap request tenant |

---

## 13. Catatan Pengembangan

- **Tidak ada Stripe/Midtrans untuk SaaS billing** — untuk MVP, aktivasi paket bisa dilakukan via:
  - Manual activation oleh admin (via `SubscriptionController` tanpa payment)
  - Payment verification manual (admin cek transfer → activate)
  - Midtrans bisa diintegrasikan nanti untuk automated payment collection
- **Grace period opsional** — bisa ditambahkan `grace_period_days` (misal 3 hari setelah trial expired sebelum full suspend)
- **Pause trial** — admin bisa memperpanjang trial untuk tenant tertentu via `TenantController`
