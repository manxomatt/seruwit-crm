<?php

declare(strict_types=1);

namespace Tests\Feature\Tenancy;

use App\Models\Domain;
use App\Models\Tenant;
use App\Models\User;
use App\Rules\ValidCustomDomain;
use App\Services\CloudflareCustomHostnameService;
use App\Services\DomainVerificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class CustomDomainTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_custom_domain_rule_accepts_valid_fqdn(): void
    {
        config([
            'tenancy.central_domains' => ['seruwit.com', 'localhost'],
            'tenancy.tenant_base_domain' => 'seruwit.com',
        ]);

        $validator = Validator::make(
            ['domain' => 'sewa.rentaljaya.com'],
            ['domain' => [new ValidCustomDomain()]]
        );

        $this->assertFalse($validator->fails());
    }

    public function test_valid_custom_domain_rule_rejects_central_and_base_domains(): void
    {
        config([
            'tenancy.central_domains' => ['seruwit.com', 'localhost'],
            'tenancy.tenant_base_domain' => 'seruwit.com',
        ]);

        // Central domain collision
        $validatorCentral = Validator::make(
            ['domain' => 'seruwit.com'],
            ['domain' => [new ValidCustomDomain()]]
        );
        $this->assertTrue($validatorCentral->fails());

        // Platform tenant subdomain collision
        $validatorSub = Validator::make(
            ['domain' => 'workspace.seruwit.com'],
            ['domain' => [new ValidCustomDomain()]]
        );
        $this->assertTrue($validatorSub->fails());

        // Invalid format
        $validatorInvalid = Validator::make(
            ['domain' => 'not-a-domain'],
            ['domain' => [new ValidCustomDomain()]]
        );
        $this->assertTrue($validatorInvalid->fails());
    }

    public function test_domain_verification_service_verifies_via_cname(): void
    {
        $tenant = Tenant::create([
            'id' => 'tenant-cname-test',
            'name' => 'Rental Jaya',
        ]);

        $systemDomain = $tenant->domains()->create([
            'domain' => 'rentaljaya.seruwit.com',
            'is_custom' => false,
            'is_primary' => true,
            'status' => Domain::STATUS_ACTIVE,
        ]);

        /** @var Domain $customDomain */
        $customDomain = $tenant->domains()->create([
            'domain' => 'sewa.rentaljaya.com',
            'is_custom' => true,
            'is_primary' => false,
            'status' => Domain::STATUS_PENDING_DNS,
            'verification_token' => 'test-token-123',
        ]);

        $cfService = new CloudflareCustomHostnameService();
        $verificationService = new DomainVerificationService($cfService);

        // Mock DNS resolver returning a matching CNAME record
        $verificationService->setDnsResolver(function (string $hostname, int $type) {
            return [
                [
                    'host' => 'sewa.rentaljaya.com',
                    'type' => 'CNAME',
                    'target' => 'rentaljaya.seruwit.com',
                ],
            ];
        });

        $result = $verificationService->verify($customDomain);

        $this->assertTrue($result);
        $this->assertSame(Domain::STATUS_VERIFIED, $customDomain->fresh()->status);
        $this->assertNotNull($customDomain->fresh()->verified_at);
        $this->assertNull($customDomain->fresh()->last_error);
    }

    public function test_domain_verification_service_verifies_via_txt_challenge(): void
    {
        $tenant = Tenant::create([
            'id' => 'tenant-txt-test',
            'name' => 'Rental Maju',
        ]);

        $tenant->domains()->create([
            'domain' => 'rentalmaju.seruwit.com',
            'is_custom' => false,
            'is_primary' => true,
            'status' => Domain::STATUS_ACTIVE,
        ]);

        /** @var Domain $customDomain */
        $customDomain = $tenant->domains()->create([
            'domain' => 'rentalmaju.com',
            'is_custom' => true,
            'is_primary' => false,
            'status' => Domain::STATUS_PENDING_DNS,
            'verification_token' => 'secret-token-xyz',
        ]);

        $cfService = new CloudflareCustomHostnameService();
        $verificationService = new DomainVerificationService($cfService);

        // Mock DNS resolver returning a TXT verification record
        $verificationService->setDnsResolver(function (string $hostname, int $type) {
            return [
                [
                    'host' => '_seruwit-challenge.rentalmaju.com',
                    'type' => 'TXT',
                    'txt' => 'seruwit-verification=secret-token-xyz',
                ],
            ];
        });

        $result = $verificationService->verify($customDomain);

        $this->assertTrue($result);
        $this->assertSame(Domain::STATUS_VERIFIED, $customDomain->fresh()->status);
    }

    public function test_domain_verification_fails_when_dns_does_not_match(): void
    {
        $tenant = Tenant::create([
            'id' => 'tenant-fail-test',
            'name' => 'Rental Gagal',
        ]);

        $tenant->domains()->create([
            'domain' => 'rentalgagal.seruwit.com',
            'is_custom' => false,
            'is_primary' => true,
            'status' => Domain::STATUS_ACTIVE,
        ]);

        /** @var Domain $customDomain */
        $customDomain = $tenant->domains()->create([
            'domain' => 'app.rentalgagal.com',
            'is_custom' => true,
            'is_primary' => false,
            'status' => Domain::STATUS_PENDING_DNS,
            'verification_token' => 'secret-token-xyz',
        ]);

        $cfService = new CloudflareCustomHostnameService();
        $verificationService = new DomainVerificationService($cfService);

        // Mock DNS returning unmatching records
        $verificationService->setDnsResolver(fn () => []);

        $result = $verificationService->verify($customDomain);

        $this->assertFalse($result);
        $this->assertSame(Domain::STATUS_PENDING_DNS, $customDomain->fresh()->status);
        $this->assertNotNull($customDomain->fresh()->last_error);
    }
}
