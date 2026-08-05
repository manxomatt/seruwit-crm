<?php

namespace Modules\Tracking\Services;

use InvalidArgumentException;
use Modules\Tracking\Contracts\GpsProvider;
use Modules\Tracking\Models\GpsSource;

/**
 * Resolves the HTTP adapter for a GPS source.
 */
class GpsProviderFactory
{
    public function make(GpsSource $source): GpsProvider
    {
        return match ($source->provider) {
            GpsSource::PROVIDER_SKY_TRACK => new SkyTrackClient($source),
            GpsSource::PROVIDER_GPS_SERVER => new GpsServerClient($source),
            GpsSource::PROVIDER_TRACCAR => new TraccarClient($source),
            default => throw new InvalidArgumentException("Unknown GPS provider [{$source->provider}]."),
        };
    }
}
