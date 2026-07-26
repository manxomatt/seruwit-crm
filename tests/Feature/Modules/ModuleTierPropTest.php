<?php

namespace Tests\Feature\Modules;

use App\Models\User;
use App\Modules\ModuleRegistry;
use Tests\TestCase;
use Tests\Traits\WithTenant;

/**
 * The sidebar builds its groups from the `moduleTiers` prop rather than a
 * hand-maintained list, so this prop is now a contract between the module
 * registry and the layout — if it stops being shared, every module silently
 * drops out of the sidebar's tier-derived groups.
 */
class ModuleTierPropTest extends TestCase
{
    use WithTenant;

    public function test_every_registered_module_is_shared_with_its_tier(): void
    {
        $tenant = $this->provisionTenant('Tier Co', 'tier-co', 'owner@tier.test');
        $owner = $tenant->run(fn (): User => User::query()->firstWhere('email', 'owner@tier.test'));

        $expected = count(app(ModuleRegistry::class)->all());

        $this->actingAs($owner)->get('http://tier-co.localhost/module/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('moduleTiers', $expected)
                // Ordered by each module menu sort_order (BI currently sorts first).
                ->where('moduleTiers.0.key', 'bi')
                ->where('moduleTiers.0.tier', 'vertical')
                ->where('moduleTiers.1.key', 'pages')
                ->where('moduleTiers.1.tier', 'content')
            );
    }
}
