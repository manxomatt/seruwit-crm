<?php

namespace Modules\Document\Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Document\Models\Document;
use Modules\Document\Models\DocumentType;
use Modules\Fleet\Models\Vehicle;

/**
 * @extends Factory<Document>
 */
class DocumentFactory extends Factory
{
    /**
     * @var class-string<Document>
     */
    protected $model = Document::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'document_type_id' => DocumentType::factory()->forVehicle(),
            'documentable_type' => 'vehicle',
            'documentable_id' => Vehicle::factory(),
            'document_number' => fake()->optional()->bothify('???-####-####'),
            'issued_at' => fake()->dateTimeBetween('-2 years', 'now'),
            'expires_at' => fake()->dateTimeBetween('now', '+2 years'),
            'notes' => fake()->optional()->sentence(),
            'media_id' => null,
            'uploaded_by' => User::factory(),
            'verified_by' => null,
            'verified_at' => null,
        ];
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes): array => [
            'expires_at' => fake()->dateTimeBetween('-1 year', '-1 day'),
        ]);
    }

    public function expiringSoon(int $days = 7): static
    {
        return $this->state(fn (array $attributes): array => [
            'expires_at' => now()->addDays(fake()->numberBetween(1, $days)),
        ]);
    }

    public function permanent(): static
    {
        return $this->state(fn (array $attributes): array => [
            'expires_at' => null,
            'document_type_id' => DocumentType::factory()->permanent(),
        ]);
    }

    public function verified(): static
    {
        return $this->state(fn (array $attributes): array => [
            'verified_by' => User::factory(),
            'verified_at' => now(),
        ]);
    }
}
