<?php

namespace Modules\Invoicing\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Model;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;

/**
 * @extends Factory<InvoiceLine>
 */
class InvoiceLineFactory extends Factory
{
    /**
     * Factory::modelName() infers App\Models from the factory's own name, so a
     * module factory has to state its model outright.
     *
     * @var class-string<InvoiceLine>
     */
    protected $model = InvoiceLine::class;

    /**
     * Define the model's default state. Defaults to a free-form line, since
     * that is the shape Invoicing can produce without any other module.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'invoice_id' => Invoice::factory(),
            'description' => fake()->sentence(3),
            'amount' => fake()->randomFloat(2, 50_000, 5_000_000),
            'source_type' => null,
            'source_id' => null,
        ];
    }

    /**
     * Point the line at whatever a billing module raised it for. Named to stay
     * clear of Factory::for(), which means something else entirely.
     */
    public function sourcedFrom(Model $source): static
    {
        return $this->state(fn (array $attributes): array => [
            'source_type' => $source->getMorphClass(),
            'source_id' => $source->getKey(),
        ]);
    }
}
