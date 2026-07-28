<?php

namespace Modules\Tracking\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Modules\Tracking\Exceptions\TraccarAuthenticationException;
use Modules\Tracking\Exceptions\TraccarUnavailableException;
use Modules\Tracking\Models\TrackingConfig;

/**
 * Talks to a Sky Track API that authenticates with an X-Api-Key header.
 */
class SkyTrackClient
{
    public function __construct(private readonly TrackingConfig $config) {}

    /**
     * Prove the API key works by listing objects (same endpoint used for sync).
     */
    public function verify(): bool
    {
        $this->objects();

        return true;
    }

    /**
     * Fetch every tracked object (IMEI, name, active flag, …).
     *
     * @return array<int, array<string, mixed>>
     */
    public function objects(): array
    {
        $data = $this->json($this->send('/api/objects'));

        if ($data === []) {
            return [];
        }

        // List endpoint returns a JSON array; reject unexpected object envelopes.
        if (array_is_list($data)) {
            /** @var array<int, array<string, mixed>> $data */
            return $data;
        }

        return [];
    }

    private function send(string $path): Response
    {
        try {
            return $this->request()->get($path);
        } catch (ConnectionException $e) {
            throw new TraccarUnavailableException('Could not reach the Sky Track server: '.$e->getMessage(), previous: $e);
        }
    }

    /**
     * @return array<int, array<string, mixed>>|array<string, mixed>
     */
    private function json(Response $response): array
    {
        if ($response->status() === 401 || $response->status() === 403) {
            throw new TraccarAuthenticationException('Sky Track rejected the API key for this tenant.');
        }

        if ($response->failed()) {
            throw new TraccarUnavailableException("Sky Track responded with HTTP {$response->status()}.");
        }

        $data = $response->json();

        return is_array($data) ? $data : [];
    }

    private function request(): PendingRequest
    {
        return Http::baseUrl(rtrim((string) $this->config->baseUrl(), '/'))
            ->timeout(30)
            ->connectTimeout(5)
            ->retry(2, 200, fn ($exception) => $exception instanceof ConnectionException, throw: false)
            ->withHeaders([
                'X-Api-Key' => (string) $this->config->token,
            ])
            ->acceptJson();
    }
}
