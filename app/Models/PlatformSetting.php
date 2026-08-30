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
     * @param  Builder<$this>  $query
     * @return Builder<$this>
     */
    public function scopeGroup(Builder $query, string $group): Builder
    {
        return $query->where('group', $group);
    }
}
