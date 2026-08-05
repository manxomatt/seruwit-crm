<?php

namespace Modules\Rental\Database\Factories;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;
use Modules\Rental\Models\Rental;

/**
 * @extends Factory<Rental>
 */
class RentalFactory extends Factory
{
    protected $model = Rental::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $start = Carbon::parse(fake()->dateTimeBetween('-1 month', '+1 month'))->toDateString();
        $days = fake()->numberBetween(1, 14);
        $end = Carbon::parse($start)->addDays($days - 1)->toDateString();
        $rate = fake()->randomFloat(2, 300000, 1500000);

        return [
            'code' => Rental::nextCode(),
            'vehicle_id' => Vehicle::factory(),
            'driver_id' => null,
            'partner_id' => Partner::factory(),
            'status' => Rental::STATUS_DRAFT,
            'start_date' => $start,
            'end_date' => $end,
            'actual_return_date' => null,
            'period_type' => 'daily',
            'rate_per_period' => $rate,
            'km_limit_per_period' => null,
            'excess_km_rate' => null,
            'late_fee_per_day' => null,
            'deposit_amount' => $rate,
            'total_periods' => $days,
            'base_amount' => $rate * $days,
            'start_odometer' => null,
            'end_odometer' => null,
            'excess_km' => null,
            'excess_amount' => 0,
            'overdue_days' => null,
            'late_fee_amount' => 0,
            'deposit_returned' => false,
            'deposit_status' => Rental::DEPOSIT_HELD,
            'deposit_applied_amount' => 0,
            'deposit_refunded_amount' => 0,
            'deposit_settled_at' => null,
            'deposit_received_at' => null,
            'deposit_payment_method' => null,
            'deposit_company_bank_account_id' => null,
            'total_amount' => $rate * $days,
            'notes' => null,
            'pickup_location' => null,
            'return_location' => null,
            'fuel_policy_notes' => null,
            'cancelled_reason' => null,
            'cancelled_at' => null,
            'no_show_at' => null,
            'confirmed_by' => null,
            'confirmed_at' => null,
            'reserved_until' => null,
            'checked_out_at' => null,
            'returned_at' => null,
            'completed_at' => null,
        ];
    }

    public function confirmed(): static
    {
        return $this->state(fn (array $a): array => [
            'status' => Rental::STATUS_CONFIRMED,
            'confirmed_at' => now(),
            'reserved_until' => null,
            'deposit_received_at' => ((float) ($a['deposit_amount'] ?? 0)) > 0 ? now() : null,
            'deposit_payment_method' => ((float) ($a['deposit_amount'] ?? 0)) > 0 ? 'cash' : null,
        ]);
    }

    public function pendingReserved(): static
    {
        return $this->state(fn (): array => [
            'status' => Rental::STATUS_PENDING_RESERVED,
            'reserved_until' => now()->addMinutes(120),
            'channel' => Rental::CHANNEL_MOBILE,
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn (): array => [
            'status' => Rental::STATUS_PENDING,
            'reserved_until' => null,
            'channel' => Rental::CHANNEL_MOBILE,
        ]);
    }

    public function active(): static
    {
        return $this->state(fn (array $a): array => [
            'status' => Rental::STATUS_ACTIVE,
            'confirmed_at' => now()->subDay(),
            'checked_out_at' => now(),
            'start_odometer' => fake()->numberBetween(10000, 100000),
            'deposit_received_at' => ((float) ($a['deposit_amount'] ?? 0)) > 0 ? now()->subDay() : null,
            'deposit_payment_method' => ((float) ($a['deposit_amount'] ?? 0)) > 0 ? 'cash' : null,
        ]);
    }

    public function returned(): static
    {
        return $this->state(fn (array $a): array => [
            'status' => Rental::STATUS_RETURNED,
            'confirmed_at' => now()->subDays(3),
            'checked_out_at' => now()->subDays(2),
            'returned_at' => now(),
            'start_odometer' => 50000,
            'end_odometer' => 50200,
            'excess_km' => 0,
            'deposit_status' => Rental::DEPOSIT_SETTLED,
            'deposit_applied_amount' => 0,
            'deposit_refunded_amount' => $a['deposit_amount'] ?? 0,
            'deposit_returned' => true,
            'deposit_settled_at' => now(),
            'deposit_received_at' => ((float) ($a['deposit_amount'] ?? 0)) > 0 ? now()->subDays(3) : null,
            'deposit_payment_method' => ((float) ($a['deposit_amount'] ?? 0)) > 0 ? 'cash' : null,
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $a): array => [
            'status' => Rental::STATUS_COMPLETED,
            'confirmed_at' => now()->subDays(5),
            'checked_out_at' => now()->subDays(4),
            'returned_at' => now()->subDay(),
            'completed_at' => now(),
            'deposit_status' => Rental::DEPOSIT_SETTLED,
            'deposit_applied_amount' => 0,
            'deposit_refunded_amount' => $a['deposit_amount'] ?? 0,
            'deposit_returned' => true,
            'deposit_settled_at' => now()->subDay(),
            'deposit_received_at' => ((float) ($a['deposit_amount'] ?? 0)) > 0 ? now()->subDays(5) : null,
            'deposit_payment_method' => ((float) ($a['deposit_amount'] ?? 0)) > 0 ? 'cash' : null,
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $a): array => [
            'status' => Rental::STATUS_CANCELLED,
            'cancelled_reason' => fake()->sentence(),
            'cancelled_at' => now(),
            'reserved_until' => null,
        ]);
    }

    public function cancelledPaid(): static
    {
        return $this->state(fn (): array => [
            'status' => Rental::STATUS_CANCELLED_PAID,
            'cancelled_reason' => fake()->sentence(),
            'cancelled_at' => now(),
            'reserved_until' => null,
        ]);
    }

    public function noShow(): static
    {
        return $this->state(fn (): array => [
            'status' => Rental::STATUS_NO_SHOW,
            'no_show_at' => now(),
            'reserved_until' => null,
        ]);
    }

    public function noShowPaid(): static
    {
        return $this->state(fn (): array => [
            'status' => Rental::STATUS_NO_SHOW_PAID,
            'no_show_at' => now(),
            'reserved_until' => null,
        ]);
    }
}
