<?php

namespace App\Support;

use App\Models\MailConfig;
use App\Models\Setting;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Schema;
use Stancl\Tenancy\Contracts\TenancyBootstrapper;
use Stancl\Tenancy\Contracts\Tenant;

/**
 * Switches Laravel's mailer to the tenant's SMTP credentials (when configured)
 * and applies the tenant's email.from_* branding from Settings.
 *
 * Falls back to the central .env mailer when SMTP is disabled or incomplete.
 */
class TenantMailConfigBootstrapper implements TenancyBootstrapper
{
    /** @var array<string, mixed>|null */
    protected ?array $original = null;

    public function bootstrap(Tenant $tenant): void
    {
        $this->original ??= $this->captureMailConfig();

        $this->applyUsingOriginal();
    }

    public function revert(): void
    {
        if ($this->original === null) {
            return;
        }

        Config::set($this->original);
        $this->original = null;
    }

    /**
     * Re-read DB credentials and apply them on top of the captured central
     * mail config (used after the tenant saves SMTP settings mid-request).
     */
    public function refresh(): void
    {
        if ($this->original === null) {
            $this->original = $this->captureMailConfig();
        } else {
            Config::set($this->original);
        }

        $this->applyUsingOriginal();
    }

    /**
     * @return array<string, mixed>
     */
    protected function captureMailConfig(): array
    {
        return [
            'mail.default' => Config::get('mail.default'),
            'mail.mailers.smtp' => Config::get('mail.mailers.smtp'),
            'mail.from' => Config::get('mail.from'),
            'mail.reply_to' => Config::get('mail.reply_to'),
        ];
    }

    protected function applyUsingOriginal(): void
    {
        $this->applyFromSettings();
        $this->applySmtpIfConfigured();
    }

    protected function applyFromSettings(): void
    {
        if (! Schema::hasTable('settings')) {
            return;
        }

        $fromAddress = Setting::getValue('email.from_address');
        $fromName = Setting::getValue('email.from_name');
        $replyTo = Setting::getValue('email.reply_to');

        if (filled($fromAddress)) {
            Config::set('mail.from.address', $fromAddress);
        }

        if (filled($fromName)) {
            Config::set('mail.from.name', $fromName);
        }

        if (filled($replyTo)) {
            Config::set('mail.reply_to.address', $replyTo);
            Config::set('mail.reply_to.name', $fromName ?: Config::get('mail.from.name'));
        }
    }

    protected function applySmtpIfConfigured(): void
    {
        if (! MailConfig::tableReady()) {
            return;
        }

        $config = MailConfig::query()->first();

        if ($config === null || ! $config->isConfigured()) {
            return;
        }

        $encryption = filled($config->encryption) ? $config->encryption : null;

        Config::set([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.transport' => 'smtp',
            'mail.mailers.smtp.host' => $config->host,
            'mail.mailers.smtp.port' => $config->port,
            'mail.mailers.smtp.encryption' => $encryption,
            'mail.mailers.smtp.username' => $config->username,
            'mail.mailers.smtp.password' => $config->password,
            'mail.mailers.smtp.timeout' => null,
            'mail.mailers.smtp.local_domain' => Config::get('mail.mailers.smtp.local_domain'),
        ]);
    }
}
