<?php

namespace Tests\Feature\Admin;

use App\Models\Carousel;
use App\Models\CarouselImage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CarouselControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_carousels_index_requires_authentication(): void
    {
        $response = $this->get(route('admin.carousels.index'));

        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_access_carousels_index(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('admin.carousels.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Carousels/Index')
            ->has('carousels')
        );
    }

    public function test_carousels_index_shows_only_user_carousels(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $userCarousel = Carousel::factory()->for($user)->create(['name' => 'My Carousel']);
        Carousel::factory()->for($otherUser)->create(['name' => 'Other Carousel']);

        $response = $this->actingAs($user)->get(route('admin.carousels.index'));

        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Carousels/Index')
            ->has('carousels', 1)
            ->where('carousels.0.name', 'My Carousel')
        );
    }

    public function test_authenticated_user_can_access_create_carousel(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('admin.carousels.create'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Carousels/Create')
        );
    }

    public function test_authenticated_user_can_store_carousel(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('admin.carousels.store'), [
            'name' => 'Test Carousel',
            'slug' => 'test-carousel',
            'description' => 'A test carousel',
            'is_active' => true,
            'autoplay_interval' => 5000,
            'show_navigation' => true,
            'show_indicators' => true,
        ]);

        $this->assertDatabaseHas('carousels', [
            'name' => 'Test Carousel',
            'slug' => 'test-carousel',
            'user_id' => $user->id,
        ]);

        $carousel = Carousel::where('slug', 'test-carousel')->first();
        $response->assertRedirect(route('admin.carousels.edit', $carousel));
    }

    public function test_store_carousel_validates_required_fields(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('admin.carousels.store'), []);

        $response->assertSessionHasErrors(['name', 'slug']);
    }

    public function test_store_carousel_validates_unique_slug(): void
    {
        $user = User::factory()->create();
        Carousel::factory()->for($user)->create(['slug' => 'existing-slug']);

        $response = $this->actingAs($user)->post(route('admin.carousels.store'), [
            'name' => 'Test Carousel',
            'slug' => 'existing-slug',
        ]);

        $response->assertSessionHasErrors(['slug']);
    }

    public function test_authenticated_user_can_view_own_carousel(): void
    {
        $user = User::factory()->create();
        $carousel = Carousel::factory()->for($user)->create();

        $response = $this->actingAs($user)->get(route('admin.carousels.show', $carousel));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Carousels/Show')
            ->has('carousel')
            ->where('carousel.id', $carousel->id)
        );
    }

    public function test_authenticated_user_cannot_view_carousel_of_other_user(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $carousel = Carousel::factory()->for($otherUser)->create();

        $response = $this->actingAs($user)->get(route('admin.carousels.show', $carousel));

        $response->assertStatus(403);
    }

    public function test_authenticated_user_can_edit_own_carousel(): void
    {
        $user = User::factory()->create();
        $carousel = Carousel::factory()->for($user)->create();

        $response = $this->actingAs($user)->get(route('admin.carousels.edit', $carousel));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Carousels/Edit')
            ->has('carousel')
            ->where('carousel.id', $carousel->id)
        );
    }

    public function test_authenticated_user_cannot_edit_carousel_of_other_user(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $carousel = Carousel::factory()->for($otherUser)->create();

        $response = $this->actingAs($user)->get(route('admin.carousels.edit', $carousel));

        $response->assertStatus(403);
    }

    public function test_authenticated_user_can_update_own_carousel(): void
    {
        $user = User::factory()->create();
        $carousel = Carousel::factory()->for($user)->create();

        $response = $this->actingAs($user)->patch(route('admin.carousels.update', $carousel), [
            'name' => 'Updated Name',
            'slug' => 'updated-slug',
        ]);

        $response->assertRedirect(route('admin.carousels.edit', $carousel));
        $this->assertDatabaseHas('carousels', [
            'id' => $carousel->id,
            'name' => 'Updated Name',
            'slug' => 'updated-slug',
        ]);
    }

    public function test_authenticated_user_cannot_update_carousel_of_other_user(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $carousel = Carousel::factory()->for($otherUser)->create();

        $response = $this->actingAs($user)->patch(route('admin.carousels.update', $carousel), [
            'name' => 'Updated Name',
        ]);

        $response->assertStatus(403);
    }

    public function test_authenticated_user_can_delete_own_carousel(): void
    {
        $user = User::factory()->create();
        $carousel = Carousel::factory()->for($user)->create();

        $response = $this->actingAs($user)->delete(route('admin.carousels.destroy', $carousel));

        $response->assertRedirect(route('admin.carousels.index'));
        $this->assertDatabaseMissing('carousels', ['id' => $carousel->id]);
    }

    public function test_authenticated_user_cannot_delete_carousel_of_other_user(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $carousel = Carousel::factory()->for($otherUser)->create();

        $response = $this->actingAs($user)->delete(route('admin.carousels.destroy', $carousel));

        $response->assertStatus(403);
        $this->assertDatabaseHas('carousels', ['id' => $carousel->id]);
    }

    public function test_deleting_carousel_also_deletes_images(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $carousel = Carousel::factory()->for($user)->create();
        $image = CarouselImage::factory()->for($carousel)->create([
            'image_path' => 'carousels/test.jpg',
        ]);

        $this->actingAs($user)->delete(route('admin.carousels.destroy', $carousel));

        $this->assertDatabaseMissing('carousel_images', ['id' => $image->id]);
    }

    public function test_authenticated_user_can_add_image_to_carousel(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $carousel = Carousel::factory()->for($user)->create();

        $response = $this->actingAs($user)->post(route('admin.carousels.images.store', $carousel), [
            'image' => UploadedFile::fake()->image('slide.jpg'),
            'title' => 'Test Slide',
            'description' => 'Test description',
            'is_active' => true,
        ]);

        $response->assertRedirect(route('admin.carousels.edit', $carousel));
        $this->assertDatabaseHas('carousel_images', [
            'carousel_id' => $carousel->id,
            'title' => 'Test Slide',
        ]);
        Storage::disk('public')->assertExists('carousels/'.basename(CarouselImage::first()->image_path));
    }

    public function test_authenticated_user_cannot_add_image_to_other_user_carousel(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $carousel = Carousel::factory()->for($otherUser)->create();

        $response = $this->actingAs($user)->post(route('admin.carousels.images.store', $carousel), [
            'image' => UploadedFile::fake()->image('slide.jpg'),
        ]);

        $response->assertStatus(403);
    }

    public function test_authenticated_user_can_delete_image_from_carousel(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $carousel = Carousel::factory()->for($user)->create();
        $image = CarouselImage::factory()->for($carousel)->create([
            'image_path' => 'carousels/test.jpg',
        ]);

        Storage::disk('public')->put('carousels/test.jpg', 'fake image content');

        $response = $this->actingAs($user)->delete(route('admin.carousels.images.destroy', [$carousel, $image]));

        $response->assertRedirect(route('admin.carousels.edit', $carousel));
        $this->assertDatabaseMissing('carousel_images', ['id' => $image->id]);
    }

    public function test_authenticated_user_can_reorder_carousel_images(): void
    {
        $user = User::factory()->create();
        $carousel = Carousel::factory()->for($user)->create();
        $image1 = CarouselImage::factory()->for($carousel)->create(['sort_order' => 0]);
        $image2 = CarouselImage::factory()->for($carousel)->create(['sort_order' => 1]);
        $image3 = CarouselImage::factory()->for($carousel)->create(['sort_order' => 2]);

        $response = $this->actingAs($user)->postJson(route('admin.carousels.images.reorder', $carousel), [
            'images' => [
                ['id' => $image1->id, 'sort_order' => 2],
                ['id' => $image2->id, 'sort_order' => 0],
                ['id' => $image3->id, 'sort_order' => 1],
            ],
        ]);

        $response->assertJson(['success' => true]);
        $this->assertDatabaseHas('carousel_images', ['id' => $image1->id, 'sort_order' => 2]);
        $this->assertDatabaseHas('carousel_images', ['id' => $image2->id, 'sort_order' => 0]);
        $this->assertDatabaseHas('carousel_images', ['id' => $image3->id, 'sort_order' => 1]);
    }

    public function test_carousel_index_includes_images_count(): void
    {
        $user = User::factory()->create();
        $carousel = Carousel::factory()->for($user)->create();
        CarouselImage::factory()->for($carousel)->count(3)->create();

        $response = $this->actingAs($user)->get(route('admin.carousels.index'));

        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Carousels/Index')
            ->where('carousels.0.images_count', 3)
        );
    }
}
