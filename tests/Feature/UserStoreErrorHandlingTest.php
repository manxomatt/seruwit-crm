<?php

namespace Tests\Feature;

use App\Models\CentralUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class UserStoreErrorHandlingTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->setUpRoles();
    }

    public function test_cannot_create_user_with_email_that_exists_in_central_database(): void
    {
        $admin = $this->createAdminUser();

        // Create an existing global platform user in central
        CentralUser::create([
            'name' => 'Deddy Setiawan',
            'email' => 'dsetiawan@gmail.com',
            'password' => bcrypt('password123'),
        ]);

        $this->actingAs($admin)
            ->post(route('module.users.store'), [
                'name' => 'Deddy Setiawan Duplicate',
                'email' => 'dsetiawan@gmail.com',
                'password' => 'password123',
                'password_confirmation' => 'password123',
            ])
            ->assertSessionHasErrors(['email']);
    }

    public function test_can_create_user_with_new_unique_email(): void
    {
        $admin = $this->createAdminUser();

        $this->actingAs($admin)
            ->post(route('module.users.store'), [
                'name' => 'Unique New User',
                'email' => 'unique.new.user@example.com',
                'password' => 'password123',
                'password_confirmation' => 'password123',
            ])
            ->assertRedirect(route('module.users.index'));

        $this->assertDatabaseHas('users', [
            'email' => 'unique.new.user@example.com',
        ]);
    }
}
