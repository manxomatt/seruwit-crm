<?php

namespace Tests\Feature\Tenancy;

use App\Actions\Tenancy\CreateTenantAction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantBaseDomainTest extends TestCase
{
    use RefreshDatabase;

    public function test_full_domain_uses_tenant_base_domain_config(): void
    {
        config(['tenancy.tenant_base_domain' => 'seruwit.com']);

        $this->assertSame(
            'anugerahtravel.seruwit.com',
            CreateTenantAction::fullDomain('anugerahtravel'),
        );
    }

    public function test_full_domain_falls_back_to_app_url_host_via_config_default(): void
    {
        config(['tenancy.tenant_base_domain' => 'localhost.test']);

        $this->assertSame(
            'acme.localhost.test',
            CreateTenantAction::fullDomain('acme'),
        );
    }
}
