<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_profile_can_be_created(): void
    {
        $user = User::factory()->create();
        $profile = UserProfile::factory()->create([
            'user_id' => $user->id,
            'first_name' => 'John',
            'last_name' => 'Doe',
            'phone_number' => '+1234567890',
            'avatar_url' => 'https://example.com/avatar.jpg',
        ]);

        $this->assertDatabaseHas('user_profiles', [
            'user_id' => $user->id,
            'first_name' => 'John',
            'last_name' => 'Doe',
            'phone_number' => '+1234567890',
            'avatar_url' => 'https://example.com/avatar.jpg',
        ]);
    }

    public function test_user_has_profile_relationship(): void
    {
        $user = User::factory()->create();
        $profile = UserProfile::factory()->create(['user_id' => $user->id]);

        $this->assertInstanceOf(UserProfile::class, $user->profile);
        $this->assertEquals($profile->id, $user->profile->id);
    }

    public function test_profile_belongs_to_user(): void
    {
        $user = User::factory()->create();
        $profile = UserProfile::factory()->create(['user_id' => $user->id]);

        $this->assertInstanceOf(User::class, $profile->user);
        $this->assertEquals($user->id, $profile->user->id);
    }

    public function test_profile_full_name_attribute(): void
    {
        $profile = UserProfile::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Doe',
        ]);

        $this->assertEquals('John Doe', $profile->full_name);
    }

    public function test_profile_full_name_with_only_first_name(): void
    {
        $profile = UserProfile::factory()->create([
            'first_name' => 'John',
            'last_name' => null,
        ]);

        $this->assertEquals('John', $profile->full_name);
    }

    public function test_profile_full_name_returns_null_when_empty(): void
    {
        $profile = UserProfile::factory()->minimal()->create();

        $this->assertNull($profile->full_name);
    }

    public function test_profile_is_deleted_when_user_is_deleted(): void
    {
        $user = User::factory()->create();
        $profile = UserProfile::factory()->create(['user_id' => $user->id]);

        $user->delete();

        $this->assertDatabaseMissing('user_profiles', ['id' => $profile->id]);
    }
}
