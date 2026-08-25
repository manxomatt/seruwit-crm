<?php

namespace App\Support\Installer;

use Illuminate\Support\Facades\File;

/**
 * Preflight for the first-run installer: the environment facts an operator must
 * fix before installation can proceed (PHP version, extensions, writable paths,
 * app key). Pure and DB-free — it never touches the database, which by design may
 * not exist yet.
 */
class RequirementsChecker
{
    public const MIN_PHP = '8.4.0';

    /**
     * @var list<string>
     */
    public const REQUIRED_EXTENSIONS = [
        'pdo',
        'mbstring',
        'openssl',
        'tokenizer',
        'ctype',
        'json',
        'curl',
        'fileinfo',
    ];

    /**
     * @var list<string>
     */
    public const DATABASE_DRIVERS = ['pdo_pgsql', 'pdo_mysql', 'pdo_sqlite'];

    /**
     * @return list<array{name: string, passed: bool, hint: string}>
     */
    public function checks(): array
    {
        $checks = [];

        $checks[] = [
            'name' => 'PHP >= '.self::MIN_PHP,
            'passed' => version_compare(PHP_VERSION, self::MIN_PHP, '>='),
            'hint' => 'Current: '.PHP_VERSION,
        ];

        foreach (self::REQUIRED_EXTENSIONS as $extension) {
            $checks[] = [
                'name' => "Extension: {$extension}",
                'passed' => extension_loaded($extension),
                'hint' => 'PHP extension',
            ];
        }

        $checks[] = [
            'name' => 'A PDO database driver',
            'passed' => $this->hasAnyDatabaseDriver(),
            'hint' => 'One of: '.implode(', ', self::DATABASE_DRIVERS),
        ];

        $checks[] = [
            'name' => 'Application key set',
            'passed' => filled(config('app.key')),
            'hint' => 'Run php artisan key:generate',
        ];

        foreach ($this->writablePaths() as $label => $path) {
            $checks[] = [
                'name' => "Writable: {$label}",
                'passed' => $this->isWritable($path),
                'hint' => $path,
            ];
        }

        return $checks;
    }

    public function passes(): bool
    {
        foreach ($this->checks() as $check) {
            if (! $check['passed']) {
                return false;
            }
        }

        return true;
    }

    private function hasAnyDatabaseDriver(): bool
    {
        foreach (self::DATABASE_DRIVERS as $driver) {
            if (extension_loaded($driver)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return array<string, string>
     */
    private function writablePaths(): array
    {
        return [
            'storage/framework' => storage_path('framework'),
            'storage/logs' => storage_path('logs'),
            'bootstrap/cache' => base_path('bootstrap/cache'),
            '.env' => base_path('.env'),
        ];
    }

    /**
     * A missing .env is fine as long as its directory is writable, so the
     * installer can create it; anything else must already exist and be writable.
     */
    private function isWritable(string $path): bool
    {
        if (File::exists($path)) {
            return is_writable($path);
        }

        return is_writable(dirname($path));
    }
}
