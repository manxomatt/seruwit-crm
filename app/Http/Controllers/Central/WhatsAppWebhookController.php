<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;

class WhatsAppWebhookController extends Controller
{
    /**
     * Handle incoming webhooks from Seruwit WA Gateway
     */
    public function handle(Request $request): JsonResponse
    {
        // 1. Validate Webhook Secret (Security check)
        $expectedSecret = config('services.seruwit_wa.webhook_secret');
        if ($expectedSecret && $request->header('X-Webhook-Secret') !== $expectedSecret) {
            Log::warning('WhatsApp webhook unauthorized: invalid secret', [
                'ip' => $request->ip(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Unauthorized',
            ], 401);
        }

        $event = $request->input('event');
        $sessionId = $request->input('session_id');
        $timestamp = $request->input('timestamp');
        $data = $request->input('data', []);

        Log::info("WhatsApp webhook received: {$event}", [
            'session_id' => $sessionId,
            'timestamp' => $timestamp,
            'data' => $data,
        ]);

        // 2. Handle specific events
        switch ($event) {
            case 'session.status':
                $this->handleSessionStatus($sessionId, $data);
                break;

            case 'session.qr':
                $this->handleSessionQR($sessionId, $data);
                break;

            case 'message.receipt':
                $this->handleMessageReceipt($sessionId, $data);
                break;

            case 'message.incoming':
                $this->handleMessageIncoming($sessionId, $data);
                break;

            default:
                Log::debug("Unhandled WhatsApp webhook event: {$event}");
                break;
        }

        return response()->json([
            'success' => true,
            'message' => 'Webhook processed successfully',
        ]);
    }

    /**
     * Handle session status changes (CONNECTED, DISCONNECTED, LOGGED_OUT)
     */
    protected function handleSessionStatus(string $sessionId, array $data): void
    {
        $status = $data['status'] ?? 'UNKNOWN';
        $phone = $data['phone'] ?? null;
        $pushName = $data['push_name'] ?? null;

        Log::info("WhatsApp session {$sessionId} status changed to {$status}", [
            'phone' => $phone,
            'push_name' => $pushName,
        ]);

        // Dispatch an event so modules/tenants can react to connection updates
        // event(new \App\Events\WhatsAppSessionStatusUpdated($sessionId, $status, $phone, $pushName));
    }

    /**
     * Handle updated QR code for pairing
     */
    protected function handleSessionQR(string $sessionId, array $data): void
    {
        $qrBase64 = $data['qr_base64'] ?? '';

        Log::debug("WhatsApp session {$sessionId} received new QR code");

        // Broadcast QR update to frontend if using Laravel Reverb / Pusher
        // broadcast(new \App\Events\WhatsAppQRCodeUpdated($sessionId, $qrBase64));
    }

    /**
     * Handle message delivery receipts (delivered, read)
     */
    protected function handleMessageReceipt(string $sessionId, array $data): void
    {
        $messageIds = $data['message_ids'] ?? [];
        $receipt = $data['receipt'] ?? 'delivered';

        Log::info("WhatsApp messages receipt updated to {$receipt}", [
            'session_id' => $sessionId,
            'message_ids' => $messageIds,
        ]);

        // Update message log status in CRM database
    }

    /**
     * Handle incoming reply from customer
     */
    protected function handleMessageIncoming(string $sessionId, array $data): void
    {
        $messageId = $data['message_id'] ?? null;
        $sender = $data['sender'] ?? null;
        $text = $data['text'] ?? '';
        $pushName = $data['push_name'] ?? null;

        Log::info("WhatsApp incoming message from {$sender} on session {$sessionId}", [
            'message_id' => $messageId,
            'sender' => $sender,
            'push_name' => $pushName,
            'text' => $text,
        ]);

        // Save to chat history or notify assigned sales agent
    }
}
