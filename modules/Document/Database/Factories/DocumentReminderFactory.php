<?php

namespace Modules\Document\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Document\Models\Document;
use Modules\Document\Models\DocumentReminder;

/**
 * @extends Factory<DocumentReminder>
 */
class DocumentReminderFactory extends Factory
{
    /**
     * @var class-string<DocumentReminder>
     */
    protected $model = DocumentReminder::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'document_id' => Document::factory(),
            'days_before' => fake()->randomElement([30, 14, 7]),
            'remind_at' => fake()->dateTimeBetween('now', '+30 days'),
            'sent_at' => null,
        ];
    }

    public function sent(): static
    {
        return $this->state(fn (array $attributes): array => [
            'sent_at' => now(),
        ]);
    }

    public function due(): static
    {
        return $this->state(fn (array $attributes): array => [
            'remind_at' => today(),
            'sent_at' => null,
        ]);
    }
}
