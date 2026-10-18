<?php

namespace App\Services\WhatsApp;

use App\Contracts\WhatsAppGatewayInterface;
use App\Models\Setting;
use Illuminate\Support\Str;

class WhatsAppGatewayManager
{
    public function getSessionId(): string
    {
        return 'tenant_'.(function_exists('tenant') && tenant('id') ? tenant('id') : 'default');
    }

    public function driver(bool $forceRealDriver = false): WhatsAppGatewayInterface
    {
        $isEnabled = filter_var(Setting::getValue('whatsapp.is_enabled', false), FILTER_VALIDATE_BOOLEAN);

        if (! $isEnabled && ! $forceRealDriver) {
            return new LogWhatsAppGateway;
        }

        $sessionId = $this->getSessionId();
        $provider = (string) Setting::getValue('whatsapp.provider', 'seruwit');
        $customUrl = (string) Setting::getValue('whatsapp.custom_url', '');
        $fonnteToken = (string) Setting::getValue('whatsapp.fonnte_token', '');

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
                apiToken: (string) Setting::getValue('whatsapp.custom_token', ''),
            ),
            default => new SeruwitWhatsAppGateway(
                service: app(\App\Services\WhatsAppService::class),
                sessionId: $sessionId,
            ),
        };
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
