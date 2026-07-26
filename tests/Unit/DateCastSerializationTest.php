<?php

namespace Tests\Unit;

use Modules\Document\Models\Document;
use Modules\Fleet\Models\FuelLog;
use Modules\Fleet\Models\Vehicle;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class DateCastSerializationTest extends TestCase
{
    #[Test]
    public function date_casts_serialize_as_ymd_without_timezone_suffix(): void
    {
        $fuelLog = new FuelLog(['filled_at' => '2026-07-26']);
        $serialized = $fuelLog->toArray()['filled_at'];

        $this->assertSame('2026-07-26', $serialized);
        $this->assertStringNotContainsString('T', $serialized);
        $this->assertStringNotContainsString('Z', $serialized);

        $vehicle = new Vehicle([
            'stnk_expires_at' => '2026-12-31',
            'kir_expires_at' => '2026-06-15',
        ]);

        $this->assertSame('2026-12-31', $vehicle->toArray()['stnk_expires_at']);
        $this->assertSame('2026-06-15', $vehicle->toArray()['kir_expires_at']);

        $document = new Document([
            'issued_at' => '2025-01-01',
            'expires_at' => '2026-01-01',
        ]);

        $this->assertSame('2025-01-01', $document->toArray()['issued_at']);
        $this->assertSame('2026-01-01', $document->toArray()['expires_at']);
    }
}
