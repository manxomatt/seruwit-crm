<?php

namespace App\Console\Commands;

use App\Actions\Install\CentralMigrator;
use App\Actions\Install\CreateCentralAdminAction;
use App\Actions\Install\InstallationFinalizer;
use App\Models\PlatformSetting;
use App\Support\CentralAiSettings;
use App\Support\Installer\DatabaseConnectionTester;
use App\Support\Installer\EnvironmentWriter;
use App\Support\Installer\InstallState;
use App\Support\Installer\RequirementsChecker;
use App\Support\SystemMode;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use RuntimeException;

/**
 * Headless twin of the web installer for deploys and CI. Both drive the same
 * App\Support\Installer and App\Actions\Install layer, so this command stays a
 * thin orchestrator. Interactive by default; --no-interaction reads every value
 * from options. Central only — it never provisions tenants or installs modules.
 */
class AppInstall extends Command
{
    protected $signature = 'app:install
        {--skip-database : Use the currently configured connection instead of prompting and writing DB_*}
        {--db-driver=} {--db-host=} {--db-port=} {--db-database=} {--db-username=} {--db-password=}
        {--app-name=} {--app-url=} {--tenant-base-domain=}
        {--profile= : development|production}
        {--ai-features : Enable AI features platform-wide}
        {--admin-name=} {--admin-email=} {--admin-password=}
        {--optimize : Cache configuration after installing (recommended in production)}
        {--force : Run even if already installed, and past failing requirements}';

    protected $description = 'Install the platform: central schema, platform bootstrap, and the first admin';

    public function handle(): int
    {
        if (InstallState::isInstalled() && ! $this->option('force')) {
            $this->error('The application is already installed. Re-run with --force to reinstall.');

            return self::FAILURE;
        }

        $this->info('Platform installer');
        $this->newLine();

        if (! $this->checkRequirements()) {
            return self::FAILURE;
        }

        if (blank(config('app.key'))) {
            $this->line('Generating application key...');
            Artisan::call('key:generate', ['--force' => true]);
        }

        if (! $this->option('skip-database')) {
            if (! $this->configureDatabase()) {
                return self::FAILURE;
            }
        } else {
            $this->line('Using the currently configured database connection.');
        }

        $this->line('Migrating central schema and bootstrapping platform...');

        try {
            app(CentralMigrator::class)->run();
        } catch (RuntimeException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->info('Central schema ready.');

        $this->configurePlatform();

        if (! $this->createAdmin()) {
            return self::FAILURE;
        }

        app(InstallationFinalizer::class)->finalize(optimize: (bool) $this->option('optimize'));

        $this->newLine();
        $this->info('Installation complete.');

        return self::SUCCESS;
    }

    private function checkRequirements(): bool
    {
        $checker = app(RequirementsChecker::class);

        foreach ($checker->checks() as $check) {
            $mark = $check['passed'] ? '<info>✓</info>' : '<error>✗</error>';
            $this->line("{$mark} {$check['name']}");
        }

        $this->newLine();

        if ($checker->passes() || $this->option('force')) {
            return true;
        }

        if ($this->input->isInteractive()) {
            return $this->confirm('Some requirements failed. Continue anyway?', false);
        }

        $this->error('Requirements not met. Fix them or pass --force.');

        return false;
    }

    private function configureDatabase(): bool
    {
        $driver = (string) $this->optionOrAsk('db-driver', 'Database driver (pgsql/mysql/sqlite)', 'pgsql');

        $config = ['driver' => $driver];

        if ($driver !== 'sqlite') {
            $config['host'] = $this->optionOrAsk('db-host', 'Database host', '127.0.0.1');
            $config['port'] = (int) $this->optionOrAsk('db-port', 'Database port', $driver === 'pgsql' ? '5432' : '3306');
            $config['username'] = $this->optionOrAsk('db-username', 'Database username', 'root');
            $config['password'] = $this->optionOrAsk('db-password', 'Database password', '', secret: true);
        }

        $config['database'] = (string) $this->optionOrAsk('db-database', 'Database name', 'seruwit');

        $result = app(DatabaseConnectionTester::class)->test($config);

        if (! $result['ok']) {
            $this->error('Database connection failed: '.$result['message']);

            return false;
        }

        $this->info('Database connection OK.');

        $payload = ['DB_CONNECTION' => $config['driver'], 'DB_DATABASE' => $config['database']];

        if ($driver !== 'sqlite') {
            $payload += [
                'DB_HOST' => $config['host'],
                'DB_PORT' => $config['port'],
                'DB_USERNAME' => $config['username'],
                'DB_PASSWORD' => $config['password'],
            ];
        }

        app(EnvironmentWriter::class)->write($payload);
        $this->applyDatabaseConfig($config);

        return true;
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function applyDatabaseConfig(array $config): void
    {
        $driver = $config['driver'];

        config(['database.default' => $driver, "database.connections.{$driver}.database" => $config['database']]);

        if ($driver !== 'sqlite') {
            config([
                "database.connections.{$driver}.host" => $config['host'],
                "database.connections.{$driver}.port" => $config['port'],
                "database.connections.{$driver}.username" => $config['username'],
                "database.connections.{$driver}.password" => $config['password'],
            ]);
        }

        DB::purge($driver);
    }

    private function configurePlatform(): void
    {
        $appName = (string) $this->optionOrAsk('app-name', 'Application name', config('app.name'));
        $appUrl = (string) $this->optionOrAsk('app-url', 'Application URL', config('app.url'));
        $tenantBaseDomain = (string) $this->optionOrAsk('tenant-base-domain', 'Tenant base domain (blank = APP_URL host)', '');

        $profile = $this->option('profile')
            ?: ($this->input->isInteractive() ? $this->choice('Deployment profile', ['development', 'production'], 'production') : 'production');

        $isProduction = $profile === 'production';

        app(EnvironmentWriter::class)->write([
            'APP_NAME' => $appName,
            'APP_URL' => $appUrl,
            'TENANT_BASE_DOMAIN' => $tenantBaseDomain,
            'CENTRAL_SERVES_APP' => ! $isProduction,
        ]);

        PlatformSetting::setValue(SystemMode::KEY, $isProduction ? SystemMode::PRODUCTION : SystemMode::DEVELOPMENT);
        PlatformSetting::setValue(CentralAiSettings::KEY, $this->option('ai-features') ? '1' : '0');

        $this->info("Platform profile saved ({$profile}).");
    }

    private function createAdmin(): bool
    {
        $data = [
            'name' => $this->optionOrAsk('admin-name', 'Admin name'),
            'email' => $this->optionOrAsk('admin-email', 'Admin email'),
            'password' => $this->optionOrAsk('admin-password', 'Admin password', secret: true),
        ];

        $validator = Validator::make($data, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return false;
        }

        app(CreateCentralAdminAction::class)->execute($data);
        $this->info("Admin account created: {$data['email']}");

        return true;
    }

    private function optionOrAsk(string $option, string $label, ?string $default = null, bool $secret = false): ?string
    {
        $value = $this->option($option);

        if ($value !== null && $value !== '') {
            return $value;
        }

        if (! $this->input->isInteractive()) {
            return $default;
        }

        return $secret ? $this->secret($label) : $this->ask($label, $default);
    }
}
