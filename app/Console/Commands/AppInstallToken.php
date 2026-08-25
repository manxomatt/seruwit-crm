<?php

namespace App\Console\Commands;

use App\Support\Installer\InstallToken;
use Illuminate\Console\Command;

class AppInstallToken extends Command
{
    protected $signature = 'app:install-token
        {--rotate : Generate a fresh token, replacing the current one}';

    protected $description = 'Show or rotate the first-run installer token';

    public function handle(): int
    {
        if (InstallToken::isFromEnv() && $this->option('rotate')) {
            $this->warn('APP_INSTALL_TOKEN is set in the environment and takes precedence; rotating the file has no effect until it is unset.');
        }

        $token = $this->option('rotate') ? InstallToken::generate() : InstallToken::ensure();

        $this->info('Installer token:');
        $this->line($token);

        if (InstallToken::isFromEnv()) {
            $this->newLine();
            $this->comment('This value comes from APP_INSTALL_TOKEN.');
        }

        return self::SUCCESS;
    }
}
