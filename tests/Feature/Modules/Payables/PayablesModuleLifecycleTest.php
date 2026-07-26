<?php

namespace Tests\Feature\Modules\Payables;

use App\Modules\ModuleInstaller;
use Illuminate\Support\Facades\Schema;
use Modules\Payables\PayablesModule;
use Tests\TestCase;
use Tests\Traits\WithRoles;
use Tests\Traits\WithTenant;

class PayablesModuleLifecycleTest extends TestCase
{
    use WithRoles, WithTenant;

    public function test_payables_tables_are_created_on_install(): void
    {
        $tenant = $this->provisionTenant('Payables Install Co', 'payables-install-co', 'owner@payables-install.test');
        $tenant->plan = 'pro';
        $tenant->save();

        app(ModuleInstaller::class)->install($tenant, new PayablesModule);

        $tenant->run(function () {
            $this->assertTrue(Schema::hasTable('supplier_bills'));
            $this->assertTrue(Schema::hasTable('supplier_bill_lines'));
            $this->assertTrue(Schema::hasTable('bill_payments'));
            $this->assertTrue(Schema::hasTable('bill_payment_allocations'));
            $this->assertDatabaseHas('permissions', ['module' => 'payables', 'action' => 'view']);
            $this->assertDatabaseHas('menus', ['slug' => 'payables']);
        });
    }
}
