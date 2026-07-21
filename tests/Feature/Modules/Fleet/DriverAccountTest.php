<?php

namespace Tests\Feature\Modules\Fleet;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Driver;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class DriverAccountTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_admin_provisions_a_login_for_a_driver(): void
    {
        $admin = $this->createAdminUser();
        $driver = Driver::factory()->create(['user_id' => null]);

        $this->actingAs($admin)
            ->post(route('module.fleet.drivers.account.store', $driver), [
                'name' => 'Budi Santoso',
                'username' => 'budi',
                'email' => 'budi@example.com',
                'password' => 'secret1234',
            ])
            ->assertSessionHas('success');

        $driver->refresh();
        $this->assertNotNull($driver->user_id);

        $user = User::find($driver->user_id);
        $this->assertSame('budi', $user->username);
        $this->assertTrue($user->hasRole('driver'));
        $this->assertTrue($user->hasPermissionFor('orders', 'deliver'));
    }

    public function test_a_driver_that_already_has_a_login_is_rejected(): void
    {
        $admin = $this->createAdminUser();
        $existing = User::factory()->create();
        $driver = Driver::factory()->create(['user_id' => $existing->id]);

        $this->actingAs($admin)
            ->post(route('module.fleet.drivers.account.store', $driver), [
                'name' => 'Dupe',
                'username' => 'dupe',
                'email' => 'dupe@example.com',
                'password' => 'secret1234',
            ])
            ->assertSessionHasErrors('username');

        $driver->refresh();
        $this->assertSame($existing->id, $driver->user_id);
    }

    public function test_a_duplicate_username_is_rejected(): void
    {
        $admin = $this->createAdminUser();
        User::factory()->create(['username' => 'taken']);
        $driver = Driver::factory()->create(['user_id' => null]);

        $this->actingAs($admin)
            ->post(route('module.fleet.drivers.account.store', $driver), [
                'name' => 'Someone',
                'username' => 'taken',
                'email' => 'someone@example.com',
                'password' => 'secret1234',
            ])
            ->assertSessionHasErrors('username');

        $driver->refresh();
        $this->assertNull($driver->user_id);
    }

    public function test_for_user_resolves_the_driver_behind_a_login(): void
    {
        $user = User::factory()->create();
        $driver = Driver::factory()->create(['user_id' => $user->id]);

        $this->assertTrue(Driver::forUser($user)->is($driver));
        $this->assertNull(Driver::forUser(User::factory()->create()));
    }

    public function test_the_driver_role_carries_only_delivery_capabilities(): void
    {
        $role = Role::where('slug', 'driver')->firstOrFail();
        $slugs = $role->permissions->pluck('slug')->all();

        $this->assertContains('orders.view', $slugs);
        $this->assertContains('orders.deliver', $slugs);
        $this->assertContains('transportation.view', $slugs);
        $this->assertNotContains('transportation.update', $slugs);
        $this->assertNotContains('orders.update', $slugs);
    }
}
