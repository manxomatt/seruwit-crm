<?php

namespace App\Services\WhatsApp;

use App\Contracts\WhatsAppGatewayInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class CustomWebhookGateway implements WhatsAppGatewayInterface
{
    public function __construct(
        protected ?string $endpointUrl = null,
        protected ?string $apiToken = null,
    ) {}

    public function sendMessage(string $targetPhone, string $message): bool
    {
        if (blank($this->endpointUrl)) {
            Log::warning('[CustomWebhookGateway] Endpoint URL is not configured.', [
                'to' => $targetPhone,
            ]);

            return false;
        }

        try {
            $req = Http::timeout(15);
            if (filled($this->apiToken)) {
                $req->withToken($this->apiToken);
            }

            $response = $req->post($this->endpointUrl, [
                'phone' => $targetPhone,
                'target' => $targetPhone,
                'message' => $message,
            ]);

            return $response->successful();
        } catch (Throwable $e) {
            Log::error('[CustomWebhookGateway] Error sending message', [
                'error' => $e->getMessage(),
                'to' => $targetPhone,
            ]);

            return false;
        }
    }

    public function sendMedia(string $targetPhone, string $caption, string $mediaUrl, ?string $fileName = null): bool
    {
        if (blank($this->endpointUrl)) {
            return false;
        }

        try {
            $req = Http::timeout(20);
            if (filled($this->apiToken)) {
                $req->withToken($this->apiToken);
            }

            $response = $req->post($this->endpointUrl, [
                'phone' => $targetPhone,
                'target' => $targetPhone,
                'message' => $caption,
                'media_url' => $mediaUrl,
                'url' => $mediaUrl,
                'file_name' => $fileName,
            ]);

            return $response->successful();
        } catch (Throwable $e) {
            Log::error('[CustomWebhookGateway] Error sending media', [
                'error' => $e->getMessage(),
                'to' => $targetPhone,
            ]);

            return false;
        }
    }

    public function getDeviceStatus(): array
    {
        if (blank($this->endpointUrl)) {
            return [
                'connected' => false,
                'status' => 'missing_endpoint',
                'message' => 'Custom Gateway endpoint URL belum diisi.',
            ];
        }

        return [
            'connected' => true,
            'status' => 'configured',
            'message' => 'Custom Gateway endpoint terkonfigurasi pada: '.$this->endpointUrl,
        ];
    }
}
