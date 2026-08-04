<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Env;
use Illuminate\Support\Facades\DB;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    /**
     * Dedicated PHPUnit database. Never the live app DB.
     *
     * PHPUnit `<env force="true">` can still lose to `.env` because Laravel's
     * Env repository prefers `$_SERVER`, which Dotenv rewrites during bootstrap.
     * That previously let RefreshDatabase wipe seruwit_bs.
     */
    private const TESTING_DATABASE = 'seruwit_crm_testing';

    private const FORBIDDEN_DATABASES = [
        'seruwit_bs',
    ];

    public function createApplication()
    {
        $this->pinTestingDatabaseEnvironment();

        $app = parent::createApplication();

        $this->pinTestingDatabaseEnvironment();
        $this->pinTestingDatabaseConfig($app['config']);
        $this->assertTestingDatabaseIsSafe($app['config']);

        return $app;
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->assertTestingDatabaseIsSafe($this->app['config']);
    }

    private function pinTestingDatabaseEnvironment(): void
    {
        $_ENV['DB_DATABASE'] = self::TESTING_DATABASE;
        $_SERVER['DB_DATABASE'] = self::TESTING_DATABASE;
        putenv('DB_DATABASE='.self::TESTING_DATABASE);

        // Drop any Env repository built before we rewrote $_SERVER.
        Env::enablePutenv();
    }

    /**
     * @param  \Illuminate\Contracts\Config\Repository  $config
     */
    private function pinTestingDatabaseConfig($config): void
    {
        $config->set('database.connections.pgsql.database', self::TESTING_DATABASE);

        if ($config->get('database.default') === 'pgsql') {
            $config->set('tenancy.database.central_connection', 'pgsql');
        }

        DB::purge('pgsql');
    }

    /**
     * @param  \Illuminate\Contracts\Config\Repository  $config
     */
    private function assertTestingDatabaseIsSafe($config): void
    {
        $connection = (string) $config->get('database.default');
        $database = (string) $config->get("database.connections.{$connection}.database");

        if (in_array($database, self::FORBIDDEN_DATABASES, true)) {
            throw new RuntimeException(
                "Refusing to run tests against application database [{$connection}:{$database}].",
            );
        }

        if ($database !== self::TESTING_DATABASE) {
            throw new RuntimeException(
                "Refusing to run tests against unexpected database [{$connection}:{$database}]. Expected ".self::TESTING_DATABASE.'.',
            );
        }
    }
}
