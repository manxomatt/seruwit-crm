<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CloudflareCustomHostnameService
{
    private ?string $apiToken;

    private ?string $zoneId;

    public function __construct()
    {
        $this->apiToken = config('services.cloudflare.api_token');
        $this->zoneId = config('services.cloudflare.zone_id');
    }

    /**
     * Check if Cloudflare for SaaS credentials are configured.
     */
    public function isConfigured(): bool
    {
        return ! empty($this->apiToken) && ! empty($this->zoneId);
    }

    /**
     * Create a custom hostname in Cloudflare for SaaS.
     *
     * @return array{id: string, hostname: string, status: string, ssl_status: string}|null
     */
    public function createCustomHostname(string $hostname): ?array
    {
        if (! $this->isConfigured()) {
            Log::info("Cloudflare for SaaS is not configured. Simulating custom hostname creation for: {$hostname}");

            return [
                'id' => 'sim_'.md5($hostname),
                'hostname' => $hostname,
                'status' => 'active',
                'ssl_status' => 'active',
            ];
        }

        try {
            $response = Http::withToken((string) $this->apiToken)
                ->timeout(15)
                ->post("https://api.cloudflare.com/client/v4/zones/{$this->zoneId}/custom_hostnames", [
                    'hostname' => $hostname,
                    'ssl' => [
                        'method' => 'http',
                        'type' => 'dv',
                        'settings' => [
                            'min_tls_version' => '1.2',
                        ],
                    ],
                ]);

            if ($response->successful()) {
                $result = $response->json('result', []);

                return [
                    'id' => (string) ($result['id'] ?? ''),
                    'hostname' => (string) ($result['hostname'] ?? $hostname),
                    'status' => (string) ($result['status'] ?? 'pending'),
                    'ssl_status' => (string) ($result['ssl']['status'] ?? 'pending_validation'),
                ];
            }

            Log::error('Cloudflare Custom Hostname creation failed', [
                'hostname' => $hostname,
                'status' => $response->status(),
                'body' => $response->json(),
            ]);

            return null;
        } catch (\Throwable $e) {
            Log::error('Cloudflare Custom Hostname exception', [
                'hostname' => $hostname,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Get details / status of a custom hostname from Cloudflare.
     *
     * @return array{id: string, hostname: string, status: string, ssl_status: string}|null
     */
    public function getCustomHostname(string $hostnameId): ?array
    {
        if (! $this->isConfigured()) {
            return [
                'id' => $hostnameId,
                'hostname' => 'simulated.domain',
                'status' => 'active',
                'ssl_status' => 'active',
            ];
        }

        try {
            $response = Http::withToken((string) $this->apiToken)
                ->timeout(10)
                ->get("https://api.cloudflare.com/client/v4/zones/{$this->zoneId}/custom_hostnames/{$hostnameId}");

            if ($response->successful()) {
                $result = $response->json('result', []);

                return [
                    'id' => (string) ($result['id'] ?? $hostnameId),
                    'hostname' => (string) ($result['hostname'] ?? ''),
                    'status' => (string) ($result['status'] ?? 'pending'),
                    'ssl_status' => (string) ($result['ssl']['status'] ?? 'pending'),
                ];
            }

            return null;
        } catch (\Throwable $e) {
            Log::error('Cloudflare Get Custom Hostname exception', [
                'id' => $hostnameId,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Delete a custom hostname from Cloudflare.
     */
    public function deleteCustomHostname(string $hostnameId): bool
    {
        if (! $this->isConfigured()) {
            return true;
        }

        try {
            $response = Http::withToken((string) $this->apiToken)
                ->timeout(10)
                ->delete("https://api.cloudflare.com/client/v4/zones/{$this->zoneId}/custom_hostnames/{$hostnameId}");

            return $response->successful();
        } catch (\Throwable $e) {
            Log::error('Cloudflare Delete Custom Hostname exception', [
                'id' => $hostnameId,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
