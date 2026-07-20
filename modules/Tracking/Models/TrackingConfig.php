<?php

namespace Modules\Tracking\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\Tracking\Database\Factories\TrackingConfigFactory;

/**
 * The tenant's connection to its own Traccar account, plus the thresholds that
 * decide how noisy telemetry becomes trip data. One row per tenant.
 */
class TrackingConfig extends Model
{
    /** @use HasFactory<TrackingConfigFactory> */
    use HasFactory;

    public const AUTH_BASIC = 'basic';

    public const AUTH_TOKEN = 'token';

    /**
     * Factory resolution assumes App\Models, so a module's models must point at
     * their own factory explicitly.
     */
    protected static function newFactory(): Factory
    {
        return TrackingConfigFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'base_url',
        'auth_type',
        'email',
        'password',
        'token',
        'poll_enabled',
        'geofence_radius_m',
        'checkpoint_min_distance_m',
        'checkpoint_min_interval_minutes',
        'retention_days',
        'last_polled_at',
        'last_poll_error',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'encrypted',
            'token' => 'encrypted',
            'poll_enabled' => 'boolean',
            'geofence_radius_m' => 'integer',
            'checkpoint_min_distance_m' => 'integer',
            'checkpoint_min_interval_minutes' => 'integer',
            'retention_days' => 'integer',
            'last_polled_at' => 'datetime',
        ];
    }

    /**
     * The tenant's single config row, created on first read so the settings
     * page always has something to edit.
     */
    public static function current(): self
    {
        return static::query()->firstOrCreate([], [
            'base_url' => config('services.traccar.base_url'),
        ]);
    }

    /**
     * The server this tenant talks to: its own override, else the company's
     * default server from config.
     */
    public function baseUrl(): ?string
    {
        return $this->base_url ?: config('services.traccar.base_url');
    }

    /**
     * Whether there is enough here to attempt a call at all. Checked before
     * every poll so an unconfigured tenant is skipped silently rather than
     * failing loudly once a minute.
     */
    public function isConfigured(): bool
    {
        if (! $this->baseUrl()) {
            return false;
        }

        return $this->auth_type === self::AUTH_TOKEN
            ? filled($this->token)
            : filled($this->email) && filled($this->password);
    }
}
