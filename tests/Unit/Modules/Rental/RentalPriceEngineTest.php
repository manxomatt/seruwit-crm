<?php

namespace Tests\Unit\Modules\Rental;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalRate;
use Modules\Rental\Models\RentalRateTier;
use Modules\Rental\Support\RentalPriceEngine;
use Tests\TestCase;

class RentalPriceEngineTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function scenario_1_single_period_no_tier_uses_base_rate(): void
    {
        $vehicle = Vehicle::factory()->create();
        $rate = RentalRate::factory()->daily()->general()->create([
            'name' => 'Daily Base Sedan',
            'rate_per_period' => 200_000,
            'priority' => 10,
        ]);

        $engine = app(RentalPriceEngine::class);
        $result = $engine->calculate($vehicle, '2026-08-11', '2026-08-11', 'daily');

        $this->assertSame(200_000.0, $result['base_rate_per_period']);
        $this->assertSame(200_000.0, $result['effective_rate_per_period']);
        $this->assertSame(1, $result['total_periods']);
        $this->assertSame(200_000.0, $result['base_amount']);
        $this->assertSame(0.0, $result['discount_amount']);
        $this->assertNull($result['period_tier_applied']);
        $this->assertNull($result['loyalty_tier_applied']);
        $this->assertCount(1, $result['period_breakdown']);
        $this->assertNull($result['period_breakdown'][0]['tier_label']);
    }

    /** @test */
    public function scenario_2_period_volume_tier_4_days_applies_fixed_rate(): void
    {
        $vehicle = Vehicle::factory()->create();
        $rate = RentalRate::factory()->daily()->general()->create([
            'rate_per_period' => 200_000,
        ]);

        RentalRateTier::factory()
            ->periodVolume()
            ->threshold(4, 7)
            ->fixed(175_000)
            ->for($rate, 'rentalRate')
            ->create();

        $engine = app(RentalPriceEngine::class);
        $result = $engine->calculate($vehicle, '2026-08-11', '2026-08-15', 'daily');

        $this->assertSame(5, $result['total_periods']);
        $this->assertSame(175_000.0, $result['effective_rate_per_period']);
        $this->assertSame(875_000.0, $result['base_amount']);
        $this->assertSame(125_000.0, $result['discount_amount']);
        $this->assertNotNull($result['period_tier_applied']);
        $this->assertSame(175_000.0, (float) $result['period_tier_applied']->rate_per_period);
        $this->assertCount(5, $result['period_breakdown']);
        $this->assertStringContainsString('Period 4-7 Fixed', (string) $result['period_breakdown'][0]['tier_label']);
    }

    /** @test */
    public function scenario_3_loyalty_tier_3rd_rental_gives_percent_discount(): void
    {
        $partner = Partner::factory()->create();
        $vehicle = Vehicle::factory()->create(['rental_class' => 'SUV']);

        Rental::factory()->create([
            'code' => 'RENT-TEST-001',
            'partner_id' => $partner->id,
            'vehicle_id' => $vehicle->id,
            'period_type' => 'daily',
            'status' => Rental::STATUS_COMPLETED,
        ]);
        Rental::factory()->create([
            'code' => 'RENT-TEST-002',
            'partner_id' => $partner->id,
            'vehicle_id' => $vehicle->id,
            'period_type' => 'daily',
            'status' => Rental::STATUS_COMPLETED,
        ]);

        $rate = RentalRate::factory()->daily()->forRentalClass('SUV')->create([
            'rate_per_period' => 300_000,
        ]);

        RentalRateTier::factory()
            ->loyalty()
            ->threshold(3, 5)
            ->percent(10)
            ->for($rate, 'rentalRate')
            ->create();

        $engine = app(RentalPriceEngine::class);
        $result = $engine->calculate($vehicle, '2026-08-11', '2026-08-12', 'daily', $partner);

        $this->assertSame(2, $result['loyalty_completed_rental_count']);
        $this->assertSame(300_000.0, $result['base_rate_per_period']);
        $this->assertSame(270_000.0, $result['effective_rate_per_period']);
        $this->assertSame(540_000.0, $result['base_amount']);
        $this->assertSame(60_000.0, $result['discount_amount']);
        $this->assertNotNull($result['loyalty_tier_applied']);
        $this->assertSame('10.00', (string) $result['loyalty_tier_applied']->discount_percent);
    }

    /** @test */
    public function scenario_4_period_and_loyalty_stack_for_deepest_discount(): void
    {
        $partner = Partner::factory()->create();
        $vehicle = Vehicle::factory()->create(['rental_class' => 'SUV']);

        foreach (range(1, 5) as $i) {
            Rental::factory()->create([
                'code' => "RENT-STACK-00{$i}",
                'partner_id' => $partner->id,
                'vehicle_id' => $vehicle->id,
                'status' => Rental::STATUS_COMPLETED,
            ]);
        }

        $rate = RentalRate::factory()->daily()->forRentalClass('SUV')->create([
            'rate_per_period' => 400_000,
        ]);

        RentalRateTier::factory()
            ->periodVolume()
            ->threshold(5, 10)
            ->percent(15)
            ->for($rate, 'rentalRate')
            ->create();

        RentalRateTier::factory()
            ->loyalty()
            ->threshold(6)
            ->flat(20_000)
            ->for($rate, 'rentalRate')
            ->create();

        $engine = app(RentalPriceEngine::class);
        $result = $engine->calculate($vehicle, '2026-08-01', '2026-08-05', 'daily', $partner);

        // 5 completed → rental #6, so loyalty kicks in.
        // Base 400k
        // Stage 1 period 15% off → 340k
        // Stage 2 loyalty -20k flat → 320k x 5 = 1.600.000
        $this->assertSame(5, $result['total_periods']);
        $this->assertSame(320_000.0, $result['effective_rate_per_period']);
        $this->assertSame(1_600_000.0, $result['base_amount']);

        // Plain: 5 * 400k = 2.000.000 → saving 400k
        $this->assertSame(400_000.0, $result['discount_amount']);
        $this->assertNotNull($result['period_tier_applied']);
        $this->assertNotNull($result['loyalty_tier_applied']);
        $this->assertStringContainsString('Period', (string) $result['period_breakdown'][0]['tier_label']);
        $this->assertStringContainsString('Loyalty', (string) $result['period_breakdown'][0]['tier_label']);
    }

    /** @test */
    public function scenario_5_period_below_tier_threshold_stays_base(): void
    {
        $vehicle = Vehicle::factory()->create();
        $rate = RentalRate::factory()->daily()->general()->create([
            'rate_per_period' => 500_000,
        ]);

        RentalRateTier::factory()
            ->periodVolume()
            ->threshold(7, 30)
            ->percent(20)
            ->for($rate, 'rentalRate')
            ->create();

        $engine = app(RentalPriceEngine::class);
        $result = $engine->calculate($vehicle, '2026-08-11', '2026-08-13', 'daily');

        // 3 days → below 7-day threshold, tier should NOT apply
        $this->assertSame(3, $result['total_periods']);
        $this->assertSame(500_000.0, $result['effective_rate_per_period']);
        $this->assertSame(1_500_000.0, $result['base_amount']);
        $this->assertSame(0.0, $result['discount_amount']);
        $this->assertNull($result['period_tier_applied']);
        $this->assertNull($result['period_breakdown'][0]['tier_label']);
    }

    /** @test */
    public function period_range_breakdown_matches_expected_dates(): void
    {
        $vehicle = Vehicle::factory()->create();
        RentalRate::factory()->daily()->general()->create(['rate_per_period' => 100_000]);

        $engine = app(RentalPriceEngine::class);
        $result = $engine->calculate($vehicle, '2026-08-11', '2026-08-13', 'daily');

        $this->assertCount(3, $result['period_breakdown']);
        $this->assertSame('2026-08-11', $result['period_breakdown'][0]['from_date']);
        $this->assertSame('2026-08-11', $result['period_breakdown'][0]['to_date']);
        $this->assertSame('2026-08-13', $result['period_breakdown'][2]['from_date']);
        $this->assertSame('2026-08-13', $result['period_breakdown'][2]['to_date']);
    }
}
