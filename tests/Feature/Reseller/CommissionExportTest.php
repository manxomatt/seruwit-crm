<?php

namespace Tests\Feature\Reseller;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\WithResellerCommissions;

class CommissionExportTest extends TestCase
{
    use RefreshDatabase, WithResellerCommissions;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        config()->set('reseller.default_rate', ['type' => 'percent', 'value' => 10]);
    }

    private function csvFrom(\Illuminate\Testing\TestResponse $response): string
    {
        ob_start();
        $response->baseResponse->sendContent();

        return (string) ob_get_clean();
    }

    private function resellerWithRole(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Role::query()->where('slug', 'reseller')->firstOrFail());

        return $user;
    }

    public function test_a_reseller_exports_only_their_own_rows(): void
    {
        $reseller = $this->resellerWithRole();
        $other = $this->makeReseller();
        $plan = $this->makePlan(1_000_000);

        $this->confirmOrder($this->makeOrder($this->makeTenant($reseller->global_id, ['name' => 'Mine Co']), $plan));
        $this->confirmOrder($this->makeOrder($this->makeTenant($other->global_id, ['name' => 'Theirs Co']), $plan));

        $response = $this->actingAs($reseller)->get(route('module.reseller.commissions.export'));
        $response->assertOk();

        $csv = $this->csvFrom($response);

        $this->assertStringContainsString('Mine Co', $csv);
        $this->assertStringNotContainsString('Theirs Co', $csv);
        $this->assertStringContainsString('commission_amount', $csv);
    }

    public function test_admin_export_covers_every_reseller(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(Role::query()->where('slug', 'admin')->firstOrFail());

        $plan = $this->makePlan(1_000_000);
        $this->confirmOrder($this->makeOrder($this->makeTenant($this->makeReseller()->global_id, ['name' => 'First Co']), $plan));
        $this->confirmOrder($this->makeOrder($this->makeTenant($this->makeReseller()->global_id, ['name' => 'Second Co']), $plan));

        $response = $this->actingAs($admin)->get(route('module.reseller-commissions.export'));
        $response->assertOk();

        $csv = $this->csvFrom($response);

        $this->assertStringContainsString('First Co', $csv);
        $this->assertStringContainsString('Second Co', $csv);
    }

    public function test_a_reseller_cannot_use_the_platform_wide_export(): void
    {
        $this->actingAs($this->resellerWithRole())
            ->get(route('module.reseller-commissions.export'))
            ->assertForbidden();
    }

    public function test_a_plain_user_cannot_export_anything(): void
    {
        $user = User::factory()->create();
        $user->assignRole(Role::query()->where('slug', 'user')->firstOrFail());

        $this->actingAs($user)->get(route('module.reseller.commissions.export'))->assertForbidden();
    }
}
