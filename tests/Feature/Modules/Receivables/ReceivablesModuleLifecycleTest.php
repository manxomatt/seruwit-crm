<?php

namespace Tests\Feature\Modules\Receivables;

use App\Modules\ModuleInstaller;
use Illuminate\Support\Facades\Schema;
use Modules\Receivables\ReceivablesModule;
use Tests\TestCase;
use Tests\Traits\WithRoles;
use Tests\Traits\WithTenant;

class ReceivablesModuleLifecycleTest extends TestCase
{
    use WithRoles, WithTenant;

    public function test_receivables_tables_are_created_on_install(): void
    {
        $tenant = $this->provisionTenant('Receivables Install Co', 'receivables-install-co', 'owner@receivables-install.test');
        $tenant->plan = 'pro';
        $tenant->save();

        app(ModuleInstaller::class)->install($tenant, new ReceivablesModule);

        $tenant->run(function () {
            $this->assertTrue(Schema::hasTable('payments'));
            $this->assertTrue(Schema::hasTable('payment_allocations'));
            $this->assertTrue(Schema::hasColumn('invoices', 'amount_paid'));
            $this->assertDatabaseHas('permissions', ['module' => 'receivables', 'action' => 'view']);
            $this->assertDatabaseHas('permissions', ['module' => 'receivables', 'action' => 'create']);
            $this->assertDatabaseHas('menus', ['slug' => 'receivables']);
        });
    }
}
