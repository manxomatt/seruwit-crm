<?php

namespace App\Services\WhatsApp;

use App\Contracts\WhatsAppGatewayInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class FonnteGateway implements WhatsAppGatewayInterface
{
    protected string $baseUrl = 'https://api.fonnte.com';

    protected ?string $lastError = null;

    public function __construct(protected ?string $token = null) {}

    public function getLastError(): ?string
    {
        return $this->lastError;
    }

    public function sendMessage(string $targetPhone, string $message): bool
    {
        $this->lastError = null;
        if (blank($this->token)) {
            $this->lastError = 'Token Fonnte belum dikonfigurasi.';
            Log::warning('[FonnteGateway] Token is missing, skipping WhatsApp message dispatch.', [
                'to' => $targetPhone,
            ]);

            return false;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => $this->token,
            ])
                ->timeout(15)
                ->asForm()
                ->post("{$this->baseUrl}/send", [
                    'target' => $targetPhone,
                    'message' => $message,
                ]);

            if ($response->successful()) {
                $body = $response->json();
                if (($body['status'] ?? false) === true) {
                    return true;
                }

                Log::warning('[FonnteGateway] API returned non-success status', [
                    'body' => $body,
                    'to' => $targetPhone,
                ]);

                return false;
            }

            Log::error('[FonnteGateway] HTTP request failed', [
                'status' => $response->status(),
                'body' => $response->body(),
                'to' => $targetPhone,
            ]);

            return false;
        } catch (Throwable $e) {
            Log::error('[FonnteGateway] Exception during send', [
                'error' => $e->getMessage(),
                'to' => $targetPhone,
            ]);

            return false;
        }
    }

    public function sendMedia(string $targetPhone, string $caption, string $mediaUrl, ?string $fileName = null): bool
    {
        if (blank($this->token)) {
            Log::warning('[FonnteGateway] Token is missing, skipping WhatsApp media dispatch.', [
                'to' => $targetPhone,
            ]);

            return false;
        }

        try {
            $payload = [
                'target' => $targetPhone,
                'message' => $caption,
                'url' => $mediaUrl,
            ];

            if ($fileName !== null) {
                $payload['filename'] = $fileName;
            }

            $response = Http::withHeaders([
                'Authorization' => $this->token,
            ])
                ->timeout(20)
                ->asForm()
                ->post("{$this->baseUrl}/send", $payload);

            return $response->successful() && (($response->json('status') ?? false) === true);
        } catch (Throwable $e) {
            Log::error('[FonnteGateway] Exception during sendMedia', [
                'error' => $e->getMessage(),
                'to' => $targetPhone,
            ]);

            return false;
        }
    }

    public function getDeviceStatus(): array
    {
        if (blank($this->token)) {
            return [
                'connected' => false,
                'status' => 'missing_token',
                'message' => 'Token Fonnte belum diisi pada pengaturan.',
            ];
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => $this->token,
            ])
                ->timeout(10)
                ->post("{$this->baseUrl}/device");

            if ($response->successful()) {
                $data = $response->json();
                $deviceStatus = strtolower((string) ($data['device_status'] ?? ''));
                $isConnected = in_array($deviceStatus, ['connect', 'connected', 'ready'], true);

                return [
                    'connected' => $isConnected,
                    'status' => $deviceStatus ?: ($isConnected ? 'connected' : 'disconnected'),
                    'message' => $isConnected
                        ? 'Perangkat WhatsApp terhubung (Nomor: '.($data['device'] ?? '-').')'
                        : 'Perangkat belum terhubung. Silakan scan QR code di dashboard Fonnte.',
                ];
            }

            return [
                'connected' => false,
                'status' => 'error',
                'message' => 'Gagal memeriksa status perangkat (HTTP '.$response->status().').',
            ];
        } catch (Throwable $e) {
            return [
                'connected' => false,
                'status' => 'unreachable',
                'message' => 'Tidak dapat terhubung ke server Fonnte: '.$e->getMessage(),
            ];
        }
    }
}
