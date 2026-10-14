<?php

namespace App\Services\WhatsApp;

use App\Contracts\WhatsAppGatewayInterface;
use Illuminate\Support\Facades\Log;

class LogWhatsAppGateway implements WhatsAppGatewayInterface
{
    public function sendMessage(string $targetPhone, string $message): bool
    {
        Log::info('[WhatsApp Log] Message dispatched', [
            'to' => $targetPhone,
            'message' => $message,
        ]);

        return true;
    }

    public function sendMedia(string $targetPhone, string $caption, string $mediaUrl, ?string $fileName = null): bool
    {
        Log::info('[WhatsApp Log] Media dispatched', [
            'to' => $targetPhone,
            'caption' => $caption,
            'media_url' => $mediaUrl,
            'file_name' => $fileName,
        ]);

        return true;
    }

    public function getDeviceStatus(): array
    {
        return [
            'connected' => true,
            'status' => 'log_driver_active',
            'message' => 'Log driver active (messages written to application logs).',
        ];
    }
}
