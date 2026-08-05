<?php

namespace Modules\Tracking\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Tracking\Database\Factories\GpsSourceFactory;

/**
 * One GPS server account for this tenant. A tenant may have several sources
 * (different vendors or migrations in progress); each device belongs to exactly
 * one source.
 */
class GpsSource extends Model
{
    /** @use HasFactory<GpsSourceFactory> */
    use HasFactory;

    public const PROVIDER_TRACCAR = 'traccar';

    public const PROVIDER_SKY_TRACK = 'sky_track';

    public const PROVIDER_GPS_SERVER = 'gps_server';

    public const AUTH_BASIC = 'basic';

    public const AUTH_TOKEN = 'token';

    public const AUTH_API_KEY = 'api_key';

    public const MAX_PER_TENANT = 5;

    protected static function newFactory(): Factory
    {
        return GpsSourceFactory::new();
    }

    protected $fillable = [
        'name',
        'provider',
        'base_url',
        'auth_type',
        'email',
        'password',
        'token',
        'poll_enabled',
        'last_polled_at',
        'last_poll_error',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'encrypted',
            'token' => 'encrypted',
            'poll_enabled' => 'boolean',
            'last_polled_at' => 'datetime',
        ];
    }

    /**
     * @return list<string>
     */
    public static function providers(): array
    {
        return [self::PROVIDER_TRACCAR, self::PROVIDER_SKY_TRACK, self::PROVIDER_GPS_SERVER];
    }

    /**
     * @return list<string>
     */
    public static function apiKeyProviders(): array
    {
        return [self::PROVIDER_SKY_TRACK, self::PROVIDER_GPS_SERVER];
    }

    public function devices(): HasMany
    {
        return $this->hasMany(GpsDevice::class);
    }

    public function scopePollable(Builder $query): Builder
    {
        return $query->where('poll_enabled', true);
    }

    public function usesSkyTrack(): bool
    {
        return $this->provider === self::PROVIDER_SKY_TRACK;
    }

    public function usesGpsServer(): bool
    {
        return $this->provider === self::PROVIDER_GPS_SERVER;
    }

    public function usesApiKeyAuth(): bool
    {
        return in_array($this->provider, self::apiKeyProviders(), true);
    }

    public function usesTraccar(): bool
    {
        return $this->provider === self::PROVIDER_TRACCAR;
    }

    public function baseUrl(): ?string
    {
        if ($this->base_url) {
            return $this->base_url;
        }

        return $this->usesTraccar()
            ? config('services.traccar.base_url')
            : null;
    }

    public function isConfigured(): bool
    {
        if (! $this->baseUrl()) {
            return false;
        }

        if ($this->usesApiKeyAuth()) {
            return filled($this->token);
        }

        return $this->auth_type === self::AUTH_TOKEN
            ? filled($this->token)
            : filled($this->email) && filled($this->password);
    }

    public function hasPairedDevices(): bool
    {
        return $this->devices()->whereNotNull('vehicle_id')->exists();
    }
}
