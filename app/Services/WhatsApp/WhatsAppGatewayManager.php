<?php

namespace App\Services\WhatsApp;

use App\Contracts\WhatsAppGatewayInterface;
use App\Models\Setting;
use Illuminate\Support\Str;

class WhatsAppGatewayManager
{
    public function driver(): WhatsAppGatewayInterface
    {
        $isEnabled = filter_var(Setting::getValue('whatsapp.is_enabled', false), FILTER_VALIDATE_BOOLEAN);

        if (! $isEnabled) {
            return new LogWhatsAppGateway;
        }

        $provider = (string) Setting::getValue('whatsapp.provider', 'fonnte');

        return match ($provider) {
            'fonnte' => new FonnteGateway(
                token: (string) Setting::getValue('whatsapp.fonnte_token', ''),
            ),
            'custom' => new CustomWebhookGateway(
                endpointUrl: (string) Setting::getValue('whatsapp.custom_url', ''),
                apiToken: (string) Setting::getValue('whatsapp.custom_token', ''),
            ),
            default => new LogWhatsAppGateway,
        };
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
