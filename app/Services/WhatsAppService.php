<?php

namespace App\Services;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected string $baseUrl;
    protected string $apiKey;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.seruwit_wa.base_url', 'http://127.0.0.1:8080'), '/');
        $this->apiKey  = config('services.seruwit_wa.api_key', '');
    }

    /**
     * Helper for HTTP client with API key header
     */
    protected function client()
    {
        return Http::withHeaders([
            'X-API-Key' => $this->apiKey,
            'Accept'    => 'application/json',
        ])->timeout(15);
    }

    /**
     * Start pairing session and retrieve QR code
     */
    public function startSession(string $sessionId): array
    {
        $response = $this->client()->post("{$this->baseUrl}/api/sessions/start", [
            'session_id' => $sessionId,
        ]);

        return $this->formatResponse($response);
    }

    /**
     * Pair session using 8-digit phone pairing code
     */
    public function pairWithCode(string $sessionId, string $phone): array
    {
        $response = $this->client()->post("{$this->baseUrl}/api/sessions/pair-code", [
            'session_id' => $sessionId,
            'phone'      => $phone,
        ]);

        return $this->formatResponse($response);
    }

    /**
     * Get session status (CONNECTED, SCAN_QR, DISCONNECTED)
     */
    public function getStatus(string $sessionId): array
    {
        $response = $this->client()->get("{$this->baseUrl}/api/sessions/{$sessionId}/status");

        return $this->formatResponse($response);
    }

    /**
     * Logout and remove session
     */
    public function logout(string $sessionId): array
    {
        $response = $this->client()->post("{$this->baseUrl}/api/sessions/{$sessionId}/logout");

        return $this->formatResponse($response);
    }

    /**
     * Send text notification message
     */
    public function sendText(string $sessionId, string $to, string $message): array
    {
        $response = $this->client()->post("{$this->baseUrl}/api/messages/send-text", [
            'session_id' => $sessionId,
            'to'         => $to,
            'message'    => $message,
        ]);

        return $this->formatResponse($response);
    }

    protected function formatResponse(Response $response): array
    {
        if ($response->successful()) {
            return $response->json();
        }

        Log::error('WhatsApp Gateway request failed', [
            'status' => $response->status(),
            'body'   => $response->body(),
        ]);

        return [
            'success' => false,
            'error'   => $response->json('error') ?? 'WhatsApp Gateway service error',
        ];
    }
}
