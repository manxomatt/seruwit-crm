<?php

namespace Modules\Document\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Document\Models\DocumentType;

/**
 * @extends Factory<DocumentType>
 */
class DocumentTypeFactory extends Factory
{
    /**
     * @var class-string<DocumentType>
     */
    protected $model = DocumentType::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'entity_type' => fake()->randomElement([DocumentType::ENTITY_VEHICLE, DocumentType::ENTITY_DRIVER]),
            'key' => fake()->unique()->slug(2),
            'name' => fake()->words(2, true),
            'description' => fake()->optional()->sentence(),
            'is_required' => fake()->boolean(70),
            'has_expiry' => true,
            'typical_validity_days' => fake()->randomElement([180, 365, 730, 1825]),
            'reminder_days' => [30, 14, 7],
            'sort_order' => fake()->numberBetween(1, 10),
        ];
    }

    public function forVehicle(): static
    {
        return $this->state(fn (array $attributes): array => [
            'entity_type' => DocumentType::ENTITY_VEHICLE,
        ]);
    }

    public function forDriver(): static
    {
        return $this->state(fn (array $attributes): array => [
            'entity_type' => DocumentType::ENTITY_DRIVER,
        ]);
    }

    public function permanent(): static
    {
        return $this->state(fn (array $attributes): array => [
            'has_expiry' => false,
            'typical_validity_days' => null,
            'reminder_days' => [],
        ]);
    }
}
