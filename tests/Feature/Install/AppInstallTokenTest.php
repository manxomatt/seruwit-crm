<?php

namespace Tests\Feature\Install;

use App\Support\Installer\InstallToken;
use Tests\TestCase;

class AppInstallTokenTest extends TestCase
{
    protected function tearDown(): void
    {
        InstallToken::forget();

        parent::tearDown();
    }

    public function test_it_mints_and_persists_a_token(): void
    {
        InstallToken::forget();
        $this->assertNull(InstallToken::current());

        $this->artisan('app:install-token')->assertExitCode(0);

        $this->assertNotNull(InstallToken::current());
    }

    public function test_rotate_replaces_the_token(): void
    {
        $first = InstallToken::generate();

        $this->artisan('app:install-token', ['--rotate' => true])->assertExitCode(0);

        $this->assertNotSame($first, InstallToken::current());
    }
}
