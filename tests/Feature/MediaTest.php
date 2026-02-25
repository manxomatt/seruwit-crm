<?php

namespace Tests\Feature;

use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MediaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    /**
     * Test that unauthenticated users cannot access media index.
     */
    public function test_guests_cannot_access_media_index(): void
    {
        $response = $this->get(route('admin.media.index'));

        $response->assertRedirect(route('login'));
    }

    /**
     * Test that authenticated users can access media index.
     */
    public function test_authenticated_users_can_access_media_index(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('admin.media.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Admin/Media/Index'));
    }

    /**
     * Test that authenticated users can access media create page.
     */
    public function test_authenticated_users_can_access_media_create(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('admin.media.create'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Admin/Media/Create'));
    }

    /**
     * Test that users can upload media files.
     */
    public function test_users_can_upload_media(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $file = UploadedFile::fake()->image('test-image.jpg', 800, 600);

        $response = $this->actingAs($user)->post(route('admin.media.store'), [
            'file' => $file,
            'alt_text' => 'Test image alt text',
            'description' => 'Test image description',
        ]);

        $response->assertRedirect(route('admin.media.index'));
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('media', [
            'user_id' => $user->id,
            'original_name' => 'test-image.jpg',
            'alt_text' => 'Test image alt text',
            'description' => 'Test image description',
            'type' => 'image',
        ]);

        Storage::disk('public')->assertExists('media/'.$file->hashName());
    }

    /**
     * Test that users can upload media via AJAX.
     */
    public function test_users_can_upload_media_via_ajax(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $file = UploadedFile::fake()->image('ajax-image.png', 400, 300);

        $response = $this->actingAs($user)->postJson(route('admin.media.upload'), [
            'file' => $file,
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
        ]);
        $response->assertJsonStructure([
            'success',
            'media' => [
                'id',
                'name',
                'original_name',
                'url',
                'mime_type',
                'size',
                'human_size',
                'type',
            ],
        ]);

        $this->assertDatabaseHas('media', [
            'user_id' => $user->id,
            'original_name' => 'ajax-image.png',
            'type' => 'image',
        ]);
    }

    /**
     * Test that users can view their own media.
     */
    public function test_users_can_view_their_own_media(): void
    {
        $user = User::factory()->create();
        $media = Media::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->get(route('admin.media.show', $media));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Media/Show')
            ->has('media')
        );
    }

    /**
     * Test that users cannot view other users' media.
     */
    public function test_users_cannot_view_other_users_media(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $media = Media::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($user)->get(route('admin.media.show', $media));

        $response->assertStatus(403);
    }

    /**
     * Test that users can edit their own media.
     */
    public function test_users_can_edit_their_own_media(): void
    {
        $user = User::factory()->create();
        $media = Media::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->get(route('admin.media.edit', $media));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Media/Edit')
            ->has('media')
        );
    }

    /**
     * Test that users can update their own media.
     */
    public function test_users_can_update_their_own_media(): void
    {
        $user = User::factory()->create();
        $media = Media::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->patch(route('admin.media.update', $media), [
            'alt_text' => 'Updated alt text',
            'description' => 'Updated description',
        ]);

        $response->assertRedirect(route('admin.media.index'));
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('media', [
            'id' => $media->id,
            'alt_text' => 'Updated alt text',
            'description' => 'Updated description',
        ]);
    }

    /**
     * Test that users cannot update other users' media.
     */
    public function test_users_cannot_update_other_users_media(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $media = Media::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($user)->patch(route('admin.media.update', $media), [
            'alt_text' => 'Hacked alt text',
        ]);

        $response->assertStatus(403);
    }

    /**
     * Test that users can delete their own media.
     */
    public function test_users_can_delete_their_own_media(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $file = UploadedFile::fake()->image('to-delete.jpg');
        $path = $file->store('media', 'public');

        $media = Media::factory()->create([
            'user_id' => $user->id,
            'path' => $path,
            'disk' => 'public',
        ]);

        Storage::disk('public')->assertExists($path);

        $response = $this->actingAs($user)->delete(route('admin.media.destroy', $media));

        $response->assertRedirect(route('admin.media.index'));
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('media', ['id' => $media->id]);
        Storage::disk('public')->assertMissing($path);
    }

    /**
     * Test that users cannot delete other users' media.
     */
    public function test_users_cannot_delete_other_users_media(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $media = Media::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($user)->delete(route('admin.media.destroy', $media));

        $response->assertStatus(403);
        $this->assertDatabaseHas('media', ['id' => $media->id]);
    }

    /**
     * Test that users can bulk delete their own media.
     */
    public function test_users_can_bulk_delete_their_own_media(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $media1 = Media::factory()->create(['user_id' => $user->id, 'disk' => 'public']);
        $media2 = Media::factory()->create(['user_id' => $user->id, 'disk' => 'public']);
        $media3 = Media::factory()->create(['user_id' => $user->id, 'disk' => 'public']);

        $response = $this->actingAs($user)->post(route('admin.media.bulk-destroy'), [
            'ids' => [$media1->id, $media2->id],
        ]);

        $response->assertRedirect(route('admin.media.index'));
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('media', ['id' => $media1->id]);
        $this->assertDatabaseMissing('media', ['id' => $media2->id]);
        $this->assertDatabaseHas('media', ['id' => $media3->id]);
    }

    /**
     * Test that media index can be filtered by type.
     */
    public function test_media_index_can_be_filtered_by_type(): void
    {
        $user = User::factory()->create();
        Media::factory()->image()->create(['user_id' => $user->id]);
        Media::factory()->video()->create(['user_id' => $user->id]);
        Media::factory()->document()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->get(route('admin.media.index', ['type' => 'image']));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Media/Index')
            ->has('media.data', 1)
        );
    }

    /**
     * Test that media index can be searched.
     */
    public function test_media_index_can_be_searched(): void
    {
        $user = User::factory()->create();
        Media::factory()->create([
            'user_id' => $user->id,
            'original_name' => 'unique-searchable-name.jpg',
        ]);
        Media::factory()->create([
            'user_id' => $user->id,
            'original_name' => 'other-file.png',
        ]);

        $response = $this->actingAs($user)->get(route('admin.media.index', ['search' => 'unique-searchable']));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Media/Index')
            ->has('media.data', 1)
        );
    }

    /**
     * Test that file upload validation works.
     */
    public function test_file_upload_validation(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('admin.media.store'), [
            'file' => null,
        ]);

        $response->assertSessionHasErrors('file');
    }

    /**
     * Test that media picker returns JSON.
     */
    public function test_media_picker_returns_json(): void
    {
        $user = User::factory()->create();
        Media::factory()->count(3)->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->getJson(route('admin.media.picker'));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'name',
                    'original_name',
                    'url',
                    'mime_type',
                    'size',
                    'human_size',
                    'type',
                    'alt_text',
                ],
            ],
        ]);
    }
}
