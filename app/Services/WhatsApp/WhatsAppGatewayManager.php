<?php

namespace App\Services\WhatsApp;

use App\Contracts\WhatsAppGatewayInterface;
use App\Models\PlatformSetting;
use App\Models\Setting;
use Illuminate\Support\Str;

class WhatsAppGatewayManager
{
    /**
     * Check whether execution is currently inside an initialized tenant context.
     */
    public function isTenantContext(): bool
    {
        return function_exists('tenant') && tenant('id') !== null;
    }

    /**
     * Retrieve active session ID based on current context (tenant vs central).
     */
    public function getSessionId(): string
    {
        if ($this->isTenantContext()) {
            return 'tenant_'.tenant('id');
        }

        return (string) PlatformSetting::getValue('whatsapp.session_id', 'central_platform');
    }

    /**
     * Get gateway instance configured for Central Platform domain.
     */
    public function forCentral(bool $forceRealDriver = false): WhatsAppGatewayInterface
    {
        $isEnabled = filter_var(PlatformSetting::getValue('whatsapp.is_enabled', false), FILTER_VALIDATE_BOOLEAN);

        if (! $isEnabled && ! $forceRealDriver) {
            return new LogWhatsAppGateway;
        }

        $sessionId = (string) PlatformSetting::getValue('whatsapp.session_id', 'central_platform');
        $provider = (string) PlatformSetting::getValue('whatsapp.provider', 'seruwit');
        $customUrl = (string) PlatformSetting::getValue('whatsapp.custom_url', '');
        $fonnteToken = (string) PlatformSetting::getValue('whatsapp.fonnte_token', '');
        $customToken = (string) PlatformSetting::getValue('whatsapp.custom_token', '');

        if ($provider === 'custom' && blank($customUrl)) {
            $provider = 'seruwit';
        } elseif ($provider === 'fonnte' && blank($fonnteToken)) {
            $provider = 'seruwit';
        }

        return match ($provider) {
            'seruwit' => new SeruwitWhatsAppGateway(
                service: app(\App\Services\WhatsAppService::class),
                sessionId: $sessionId,
            ),
            'fonnte' => new FonnteGateway(
                token: $fonnteToken,
            ),
            'custom' => new CustomWebhookGateway(
                endpointUrl: $customUrl,
                apiToken: $customToken,
            ),
            default => new SeruwitWhatsAppGateway(
                service: app(\App\Services\WhatsAppService::class),
                sessionId: $sessionId,
            ),
        };
    }

    /**
     * Get gateway instance configured for a specific Tenant.
     */
    public function forTenant(?string $tenantId = null, bool $forceRealDriver = false): WhatsAppGatewayInterface
    {
        $isEnabled = filter_var(Setting::getValue('whatsapp.is_enabled', false), FILTER_VALIDATE_BOOLEAN);

        if (! $isEnabled && ! $forceRealDriver) {
            return new LogWhatsAppGateway;
        }

        $effectiveTenantId = $tenantId ?? (function_exists('tenant') && tenant('id') ? tenant('id') : 'default');
        $sessionId = 'tenant_'.$effectiveTenantId;
        $provider = (string) Setting::getValue('whatsapp.provider', 'seruwit');
        $customUrl = (string) Setting::getValue('whatsapp.custom_url', '');
        $fonnteToken = (string) Setting::getValue('whatsapp.fonnte_token', '');
        $customToken = (string) Setting::getValue('whatsapp.custom_token', '');

        if ($provider === 'custom' && blank($customUrl)) {
            $provider = 'seruwit';
        } elseif ($provider === 'fonnte' && blank($fonnteToken)) {
            $provider = 'seruwit';
        }

        return match ($provider) {
            'seruwit' => new SeruwitWhatsAppGateway(
                service: app(\App\Services\WhatsAppService::class),
                sessionId: $sessionId,
            ),
            'fonnte' => new FonnteGateway(
                token: $fonnteToken,
            ),
            'custom' => new CustomWebhookGateway(
                endpointUrl: $customUrl,
                apiToken: $customToken,
            ),
            default => new SeruwitWhatsAppGateway(
                service: app(\App\Services\WhatsAppService::class),
                sessionId: $sessionId,
            ),
        };
    }

    /**
     * Resolve default gateway driver for current context.
     */
    public function driver(bool $forceRealDriver = false): WhatsAppGatewayInterface
    {
        if ($this->isTenantContext()) {
            return $this->forTenant(tenant('id'), $forceRealDriver);
        }

        return $this->forCentral($forceRealDriver);
    }

    /**
     * Get the device connection status from the real configured gateway driver.
     *
     * @return array{connected: bool, status: string, message?: string, phone?: string, push_name?: string, qr_base64?: string}
     */
    public function getDeviceStatus(): array
    {
        return $this->driver(forceRealDriver: true)->getDeviceStatus();
    }

    /**
     * Normalize an Indonesian phone number to international format without + (e.g. 628123456789).
     */
    public static function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        if (Str::startsWith($digits, '0')) {
            $digits = '62'.substr($digits, 1);
        } elseif (Str::startsWith($digits, '8')) {
            $digits = '62'.$digits;
        }

        return $digits;
    }
}
