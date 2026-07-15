<?php

namespace Tests\Feature\Modules;

use App\Models\Page;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Modules\Carousels\Models\Carousel;
use Modules\Carousels\Models\CarouselImage;
use Tests\TestCase;
use Tests\Traits\WithRoles;

/**
 * Characterization tests for Carousels, written before the feature is extracted
 * into modules/Carousels/. These pin the behaviour as it exists today so the
 * extraction can be proven to change nothing: the assertions here must stay
 * green, unedited, on both sides of the move.
 */
class CarouselTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_carousels(): void
    {
        $this->get(route('module.carousels.index'))->assertRedirect(route('login'));
    }

    public function test_user_without_permission_cannot_view_carousels(): void
    {
        $user = $this->createUserWithoutRole();

        $this->actingAs($user)->get(route('module.carousels.index'))->assertForbidden();
    }

    public function test_index_lists_only_the_current_users_carousels_with_image_counts(): void
    {
        $user = $this->createAdminUser();
        $other = $this->createAdminUser(['email' => 'other@example.com']);

        $mine = Carousel::factory()->create(['user_id' => $user->id, 'name' => 'My Slider']);
        CarouselImage::factory()->count(2)->create(['carousel_id' => $mine->id]);
        Carousel::factory()->create(['user_id' => $other->id, 'name' => 'Their Slider']);

        $this->actingAs($user)->get(route('module.carousels.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Carousels/Index')
                ->has('carousels', 1)
                ->where('carousels.0.name', 'My Slider')
                ->where('carousels.0.images_count', 2)
                ->where('can.create', true)
                ->where('can.update', true)
                ->where('can.delete', true)
            );
    }

    public function test_read_only_user_sees_index_without_write_abilities(): void
    {
        $user = $this->createUserWithRole();

        $this->actingAs($user)->get(route('module.carousels.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('can.create', false)
                ->where('can.update', false)
                ->where('can.delete', false)
            );
    }

    public function test_user_can_create_a_carousel_and_is_sent_to_the_editor(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->get(route('module.carousels.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Carousels/Create'));

        $response = $this->actingAs($user)->post(route('module.carousels.store'), [
            'name' => 'Promo Slider',
            'slug' => 'promo-slider',
            'description' => 'Homepage promos',
            'is_active' => true,
            'autoplay_interval' => 5000,
            'show_navigation' => true,
            'show_indicators' => true,
        ]);

        $carousel = Carousel::query()->firstWhere('slug', 'promo-slider');

        $this->assertNotNull($carousel);
        $this->assertSame($user->id, $carousel->user_id);
        $response->assertRedirect(route('module.carousels.edit', $carousel, absolute: false));
    }

    public function test_carousel_slug_must_be_unique_and_interval_within_bounds(): void
    {
        $user = $this->createAdminUser();
        Carousel::factory()->create(['user_id' => $user->id, 'slug' => 'taken-slug']);

        $this->actingAs($user)->post(route('module.carousels.store'), [
            'name' => 'Dupe',
            'slug' => 'taken-slug',
            'autoplay_interval' => 5000,
        ])->assertSessionHasErrors('slug');

        $this->actingAs($user)->post(route('module.carousels.store'), [
            'name' => 'Too Fast',
            'slug' => 'too-fast',
            'autoplay_interval' => 100,
        ])->assertSessionHasErrors('autoplay_interval');
    }

    public function test_user_cannot_touch_another_users_carousel(): void
    {
        $user = $this->createAdminUser();
        $other = $this->createAdminUser(['email' => 'other@example.com']);
        $theirs = Carousel::factory()->create(['user_id' => $other->id]);

        $this->actingAs($user)->get(route('module.carousels.show', $theirs))->assertForbidden();
        $this->actingAs($user)->get(route('module.carousels.edit', $theirs))->assertForbidden();
        $this->actingAs($user)->patch(route('module.carousels.update', $theirs), [
            'name' => 'Hijacked',
            'slug' => 'hijacked',
            'autoplay_interval' => 5000,
        ])->assertForbidden();
        $this->actingAs($user)->delete(route('module.carousels.destroy', $theirs))->assertForbidden();

        $this->assertDatabaseHas('carousels', ['id' => $theirs->id]);
    }

    public function test_user_can_view_edit_and_delete_their_own_carousel(): void
    {
        $user = $this->createAdminUser();
        $carousel = Carousel::factory()->create(['user_id' => $user->id, 'slug' => 'mine']);

        $this->actingAs($user)->get(route('module.carousels.show', $carousel))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Carousels/Show'));

        $this->actingAs($user)->get(route('module.carousels.edit', $carousel))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Carousels/Edit'));

        $this->actingAs($user)->patch(route('module.carousels.update', $carousel), [
            'name' => 'Renamed',
            'slug' => 'mine',
            'autoplay_interval' => 4000,
            'is_active' => false,
        ])->assertRedirect(route('module.carousels.edit', $carousel, absolute: false));

        $this->assertDatabaseHas('carousels', [
            'id' => $carousel->id,
            'name' => 'Renamed',
            'autoplay_interval' => 4000,
            'is_active' => false,
        ]);

        $this->actingAs($user)->delete(route('module.carousels.destroy', $carousel))
            ->assertRedirect(route('module.carousels.index', absolute: false));

        $this->assertDatabaseMissing('carousels', ['id' => $carousel->id]);
    }

    public function test_deleting_a_carousel_cascades_to_its_images(): void
    {
        $user = $this->createAdminUser();
        $carousel = Carousel::factory()->create(['user_id' => $user->id]);
        $image = CarouselImage::factory()->create(['carousel_id' => $carousel->id]);

        $this->actingAs($user)->delete(route('module.carousels.destroy', $carousel));

        $this->assertDatabaseMissing('carousel_images', ['id' => $image->id]);
    }

    public function test_uploaded_image_is_stored_and_appended_to_the_end(): void
    {
        Storage::fake('public');

        $user = $this->createAdminUser();
        $carousel = Carousel::factory()->create(['user_id' => $user->id]);
        CarouselImage::factory()->create(['carousel_id' => $carousel->id, 'sort_order' => 7]);

        $this->actingAs($user)->post(route('module.carousels.images.store', $carousel), [
            'image' => UploadedFile::fake()->image('slide.jpg'),
            'title' => 'First Slide',
            'link_target' => '_self',
        ])->assertRedirect(route('module.carousels.edit', $carousel, absolute: false));

        $image = CarouselImage::query()->firstWhere('title', 'First Slide');

        $this->assertNotNull($image);
        $this->assertSame(8, $image->sort_order);
        $this->assertStringStartsWith('carousels/', $image->image_path);
        Storage::disk('public')->assertExists($image->image_path);
    }

    public function test_external_image_url_is_stored_verbatim(): void
    {
        $user = $this->createAdminUser();
        $carousel = Carousel::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)->post(route('module.carousels.images.store', $carousel), [
            'image_url' => 'https://cdn.example.com/banner.jpg',
            'title' => 'Remote Slide',
            'link_target' => '_blank',
        ]);

        $this->assertDatabaseHas('carousel_images', [
            'carousel_id' => $carousel->id,
            'image_path' => 'https://cdn.example.com/banner.jpg',
            'link_target' => '_blank',
        ]);
    }

    public function test_image_requires_either_a_file_or_a_url(): void
    {
        $user = $this->createAdminUser();
        $carousel = Carousel::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)->post(route('module.carousels.images.store', $carousel), [
            'title' => 'No Source',
        ])->assertSessionHasErrors('image');
    }

    public function test_replacing_an_image_deletes_the_old_local_file(): void
    {
        Storage::fake('public');

        $user = $this->createAdminUser();
        $carousel = Carousel::factory()->create(['user_id' => $user->id]);
        $oldPath = UploadedFile::fake()->image('old.jpg')->store('carousels', 'public');
        $image = CarouselImage::factory()->create([
            'carousel_id' => $carousel->id,
            'image_path' => $oldPath,
        ]);

        $this->actingAs($user)->patch(route('module.carousels.images.update', [$carousel, $image]), [
            'image' => UploadedFile::fake()->image('new.jpg'),
            'title' => 'Updated Slide',
            'link_target' => '_self',
        ])->assertRedirect(route('module.carousels.edit', $carousel, absolute: false));

        $image->refresh();

        $this->assertSame('Updated Slide', $image->title);
        $this->assertNotSame($oldPath, $image->image_path);
        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists($image->image_path);
    }

    public function test_deleting_an_image_removes_its_local_file(): void
    {
        Storage::fake('public');

        $user = $this->createAdminUser();
        $carousel = Carousel::factory()->create(['user_id' => $user->id]);
        $path = UploadedFile::fake()->image('doomed.jpg')->store('carousels', 'public');
        $image = CarouselImage::factory()->create(['carousel_id' => $carousel->id, 'image_path' => $path]);

        $this->actingAs($user)->delete(route('module.carousels.images.destroy', [$carousel, $image]))
            ->assertRedirect(route('module.carousels.edit', $carousel, absolute: false));

        $this->assertDatabaseMissing('carousel_images', ['id' => $image->id]);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_image_belonging_to_another_carousel_is_not_found(): void
    {
        $user = $this->createAdminUser();
        $carousel = Carousel::factory()->create(['user_id' => $user->id]);
        $otherCarousel = Carousel::factory()->create(['user_id' => $user->id]);
        $strayImage = CarouselImage::factory()->create(['carousel_id' => $otherCarousel->id]);

        $this->actingAs($user)->delete(route('module.carousels.images.destroy', [$carousel, $strayImage]))
            ->assertNotFound();
    }

    public function test_images_can_be_reordered(): void
    {
        $user = $this->createAdminUser();
        $carousel = Carousel::factory()->create(['user_id' => $user->id]);
        $first = CarouselImage::factory()->create(['carousel_id' => $carousel->id, 'sort_order' => 0]);
        $second = CarouselImage::factory()->create(['carousel_id' => $carousel->id, 'sort_order' => 1]);

        $this->actingAs($user)->post(route('module.carousels.images.reorder', $carousel), [
            'images' => [
                ['id' => $first->id, 'sort_order' => 1],
                ['id' => $second->id, 'sort_order' => 0],
            ],
        ])->assertOk()->assertJson(['success' => true]);

        $this->assertSame(1, $first->fresh()->sort_order);
        $this->assertSame(0, $second->fresh()->sort_order);
    }

    public function test_public_page_renders_the_carousel_tag_as_a_component(): void
    {
        $user = $this->createAdminUser();
        $carousel = Carousel::factory()->active()->create([
            'user_id' => $user->id,
            'slug' => 'promo-slider',
        ]);
        CarouselImage::factory()->active()->create([
            'carousel_id' => $carousel->id,
            'title' => 'Big Summer Sale',
        ]);

        Page::factory()->published()->create([
            'user_id' => $user->id,
            'slug' => 'landing',
            'html' => '<div><carousel slug="promo-slider"></carousel></div>',
        ]);

        $response = $this->get('/p/landing');

        $response->assertOk();
        $response->assertSee('data-carousel="promo-slider"', escape: false);
        $response->assertSee('Big Summer Sale');
        $response->assertDontSee('<carousel', escape: false);
    }

    public function test_public_page_with_an_unknown_carousel_slug_still_renders(): void
    {
        $user = $this->createAdminUser();

        Page::factory()->published()->create([
            'user_id' => $user->id,
            'slug' => 'orphan',
            'html' => '<div>Hello<carousel slug="does-not-exist"></carousel></div>',
        ]);

        $response = $this->get('/p/orphan');

        $response->assertOk();
        $response->assertSee('Hello');
        $response->assertDontSee('<carousel', escape: false);
    }
}
