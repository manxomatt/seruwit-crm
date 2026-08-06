<?php

namespace Tests\Feature;

use App\Actions\Tenancy\CreateTenantAction;
use App\Models\MailConfig;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\User;
use App\Support\TenantMailConfigBootstrapper;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;
use Tests\Traits\WithTenant;

class MailConfigTest extends TestCase
{
    use WithTenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->withoutMiddleware([
            \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
            \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
        ]);
    }

    private function ownerOf(Tenant $tenant, string $email): User
    {
        return $tenant->run(fn (): User => User::query()->firstWhere('email', $email));
    }

    private function tenantUrl(string $subdomain, string $path): string
    {
        return 'http://'.CreateTenantAction::fullDomain($subdomain).$path;
    }

    public function test_tenant_smtp_can_be_configured_and_bootstrapped(): void
    {
        Config::set([
            'mail.default' => 'log',
            'mail.from.address' => 'central@platform.test',
            'mail.from.name' => 'Platform',
            'mail.mailers.smtp.host' => 'smtp.platform.test',
            'mail.mailers.smtp.username' => 'central',
            'mail.mailers.smtp.password' => 'central-pass',
        ]);

        $tenant = $this->provisionTenant('Mail Co', 'mail-co', 'owner@mail.test');
        $owner = $this->ownerOf($tenant, 'owner@mail.test');
        $emailSettingsUrl = $this->tenantUrl('mail-co', '/module/settings/email');
        $mailUpdateUrl = $this->tenantUrl('mail-co', '/module/settings/mail');

        $tenant->run(function (): void {
            Setting::setValue('email.from_address', 'hello@mail.test');
            Setting::setValue('email.from_name', 'Mail Workspace');
            Setting::setValue('email.reply_to', 'support@mail.test');
        });
        tenancy()->end();

        $this->actingAs($owner)
            ->get($emailSettingsUrl)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Settings/Group')
                ->where('currentGroup', 'email')
                ->where('mailConfig.is_enabled', false)
                ->where('mailConfig.has_password', false)
                ->missing('mailConfig.password')
            );

        $this->actingAs($owner)
            ->from($emailSettingsUrl)
            ->patch($mailUpdateUrl, [
                'is_enabled' => true,
                'host' => 'smtp.example.com',
                'port' => 587,
                'encryption' => 'tls',
                'username' => 'mail@example.com',
                'password' => '',
            ])
            ->assertRedirect($emailSettingsUrl)
            ->assertSessionHasErrors('password');

        $this->actingAs($owner)
            ->patch($mailUpdateUrl, [
                'is_enabled' => true,
                'host' => 'smtp.example.com',
                'port' => 465,
                'encryption' => 'ssl',
                'username' => 'mail@example.com',
                'password' => 'super-secret',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $tenant->run(function (): void {
            $config = MailConfig::query()->first();
            $this->assertNotNull($config);
            $this->assertTrue($config->isConfigured());
            $this->assertSame('smtp.example.com', $config->host);
            $this->assertSame(465, $config->port);
            $this->assertSame('ssl', $config->encryption);
            $this->assertSame('mail@example.com', $config->username);
            $this->assertSame('super-secret', $config->password);
        });

        $this->actingAs($owner)
            ->get($emailSettingsUrl)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('mailConfig.has_password', true)
                ->where('mailConfig.is_configured', true)
                ->missing('mailConfig.password')
            );

        $this->actingAs($owner)
            ->patch($mailUpdateUrl, [
                'is_enabled' => true,
                'host' => 'smtp.example.com',
                'port' => 465,
                'encryption' => 'ssl',
                'username' => 'mail@example.com',
                'password' => '',
            ])
            ->assertRedirect();

        $tenant->run(function (): void {
            $this->assertSame('super-secret', MailConfig::query()->first()->password);
        });

        if (tenancy()->initialized) {
            tenancy()->end();
        }

        Config::set([
            'mail.default' => 'log',
            'mail.from.address' => 'central@platform.test',
            'mail.from.name' => 'Platform',
            'mail.mailers.smtp.host' => 'smtp.platform.test',
            'mail.mailers.smtp.username' => 'central',
            'mail.mailers.smtp.password' => 'central-pass',
        ]);
        app(TenantMailConfigBootstrapper::class)->revert();

        $tenant->run(function (): void {
            $this->assertSame('smtp', Config::get('mail.default'));
            $this->assertSame('smtp.example.com', Config::get('mail.mailers.smtp.host'));
            $this->assertSame(465, Config::get('mail.mailers.smtp.port'));
            $this->assertSame('mail@example.com', Config::get('mail.mailers.smtp.username'));
            $this->assertSame('super-secret', Config::get('mail.mailers.smtp.password'));
            $this->assertSame('hello@mail.test', Config::get('mail.from.address'));
            $this->assertSame('Mail Workspace', Config::get('mail.from.name'));
            $this->assertSame('support@mail.test', Config::get('mail.reply_to.address'));
        });

        $this->assertSame('log', Config::get('mail.default'));
        $this->assertSame('central@platform.test', Config::get('mail.from.address'));
        $this->assertSame('smtp.platform.test', Config::get('mail.mailers.smtp.host'));
    }

    public function test_disabled_smtp_keeps_central_mailer(): void
    {
        Config::set([
            'mail.default' => 'log',
            'mail.mailers.smtp.host' => 'smtp.platform.test',
        ]);

        $tenant = $this->provisionTenant('Off Co', 'off-co', 'owner@off.test');

        $tenant->run(function (): void {
            MailConfig::query()->updateOrCreate([], [
                'is_enabled' => false,
                'host' => 'smtp.off.test',
                'port' => 587,
                'encryption' => 'tls',
                'username' => 'off-user',
                'password' => 'off-pass',
            ]);
        });

        tenancy()->initialize($tenant);

        $this->assertSame('log', Config::get('mail.default'));
        $this->assertSame('smtp.platform.test', Config::get('mail.mailers.smtp.host'));

        tenancy()->end();
    }
}
