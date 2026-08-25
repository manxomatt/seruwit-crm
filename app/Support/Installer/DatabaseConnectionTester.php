<?php

namespace App\Support\Installer;

use PDO;
use Throwable;

/**
 * Verifies database credentials with a throwaway PDO connection before they are
 * written to .env — so a typo is caught at the Database step instead of blowing
 * up mid-migration. Deliberately independent of the app's configured connection.
 */
class DatabaseConnectionTester
{
    /**
     * @param  array{driver: string, host?: ?string, port?: ?int|string, database?: ?string, username?: ?string, password?: ?string}  $config
     * @return array{ok: bool, message: string}
     */
    public function test(array $config): array
    {
        try {
            $driver = $config['driver'] ?? '';

            if ($driver === 'sqlite') {
                return $this->testSqlite((string) ($config['database'] ?? ''));
            }

            new PDO(
                $this->dsn($config),
                $config['username'] ?? null,
                $config['password'] ?? null,
                [PDO::ATTR_TIMEOUT => 5, PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION],
            );

            return ['ok' => true, 'message' => 'Connection successful.'];
        } catch (Throwable $e) {
            return ['ok' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * @param  array{driver: string, host?: ?string, port?: ?int|string, database?: ?string}  $config
     */
    private function dsn(array $config): string
    {
        $driver = $config['driver'];
        $host = $config['host'] ?? '127.0.0.1';
        $port = $config['port'] ?? ($driver === 'pgsql' ? 5432 : 3306);
        $database = $config['database'] ?? '';

        return "{$driver}:host={$host};port={$port};dbname={$database}";
    }

    /**
     * @return array{ok: bool, message: string}
     */
    private function testSqlite(string $database): array
    {
        if ($database === ':memory:') {
            return ['ok' => true, 'message' => 'Connection successful.'];
        }

        $directory = dirname($database);

        if ((is_file($database) && is_writable($database)) || (is_dir($directory) && is_writable($directory))) {
            return ['ok' => true, 'message' => 'SQLite path is writable.'];
        }

        return ['ok' => false, 'message' => "SQLite path is not writable: {$database}"];
    }
}
