<?php

namespace Modules\Tracking\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\Tracking\Database\Factories\TrackingConfigFactory;

/**
 * The tenant's connection to its GPS provider account, plus the thresholds that
 * decide how noisy telemetry becomes trip data. One row per tenant.
 */
class TrackingConfig extends Model
{
    /** @use HasFactory<TrackingConfigFactory> */
    use HasFactory;

    public const PROVIDER_TRACCAR = 'traccar';

    public const PROVIDER_SKY_TRACK = 'sky_track';

    public const AUTH_BASIC = 'basic';

    public const AUTH_TOKEN = 'token';

    public const AUTH_API_KEY = 'api_key';

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
        'provider',
        'base_url',
        'auth_type',
        'email',
        'password',
        'token',
        'poll_enabled',
        'alerts_enabled',
        'alert_speed_kph',
        'alert_stale_minutes',
        'alert_idle_minutes',
        'alert_cooldown_minutes',
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
            'alerts_enabled' => 'boolean',
            'alert_speed_kph' => 'integer',
            'alert_stale_minutes' => 'integer',
            'alert_idle_minutes' => 'integer',
            'alert_cooldown_minutes' => 'integer',
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
            'provider' => self::PROVIDER_TRACCAR,
            'base_url' => config('services.traccar.base_url'),
        ]);
    }

    /**
     * @return list<string>
     */
    public static function providers(): array
    {
        return [
            self::PROVIDER_TRACCAR,
            self::PROVIDER_SKY_TRACK,
        ];
    }

    public function usesSkyTrack(): bool
    {
        return $this->provider === self::PROVIDER_SKY_TRACK;
    }

    public function usesTraccar(): bool
    {
        return $this->provider === self::PROVIDER_TRACCAR;
    }

    /**
     * The server this tenant talks to: its own override, else the company's
     * default Traccar server from config (Traccar provider only).
     */
    public function baseUrl(): ?string
    {
        if ($this->base_url) {
            return $this->base_url;
        }

        return $this->usesTraccar()
            ? config('services.traccar.base_url')
            : null;
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

        if ($this->usesSkyTrack()) {
            return filled($this->token);
        }

        return $this->auth_type === self::AUTH_TOKEN
            ? filled($this->token)
            : filled($this->email) && filled($this->password);
    }
}
