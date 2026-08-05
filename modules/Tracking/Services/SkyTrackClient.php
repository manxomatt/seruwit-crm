<?php

namespace Modules\Tracking\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Modules\Tracking\Contracts\GpsProvider;
use Modules\Tracking\Exceptions\GpsProviderAuthenticationException;
use Modules\Tracking\Exceptions\GpsProviderUnavailableException;
use Modules\Tracking\Models\GpsSource;

/**
 * Talks to a Sky Track API that authenticates with an X-Api-Key header.
 */
class SkyTrackClient implements GpsProvider
{
    public function __construct(private readonly GpsSource $source) {}

    public function verify(): bool
    {
        $this->objects();

        return true;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listDevices(): array
    {
        return $this->objects();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function objects(): array
    {
        return $this->listJson('/api/objects');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function latestPositions(): array
    {
        return $this->listJson('/api/tracking/objects');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function listJson(string $path): array
    {
        $data = $this->json($this->send($path));

        if ($data === []) {
            return [];
        }

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
            throw new GpsProviderUnavailableException('Could not reach the Sky Track server: '.$e->getMessage(), previous: $e);
        }
    }

    /**
     * @return array<int, array<string, mixed>>|array<string, mixed>
     */
    private function json(Response $response): array
    {
        if ($response->status() === 401 || $response->status() === 403) {
            throw new GpsProviderAuthenticationException('Sky Track rejected the API key for this source.');
        }

        if ($response->failed()) {
            throw new GpsProviderUnavailableException("Sky Track responded with HTTP {$response->status()}.");
        }

        $data = $response->json();

        return is_array($data) ? $data : [];
    }

    private function request(): PendingRequest
    {
        return Http::baseUrl(rtrim((string) $this->source->baseUrl(), '/'))
            ->timeout(30)
            ->connectTimeout(5)
            ->retry(2, 200, fn ($exception) => $exception instanceof ConnectionException, throw: false)
            ->withHeaders([
                'X-Api-Key' => (string) $this->source->token,
            ])
            ->acceptJson();
    }
}
