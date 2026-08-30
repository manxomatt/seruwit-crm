<?php

namespace Tests\Unit\Modules\Rental;

use Modules\Rental\AI\Services\GeminiRentalRateAiGeneratorService;
use PHPUnit\Framework\TestCase;

class GeminiRentalRateAiGeneratorServiceTest extends TestCase
{
    public function test_heuristic_parser_accurately_detects_rates_and_tiers(): void
    {
        $service = new GeminiRentalRateAiGeneratorService(apiKey: '');

        $vehicles = [
            ['id' => 10, 'name' => 'Toyota Avanza Veloz', 'plate_number' => 'B 1234 ABC', 'type' => 'car'],
            ['id' => 20, 'name' => 'Mitsubishi Canter Box', 'plate_number' => 'B 9999 XYZ', 'type' => 'truck'],
        ];
        $classes = [
            ['value' => 'mpv', 'label' => 'MPV'],
            ['value' => 'suv', 'label' => 'SUV'],
        ];

        // 1. Daily rate with vehicle match and volume tiers
        $resultDaily = $service->generateFromText(
            'Tarif Harian Avanza Veloz 450rb limit 200km deposit 500rb, sewa 3-6 hari diskon 10%, sewa 7+ hari diskon 20%',
            $vehicles,
            $classes
        );

        $this->assertSame('daily', $resultDaily['period_type']);
        $this->assertEquals(450000, $resultDaily['rate_per_period']);
        $this->assertEquals(500000, $resultDaily['deposit_amount']);
        $this->assertSame(200, $resultDaily['km_limit_per_period']);
        $this->assertSame('10', $resultDaily['vehicle_id']);
        $this->assertCount(2, $resultDaily['tiers']);
        $this->assertSame('period_volume', $resultDaily['tiers'][0]['tier_type']);
        $this->assertSame(3, $resultDaily['tiers'][0]['min_threshold']);
        $this->assertSame(6, $resultDaily['tiers'][0]['max_threshold']);
        $this->assertEquals(10, $resultDaily['tiers'][0]['modifier_value']);

        // 2. Monthly truck rate
        $resultMonthly = $service->generateFromText(
            'Paket Bulanan Truk Canter Box 12jt deposit 3jt denda telat 100rb',
            $vehicles,
            $classes
        );

        $this->assertSame('monthly', $resultMonthly['period_type']);
        $this->assertEquals(12000000, $resultMonthly['rate_per_period']);
        $this->assertEquals(3000000, $resultMonthly['deposit_amount']);
        $this->assertEquals(100000, $resultMonthly['late_fee_per_day']);
        $this->assertSame('20', $resultMonthly['vehicle_id']);

        // 3. Class SUV Weekly Rate with loyalty discount
        $resultWeekly = $service->generateFromText(
            'Tarif Mingguan Kelas SUV 2.5jt deposit 1jt limit 1500km, loyalty repeat order 5 kali diskon 15%',
            $vehicles,
            $classes
        );

        $this->assertSame('weekly', $resultWeekly['period_type']);
        $this->assertEquals(2500000, $resultWeekly['rate_per_period']);
        $this->assertSame('suv', $resultWeekly['rental_class']);
        $this->assertCount(1, $resultWeekly['tiers']);
        $this->assertSame('loyalty_count', $resultWeekly['tiers'][0]['tier_type']);
        $this->assertSame(5, $resultWeekly['tiers'][0]['min_threshold']);
        $this->assertEquals(15, $resultWeekly['tiers'][0]['modifier_value']);
    }
}
