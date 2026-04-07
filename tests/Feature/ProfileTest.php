<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_page_is_displayed(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get('/profile');

        $response->assertOk();
    }

    public function test_profile_information_can_be_updated(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $user->refresh();

        $this->assertSame('Test User', $user->name);
        $this->assertSame('test@example.com', $user->email);
        $this->assertNull($user->email_verified_at);
    }

    public function test_email_verification_status_is_unchanged_when_the_email_address_is_unchanged(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => $user->email,
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_user_can_delete_their_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->delete('/profile', [
                'password' => 'password',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/');

        $this->assertGuest();
        $this->assertNull($user->fresh());
    }

    public function test_correct_password_must_be_provided_to_delete_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/profile')
            ->delete('/profile', [
                'password' => 'wrong-password',
            ]);

        $response
            ->assertSessionHasErrors('password')
            ->assertRedirect('/profile');

        $this->assertNotNull($user->fresh());
    }

    public function test_user_can_upload_avatar(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->post('/profile/avatar', [
                'avatar' => UploadedFile::fake()->image('avatar.jpg', 200, 200),
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $user->refresh();
        $this->assertNotNull($user->profile);
        $this->assertNotNull($user->profile->avatar_url);
        $this->assertStringContainsString('/storage/avatars/', $user->profile->avatar_url);

        // Verify file exists
        $path = str_replace('/storage/', '', $user->profile->avatar_url);
        Storage::disk('public')->assertExists($path);
    }

    public function test_avatar_upload_requires_image(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/profile')
            ->post('/profile/avatar', [
                'avatar' => UploadedFile::fake()->create('document.pdf', 100),
            ]);

        $response
            ->assertSessionHasErrors('avatar')
            ->assertRedirect('/profile');
    }

    public function test_avatar_upload_validates_file_size(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/profile')
            ->post('/profile/avatar', [
                'avatar' => UploadedFile::fake()->image('avatar.jpg')->size(3000), // 3MB, exceeds 2MB limit
            ]);

        $response
            ->assertSessionHasErrors('avatar')
            ->assertRedirect('/profile');
    }

    public function test_user_can_remove_avatar(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        // First upload an avatar
        $file = UploadedFile::fake()->image('avatar.jpg', 200, 200);
        $path = $file->store('avatars', 'public');

        UserProfile::factory()->create([
            'user_id' => $user->id,
            'avatar_url' => '/storage/'.$path,
        ]);

        $response = $this
            ->actingAs($user)
            ->delete('/profile/avatar');

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $user->refresh();
        $this->assertNull($user->profile->avatar_url);

        // Verify file is deleted
        Storage::disk('public')->assertMissing($path);
    }

    public function test_old_avatar_is_deleted_when_uploading_new_one(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        // First upload an avatar
        $oldFile = UploadedFile::fake()->image('old-avatar.jpg', 200, 200);
        $oldPath = $oldFile->store('avatars', 'public');

        UserProfile::factory()->create([
            'user_id' => $user->id,
            'avatar_url' => '/storage/'.$oldPath,
        ]);

        // Upload new avatar
        $response = $this
            ->actingAs($user)
            ->post('/profile/avatar', [
                'avatar' => UploadedFile::fake()->image('new-avatar.jpg', 200, 200),
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        // Verify old file is deleted
        Storage::disk('public')->assertMissing($oldPath);

        // Verify new file exists
        $user->refresh();
        $newPath = str_replace('/storage/', '', $user->profile->avatar_url);
        Storage::disk('public')->assertExists($newPath);
    }

    public function test_avatar_is_deleted_when_user_deletes_account(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        // Upload an avatar
        $file = UploadedFile::fake()->image('avatar.jpg', 200, 200);
        $path = $file->store('avatars', 'public');

        UserProfile::factory()->create([
            'user_id' => $user->id,
            'avatar_url' => '/storage/'.$path,
        ]);

        $response = $this
            ->actingAs($user)
            ->delete('/profile', [
                'password' => 'password',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/');

        // Verify file is deleted
        Storage::disk('public')->assertMissing($path);
    }
}
