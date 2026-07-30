<?php

namespace Modules\Shuttle\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class ShuttleSetting extends Model
{
    public const KEY_DEFAULT_SEAT_CAPACITY = 'default_seat_capacity';

    public const KEY_DEFAULT_PICKUP_CUTOFF = 'default_pickup_cutoff_minutes';

    public const KEY_DEFAULT_POOL_FARE = 'default_pool_base_fare';

    public const KEY_DEFAULT_DOOR_FARE = 'default_door_base_fare';

    /** @var list<string> */
    public const KEYS = [
        self::KEY_DEFAULT_SEAT_CAPACITY,
        self::KEY_DEFAULT_PICKUP_CUTOFF,
        self::KEY_DEFAULT_POOL_FARE,
        self::KEY_DEFAULT_DOOR_FARE,
    ];

    /** @var list<string> */
    protected $fillable = [
        'key',
        'value',
    ];

    public static function getValue(string $key, ?string $default = null): ?string
    {
        $all = static::allMapped();

        return $all[$key] ?? $default;
    }

    public static function getInt(string $key, int $default = 0): int
    {
        return (int) (static::getValue($key, (string) $default) ?? $default);
    }

    /**
     * @return array<string, string|null>
     */
    public static function allMapped(): array
    {
        return Cache::remember('shuttle_settings_map', 60, function (): array {
            return static::query()->pluck('value', 'key')->all();
        });
    }

    /**
     * @param  array<string, mixed>  $values
     */
    public static function putMany(array $values): void
    {
        foreach ($values as $key => $value) {
            static::query()->updateOrCreate(
                ['key' => $key],
                ['value' => $value === null || $value === '' ? null : (string) $value],
            );
        }

        Cache::forget('shuttle_settings_map');
    }

    /**
     * @return array<string, string>
     */
    public static function defaults(): array
    {
        return [
            self::KEY_DEFAULT_SEAT_CAPACITY => '14',
            self::KEY_DEFAULT_PICKUP_CUTOFF => '90',
            self::KEY_DEFAULT_POOL_FARE => '200000',
            self::KEY_DEFAULT_DOOR_FARE => '250000',
        ];
    }
}
