<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Media>
 */
class MediaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $mimeTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'video/mp4',
        ];

        $mimeType = fake()->randomElement($mimeTypes);
        $type = match (true) {
            str_starts_with($mimeType, 'image/') => 'image',
            str_starts_with($mimeType, 'video/') => 'video',
            default => 'document',
        };

        $extension = match ($mimeType) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            'application/pdf' => 'pdf',
            'video/mp4' => 'mp4',
            default => 'bin',
        };

        $fileName = fake()->uuid().'.'.$extension;

        return [
            'user_id' => User::factory(),
            'name' => $fileName,
            'original_name' => fake()->words(3, true).'.'.$extension,
            'path' => 'media/'.$fileName,
            'disk' => 'public',
            'mime_type' => $mimeType,
            'size' => fake()->numberBetween(1024, 10485760),
            'type' => $type,
            'alt_text' => fake()->optional()->sentence(),
            'description' => fake()->optional()->paragraph(),
            'metadata' => null,
        ];
    }

    /**
     * Indicate that the media is an image.
     */
    public function image(): static
    {
        return $this->state(fn (array $attributes) => [
            'mime_type' => fake()->randomElement(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
            'type' => 'image',
        ]);
    }

    /**
     * Indicate that the media is a video.
     */
    public function video(): static
    {
        return $this->state(fn (array $attributes) => [
            'mime_type' => 'video/mp4',
            'type' => 'video',
        ]);
    }

    /**
     * Indicate that the media is a document.
     */
    public function document(): static
    {
        return $this->state(fn (array $attributes) => [
            'mime_type' => 'application/pdf',
            'type' => 'document',
        ]);
    }
}
