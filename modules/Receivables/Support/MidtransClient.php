<?php

namespace Modules\Receivables\Support;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Modules\Receivables\Models\PaymentGatewayConfig;
use RuntimeException;

class MidtransClient
{
    public function __construct(private readonly PaymentGatewayConfig $config) {}

    /**
     * @param  array<string, mixed>  $payload
     * @return array{token: string, redirect_url: string}
     */
    public function createSnapTransaction(array $payload): array
    {
        if (! $this->config->isConfigured()) {
            throw new RuntimeException(__('receivables.gateway.not_configured'));
        }

        try {
            $response = Http::withBasicAuth((string) $this->config->server_key, '')
                ->acceptJson()
                ->asJson()
                ->timeout(20)
                ->post($this->config->snapBaseUrl().'/snap/v1/transactions', $payload)
                ->throw();
        } catch (ConnectionException $e) {
            throw new RuntimeException(__('receivables.gateway.unreachable'), 0, $e);
        } catch (RequestException $e) {
            $body = $e->response?->json('error_messages')
                ?? $e->response?->json('status_message')
                ?? $e->getMessage();

            $message = is_array($body) ? implode('; ', $body) : (string) $body;

            throw new RuntimeException(__('receivables.gateway.snap_failed', ['message' => $message]), 0, $e);
        }

        /** @var array{token?: string, redirect_url?: string} $data */
        $data = $response->json();

        if (! filled($data['token'] ?? null) || ! filled($data['redirect_url'] ?? null)) {
            throw new RuntimeException(__('receivables.gateway.snap_invalid_response'));
        }

        return [
            'token' => (string) $data['token'],
            'redirect_url' => (string) $data['redirect_url'],
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function signatureIsValid(array $payload): bool
    {
        $orderId = (string) ($payload['order_id'] ?? '');
        $statusCode = (string) ($payload['status_code'] ?? '');
        $grossAmount = (string) ($payload['gross_amount'] ?? '');
        $signature = (string) ($payload['signature_key'] ?? '');

        if ($orderId === '' || $signature === '' || ! filled($this->config->server_key)) {
            return false;
        }

        $expected = hash('sha512', $orderId.$statusCode.$grossAmount.$this->config->server_key);

        return hash_equals($expected, $signature);
    }
}
