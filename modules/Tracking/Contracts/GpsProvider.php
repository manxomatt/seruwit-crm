<?php

namespace Modules\Tracking\Contracts;

/**
 * HTTP adapter for a single GPS server account (one GpsSource).
 */
interface GpsProvider
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function listDevices(): array;

    /**
     * @return array<int, array<string, mixed>>
     */
    public function latestPositions(): array;

    public function verify(): bool;
}
