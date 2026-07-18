<?php

namespace Modules\Pages\Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use Modules\Pages\Models\Page;

/**
 * @extends Factory<Page>
 */
class PageFactory extends Factory
{
    /**
     * Factory resolution assumes App\Models, so a module factory has to state
     * its model outright.
     *
     * @var class-string<Page>
     */
    protected $model = Page::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->sentence(3);

        return [
            'user_id' => User::factory(),
            'title' => $title,
            'slug' => Str::slug($title).'-'.fake()->unique()->randomNumber(5),
            'html' => '<div class="container"><h1>'.fake()->sentence().'</h1><p>'.fake()->paragraph().'</p></div>',
            'css' => '.container { max-width: 1200px; margin: 0 auto; padding: 20px; }',
            'gjs_data' => null,
            'is_published' => fake()->boolean(30),
            'is_homepage' => false,
        ];
    }

    /**
     * Indicate that the page is published.
     */
    public function published(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_published' => true,
        ]);
    }

    /**
     * Indicate that the page is a draft.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_published' => false,
        ]);
    }

    /**
     * Indicate that the page is the homepage.
     */
    public function homepage(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_homepage' => true,
            'is_published' => true,
        ]);
    }
}
