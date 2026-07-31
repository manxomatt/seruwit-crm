<?php

namespace Tests\Feature\Modules;

use App\Modules\Facades\Modules;
use App\Modules\ModuleInstaller;
use App\Modules\ModuleTier;
use Modules\Accounting\AccountingModule;
use Modules\Partners\PartnersModule;
use RuntimeException;
use Tests\TestCase;
use Tests\Traits\WithTenant;

class CoreFinanceModulesTest extends TestCase
{
    use WithTenant;

    public function test_partners_and_accounting_are_core_not_optional(): void
    {
        $this->assertFalse(Modules::has('partners'));
        $this->assertFalse(Modules::has('accounting'));
        $this->assertTrue(Modules::available('partners'));
        $this->assertTrue(Modules::available('accounting'));
        $this->assertArrayHasKey('partners', Modules::core());
        $this->assertArrayHasKey('accounting', Modules::core());
        $this->assertSame(ModuleTier::Foundation, Modules::find('partners')?->tier());
        $this->assertSame(ModuleTier::Foundation, Modules::find('accounting')?->tier());
    }

    public function test_core_modules_cannot_be_installed_via_installer(): void
    {
        $tenant = $this->provisionTenant('Core Guard Co', 'core-guard-co', 'owner@core-guard.test');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('core feature');

        app(ModuleInstaller::class)->install($tenant, new AccountingModule);
    }

    public function test_partners_core_module_also_cannot_be_installed(): void
    {
        $tenant = $this->provisionTenant('Partners Guard Co', 'partners-guard-co', 'owner@partners-guard.test');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('core feature');

        app(ModuleInstaller::class)->install($tenant, new PartnersModule);
    }
}
