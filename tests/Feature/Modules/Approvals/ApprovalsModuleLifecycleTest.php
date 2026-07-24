<?php

namespace Tests\Feature\Modules\Approvals;

use App\Modules\ModuleInstaller;
use Illuminate\Support\Facades\Schema;
use Modules\Approvals\ApprovalsModule;
use Tests\TestCase;
use Tests\Traits\WithRoles;
use Tests\Traits\WithTenant;

class ApprovalsModuleLifecycleTest extends TestCase
{
    use WithRoles, WithTenant;

    public function test_approvals_tables_are_created_on_install(): void
    {
        $tenant = $this->provisionTenant('Approvals Install Co', 'approvals-install-co', 'owner@approvals-install.test');
        $tenant->plan = 'pro';
        $tenant->save();

        app(ModuleInstaller::class)->install($tenant, new ApprovalsModule);

        $tenant->run(function () {
            $this->assertTrue(Schema::hasTable('approval_policies'));
            $this->assertTrue(Schema::hasTable('approval_policy_levels'));
            $this->assertTrue(Schema::hasTable('approval_requests'));
            $this->assertTrue(Schema::hasTable('approval_actions'));
            $this->assertDatabaseHas('permissions', ['module' => 'approvals', 'action' => 'decide']);
            $this->assertDatabaseHas('menus', ['slug' => 'approvals']);
        });
    }
}
