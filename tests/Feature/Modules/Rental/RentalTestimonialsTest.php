<?php

namespace Tests\Feature\Modules\Rental;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Pages\Models\Page;
use Modules\Rental\Support\RentalStorefrontBlocks;
use Modules\Rental\Support\RentalTestimonials;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalTestimonialsTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_testimonials_tab_renders(): void
    {
        $this->actingAs($this->createUserWithRole())
            ->get(route('module.rental.settings.index', ['tab' => 'testimonials']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Settings/Index')
                ->where('tab', 'testimonials')
                ->has('testimonials'));
    }

    public function test_testimonials_can_be_saved_and_published_filter_applies(): void
    {
        $this->actingAs($this->createAdminUser())
            ->patch(route('module.rental.settings.testimonials.update'), [
                'testimonials' => [
                    ['author' => 'Budi', 'location' => 'Jakarta', 'rating' => 5, 'body' => 'Mobil bersih, pelayanan cepat.', 'published' => true],
                    ['author' => 'Sari', 'location' => '', 'rating' => 4, 'body' => 'Proses booking mudah.', 'published' => false],
                ],
            ])
            ->assertRedirect();

        $this->assertCount(2, RentalTestimonials::all());

        $published = RentalTestimonials::published();
        $this->assertCount(1, $published);
        $this->assertSame('Budi', $published[0]['author']);
    }

    public function test_testimonials_validation_rejects_bad_rating(): void
    {
        $this->actingAs($this->createAdminUser())
            ->patch(route('module.rental.settings.testimonials.update'), [
                'testimonials' => [
                    ['author' => 'Budi', 'rating' => 9, 'body' => 'Bagus'],
                ],
            ])
            ->assertSessionHasErrors('testimonials.0.rating');
    }

    public function test_render_reviews_outputs_published_items(): void
    {
        RentalTestimonials::save([
            ['author' => 'Budi', 'location' => 'Jakarta', 'rating' => 5, 'body' => 'Sangat memuaskan.', 'published' => true],
            ['author' => 'Sari', 'location' => 'Bandung', 'rating' => 4, 'body' => 'Disembunyikan.', 'published' => false],
        ]);

        $html = RentalStorefrontBlocks::renderReviews(6);

        $this->assertStringContainsString('Budi', $html);
        $this->assertStringContainsString('Sangat memuaskan.', $html);
        $this->assertStringNotContainsString('Disembunyikan.', $html);
    }

    public function test_render_reviews_empty_when_none_published(): void
    {
        $this->assertSame('', RentalStorefrontBlocks::renderReviews(6));
    }

    public function test_published_page_renders_reviews_marker(): void
    {
        RentalTestimonials::save([
            ['author' => 'Budi', 'location' => 'Jakarta', 'rating' => 5, 'body' => 'Sangat memuaskan.', 'published' => true],
        ]);

        Page::factory()->published()->create([
            'slug' => 'ulasan',
            'html' => '<section><rental-reviews limit="6"></rental-reviews></section>',
        ]);

        $this->get(route('pages.render', 'ulasan'))
            ->assertOk()
            ->assertSee('Sangat memuaskan.')
            ->assertDontSee('<rental-reviews', false);
    }
}
