<?php

namespace Tests\Feature\Install;

use App\Support\Installer\InstallToken;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * The Inertia wizard shell and its optional token gate. DB-free: the wizard render
 * is served through the lean installer Inertia middleware, and the token gate
 * short-circuits before any controller touches the database.
 */
class InstallWizardTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config(['app.installed' => false]);
        InstallToken::forget();
    }

    protected function tearDown(): void
    {
        InstallToken::forget();

        parent::tearDown();
    }

    public function test_wizard_renders_with_requirements_and_defaults(): void
    {
        $this->get('/install')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Install/Wizard')
                ->has('requirements')
                ->where('tokenRequired', false)
                ->has('defaults.app_name'));
    }

    public function test_a_configured_token_locks_mutations_until_unlocked(): void
    {
        $token = InstallToken::generate();

        // Locked: mutating a step without unlocking is forbidden.
        $this->post('/install/database', [
            'driver' => 'pgsql', 'host' => '127.0.0.1', 'port' => 5432, 'database' => 'x',
        ])->assertForbidden();

        // A wrong token does not unlock.
        $this->post('/install/unlock', ['token' => 'nope'])->assertSessionHasErrors('token');

        // The correct token unlocks the session.
        $this->post('/install/unlock', ['token' => $token])
            ->assertRedirect(route('install.index'))
            ->assertSessionHas('installer_unlocked', true);
    }
}
