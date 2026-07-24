<?php

namespace Modules\Receivables\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Partners\Models\Partner;
use Modules\Receivables\Models\Payment;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => Payment::nextCode(),
            'partner_id' => Partner::factory(),
            'payment_date' => now()->toDateString(),
            'amount' => fake()->randomFloat(2, 10000, 5000000),
            'type' => Payment::TYPE_INSTALLMENT,
            'method' => Payment::METHOD_TRANSFER,
            'reference_number' => fake()->optional()->bothify('TRF-########'),
            'status' => Payment::STATUS_POSTED,
            'notes' => null,
            'recorded_by' => null,
            'voided_at' => null,
        ];
    }
}
