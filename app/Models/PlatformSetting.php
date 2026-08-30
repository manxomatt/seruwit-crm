<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * A platform-global setting, stored in the CENTRAL schema and managed only by
 * the central admin.
 *
 * Counterpart to App\Models\Setting, which is tenant-scoped (each tenant admin
 * manages its own values in the tenant schema). Pinned to the central
 * connection — like ModuleSetting — so it reads correctly even from tenant
 * context, where the default connection points at the tenant schema.
 */
class PlatformSetting extends Model
{
    public const KEY_CAPACITY_CREDITS_LIFETIME = 'capacity_credits_lifetime_enabled';

    public const KEY_VEHICLE_ACTIVATION_DURATION_DAYS = 'vehicle_activation_duration_days';

    public const KEY_VEHICLE_GRACE_PERIOD_DAYS = 'vehicle_grace_period_days';

    public const KEY_PAUSE_DURING_MAINTENANCE = 'pause_during_maintenance_enabled';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'key',
        'group',
        'value',
        'type',
        'label',
        'description',
        'is_public',
        'sort_order',
    ];

    /**
     * Pinned to the central connection. Without this, reading a platform setting
     * from tenant context would hit the tenant schema, where this table does not
     * exist.
     */
    public function getConnectionName(): ?string
    {
        $connection = config('tenancy.database.central_connection');

        if ($connection && config("database.connections.{$connection}")) {
            return $connection;
        }

        return config('database.default', 'pgsql');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Get a platform setting value by key.
     */
    public static function getValue(string $key, mixed $default = null): mixed
    {
        return static::query()->where('key', $key)->value('value') ?? $default;
    }

    public static function isCapacityCreditsLifetime(): bool
    {
        $val = static::getValue(self::KEY_CAPACITY_CREDITS_LIFETIME, '1');

        return filter_var($val, FILTER_VALIDATE_BOOLEAN);
    }

    public static function getVehicleActivationDurationDays(): int
    {
        return (int) static::getValue(self::KEY_VEHICLE_ACTIVATION_DURATION_DAYS, 30);
    }

    public static function getVehicleGracePeriodDays(): int
    {
        return (int) static::getValue(self::KEY_VEHICLE_GRACE_PERIOD_DAYS, 3);
    }

    public static function isPauseDuringMaintenanceEnabled(): bool
    {
        $val = static::getValue(self::KEY_PAUSE_DURING_MAINTENANCE, '0');

        return filter_var($val, FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * Create or update a platform setting value by key, filling required columns
     * with sensible defaults on first write.
     */
    public static function setValue(string $key, mixed $value): bool
    {
        $setting = static::query()->firstOrNew(['key' => $key]);

        $setting->value = $value;

        if (! $setting->exists) {
            $setting->group = $setting->group ?: 'general';
            $setting->label = $setting->label ?: $key;
        }

        return $setting->save();
    }

    /**
     * All platform settings keyed by their group.
     *
     * @return Collection<int, static>
     */
    public static function getGrouped(): Collection
    {
        return static::query()
            ->orderBy('group')
            ->orderBy('sort_order')
            ->get()
            ->groupBy('group');
    }

    /**
     * Default list of platform settings.
     *
     * @return list<array{key: string, group: string, value: string|null, type: string, label: string, description: string, is_public: bool, sort_order: int}>
     */
    public static function defaults(): array
    {
        return [
            // GENERAL
            [
                'key' => 'general.system_mode',
                'group' => 'general',
                'value' => app()->environment('production') ? 'production' : 'development',
                'type' => 'select',
                'label' => 'Mode Sistem',
                'description' => 'Development menonaktifkan email keluar & menampilkan OTP di layar. Production mengaktifkan email nyata dan proteksi keamanan penuh.',
                'is_public' => false,
                'sort_order' => 1,
            ],
            [
                'key' => 'general.ai_features_enabled',
                'group' => 'general',
                'value' => '1',
                'type' => 'boolean',
                'label' => 'Fitur AI (Artificial Intelligence)',
                'description' => 'Master switch untuk mengaktifkan atau menonaktifkan seluruh fitur AI (Visual Handover, Smart KYC, Dynamic Pricing, Predictive Maintenance) di semua workspace tenant.',
                'is_public' => true,
                'sort_order' => 2,
            ],

            // CAPACITY
            [
                'key' => self::KEY_CAPACITY_CREDITS_LIFETIME,
                'group' => 'capacity',
                'value' => '1',
                'type' => 'boolean',
                'label' => 'Saldo Kredit Lifetime',
                'description' => 'Saldo kredit kapasitas unit yang dimiliki tenant akan tersimpan selamanya sampai digunakan (tidak pernah kadaluarsa).',
                'is_public' => false,
                'sort_order' => 1,
            ],
            [
                'key' => self::KEY_VEHICLE_ACTIVATION_DURATION_DAYS,
                'group' => 'capacity',
                'value' => '30',
                'type' => 'number',
                'label' => 'Durasi 1 Siklus Aktivasi (Hari)',
                'description' => 'Masa aktif yang didapat kendaraan saat mengkonsumsi 1 unit kapasitas kuota armada (default: 30 hari).',
                'is_public' => false,
                'sort_order' => 2,
            ],
            [
                'key' => self::KEY_VEHICLE_GRACE_PERIOD_DAYS,
                'group' => 'capacity',
                'value' => '3',
                'type' => 'number',
                'label' => 'Masa Tenggang / Grace Period (Hari)',
                'description' => 'Toleransi hari setelah masa aktif habis sebelum unit dinonaktifkan dari jadwal operasional (default: 3 hari).',
                'is_public' => false,
                'sort_order' => 3,
            ],
            [
                'key' => self::KEY_PAUSE_DURING_MAINTENANCE,
                'group' => 'capacity',
                'value' => '0',
                'type' => 'boolean',
                'label' => 'Bekukan Masa Aktif Saat Masuk Bengkel',
                'description' => 'Jika diaktifkan, masa aktif kendaraan tidak berkurang saat kendaraan berstatus dalam perbaikan (maintenance).',
                'is_public' => false,
                'sort_order' => 4,
            ],

            // EMAIL (Central)
            [
                'key' => 'email.from_address',
                'group' => 'email',
                'value' => config('mail.from.address', 'noreply@seruwit.com'),
                'type' => 'email',
                'label' => 'Email Pengirim Platform',
                'description' => 'Email default yang digunakan untuk notifikasi sistem dan transaksi central.',
                'is_public' => false,
                'sort_order' => 1,
            ],
            [
                'key' => 'email.from_name',
                'group' => 'email',
                'value' => config('mail.from.name', 'Seruwit Platform'),
                'type' => 'text',
                'label' => 'Nama Pengirim Platform',
                'description' => 'Nama pengirim yang tertera pada email keluar sistem central.',
                'is_public' => false,
                'sort_order' => 2,
            ],

            // SECURITY (Central)
            [
                'key' => 'security.max_login_attempts',
                'group' => 'security',
                'value' => '5',
                'type' => 'number',
                'label' => 'Batas Percobaan Login',
                'description' => 'Jumlah maksimal kegagalan login berturut-turut sebelum akun diblokir sementara.',
                'is_public' => false,
                'sort_order' => 1,
            ],
            [
                'key' => 'security.lockout_duration_minutes',
                'group' => 'security',
                'value' => '15',
                'type' => 'number',
                'label' => 'Durasi Penguncian Akun (Menit)',
                'description' => 'Waktu tunggu akun sebelum dapat mencoba login kembali setelah terkena pembatasan.',
                'is_public' => false,
                'sort_order' => 2,
            ],
            [
                'key' => 'security.enforce_two_factor',
                'group' => 'security',
                'value' => '0',
                'type' => 'boolean',
                'label' => 'Wajibkan Otentikasi Dua Faktor (2FA)',
                'description' => 'Wajibkan seluruh admin central untuk mengaktifkan 2FA saat mengakses dashboard central.',
                'is_public' => false,
                'sort_order' => 3,
            ],
        ];
    }

    /**
     * Ensure all default platform settings exist in database.
     */
    public static function ensureDefaultsExist(): void
    {
        try {
            foreach (static::defaults() as $def) {
                static::query()->firstOrCreate(
                    ['key' => $def['key']],
                    $def
                );
            }
        } catch (\Throwable $e) {
            // Gracefully ignore if database connection is unavailable during boot
        }
    }

    /**
     * Preferred tab order on Modules/PlatformSettings. Unknown groups append alphabetically.
     *
     * @return list<string>
     */
    public static function uiGroupOrder(): array
    {
        return [
            'general',
            'capacity',
            'email',
            'security',
        ];
    }

    /**
     * Distinct setting groups in UI tab order.
     *
     * @return list<string>
     */
    public static function orderedVisibleGroups(): array
    {
        static::ensureDefaultsExist();

        $existing = static::query()
            ->select('group')
            ->distinct()
            ->pluck('group')
            ->all();

        $preferred = array_values(array_filter(
            static::uiGroupOrder(),
            fn (string $group): bool => in_array($group, $existing, true),
        ));

        $remainder = collect($existing)
            ->reject(fn (string $group): bool => in_array($group, $preferred, true))
            ->sort()
            ->values()
            ->all();

        return [...$preferred, ...$remainder];
    }

    /**
     * @param  Builder<$this>  $query
     * @return Builder<$this>
     */
    public function scopeGroup(Builder $query, string $group): Builder
    {
        return $query->where('group', $group);
    }
}
