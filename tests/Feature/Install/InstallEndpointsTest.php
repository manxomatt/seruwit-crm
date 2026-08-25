<?php

namespace Tests\Feature\Install;

use Tests\TestCase;

/**
 * Exercises the installer step endpoints through the lean "install" middleware
 * group. No RefreshDatabase: these endpoints are DB-free (requirements are pure,
 * the database checks connect via a throwaway PDO, and invalid input is rejected
 * before any write). The gate is opened per-test via the app.installed override.
 */
class InstallEndpointsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config(['app.installed' => false]);
    }

    public function test_requirements_endpoint_returns_checks(): void
    {
        $this->getJson('/install/requirements')
            ->assertOk()
            ->assertJsonStructure(['checks', 'passes']);
    }

    public function test_database_test_endpoint_reports_success_for_valid_credentials(): void
    {
        $connection = config('database.connections.pgsql');

        $this->postJson('/install/database/test', [
            'driver' => 'pgsql',
            'host' => $connection['host'],
            'port' => $connection['port'],
            'database' => $connection['database'],
            'username' => $connection['username'],
            'password' => $connection['password'],
        ])->assertOk()->assertJson(['ok' => true]);
    }

    public function test_database_test_endpoint_reports_failure_for_bad_credentials(): void
    {
        $this->postJson('/install/database/test', [
            'driver' => 'pgsql',
            'host' => '127.0.0.1',
            'port' => 1,
            'database' => 'does_not_exist',
            'username' => 'nobody',
            'password' => 'wrong',
        ])->assertOk()->assertJson(['ok' => false]);
    }

    public function test_database_store_rejects_invalid_input(): void
    {
        $this->post('/install/database', [])->assertSessionHasErrors(['driver', 'database']);
    }
}
