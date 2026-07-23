<?php

namespace Modules\Invoicing\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Invoicing\Models\Invoice;
use Modules\Partners\Models\Partner;

/**
 * @extends Factory<Invoice>
 */
class InvoiceFactory extends Factory
{
    /**
     * Factory::modelName() infers App\Models from the factory's own name, so a
     * module factory has to state its model outright.
     *
     * @var class-string<Invoice>
     */
    protected $model = Invoice::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => 'INV-'.fake()->unique()->numerify('######'),
            'partner_id' => Partner::factory(),
            'status' => Invoice::STATUS_DRAFT,
            'issue_date' => now()->toDateString(),
            'due_date' => null,
            'tax_enabled' => true,
            'tax_rate' => 11,
            'subtotal' => 0,
            'tax_amount' => 0,
            'total' => 0,
            'paid_at' => null,
            'notes' => null,
        ];
    }

    /**
     * Indicate that the invoice has been issued.
     */
    public function issued(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => Invoice::STATUS_ISSUED,
        ]);
    }

    /**
     * Indicate that the invoice has been paid.
     */
    public function paid(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => Invoice::STATUS_PAID,
            'paid_at' => now(),
        ]);
    }
}
