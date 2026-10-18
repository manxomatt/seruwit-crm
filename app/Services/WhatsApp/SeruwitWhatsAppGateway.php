<?php

namespace App\Services\WhatsApp;

use App\Contracts\WhatsAppGatewayInterface;
use App\Services\WhatsAppService;
use Illuminate\Support\Facades\Log;
use Throwable;

class SeruwitWhatsAppGateway implements WhatsAppGatewayInterface
{
    public function __construct(
        protected WhatsAppService $service,
        protected ?string $sessionId = null,
    ) {
        if (! $this->sessionId && function_exists('tenant') && tenant('id')) {
            $this->sessionId = 'tenant_' . tenant('id');
        }
    }

    /**
     * Send plain text message
     */
    public function sendMessage(string $targetPhone, string $message): bool
    {
        if (blank($this->sessionId)) {
            Log::warning('[SeruwitWhatsAppGateway] Tenant session ID is missing.');
            return false;
        }

        try {
            $normalizedPhone = WhatsAppGatewayManager::normalizePhone($targetPhone);
            $result = $this->service->sendText($this->sessionId, $normalizedPhone, $message);

            if (($result['success'] ?? false) === true) {
                return true;
            }

            Log::error('[SeruwitWhatsAppGateway] Failed to dispatch message', [
                'session_id' => $this->sessionId,
                'target'     => $normalizedPhone,
                'result'     => $result,
            ]);

            return false;
        } catch (Throwable $e) {
            Log::error('[SeruwitWhatsAppGateway] Exception during send', [
                'error'  => $e->getMessage(),
                'target' => $targetPhone,
            ]);

            return false;
        }
    }

    /**
     * Send message with media attachment (or text fallback)
     */
    public function sendMedia(string $targetPhone, string $caption, string $mediaUrl, ?string $fileName = null): bool
    {
        $text = $caption ? "{$caption}\n\n{$mediaUrl}" : $mediaUrl;
        return $this->sendMessage($targetPhone, $text);
    }

    /**
     * Check device connection status from Seruwit WA Gateway
     *
     * @return array{connected: bool, status: string, message?: string, phone?: string, push_name?: string, qr_base64?: string}
     */
    public function getDeviceStatus(): array
    {
        if (blank($this->sessionId)) {
            return [
                'connected' => false,
                'status'    => 'DISCONNECTED',
                'message'   => 'Sesi tenant tidak ditemukan.',
            ];
        }

        try {
            $res = $this->service->getStatus($this->sessionId);

            if (($res['success'] ?? false) === true) {
                $status    = $res['status'] ?? 'DISCONNECTED';
                $connected = ($status === 'CONNECTED');
                $phone     = $res['phone'] ?? '';
                $pushName  = $res['push_name'] ?? '';

                $msg = $connected
                    ? ($pushName ? "Terhubung ke {$phone} ({$pushName})" : "Terhubung ke {$phone}")
                    : 'WhatsApp belum terhubung. Silakan scan QR code.';

                return [
                    'connected' => $connected,
                    'status'    => $status,
                    'phone'     => $phone,
                    'push_name' => $pushName,
                    'message'   => $msg,
                    'qr_base64' => $res['qr_base64'] ?? '',
                ];
            }

            return [
                'connected' => false,
                'status'    => 'DISCONNECTED',
                'message'   => $res['error'] ?? 'WhatsApp Gateway belum terhubung.',
            ];
        } catch (Throwable $e) {
            return [
                'connected' => false,
                'status'    => 'ERROR',
                'message'   => 'Gagal menghubungi server Seruwit WA Gateway.',
            ];
        }
    }
}
