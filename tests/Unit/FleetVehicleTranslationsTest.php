<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class FleetVehicleTranslationsTest extends TestCase
{
    public function test_fleet_vehicle_translations_include_failure_snackbar_keys(): void
    {
        $baseDir = dirname(__DIR__, 2);
        $idFleet = require $baseDir.'/lang/id/fleet.php';
        $enFleet = require $baseDir.'/lang/en/fleet.php';

        $this->assertArrayHasKey('create_failed_snackbar', $idFleet['vehicles']);
        $this->assertArrayHasKey('create_failed_title', $idFleet['vehicles']);
        $this->assertArrayHasKey('create_failed_desc', $idFleet['vehicles']);

        $this->assertArrayHasKey('create_failed_snackbar', $enFleet['vehicles']);
        $this->assertArrayHasKey('create_failed_title', $enFleet['vehicles']);
        $this->assertArrayHasKey('create_failed_desc', $enFleet['vehicles']);

        $this->assertSame('Gagal menyimpan data kendaraan baru. Periksa kembali isian formulir:', $idFleet['vehicles']['create_failed_snackbar']);
        $this->assertSame('Failed to save new vehicle data. Please check the form fields:', $enFleet['vehicles']['create_failed_snackbar']);
    }
}
