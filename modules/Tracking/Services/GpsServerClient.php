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
 * Talks to a GPS-Server (gsi-tracking style) API that authenticates with a
 * `key` query parameter on `/api/api.php`.
 */
class GpsServerClient
{
    public function __construct(private readonly TrackingConfig $config) {}

    /**
     * Prove the API key works by listing objects (same endpoint used for sync
     * and live positions).
     */
    public function verify(): bool
    {
        $this->objects();

        return true;
    }

    /**
     * Fetch every tracked object (IMEI, name, active flag, last fix, …).
     *
     * @return array<int, array<string, mixed>>
     */
    public function objects(): array
    {
        return $this->command('USER_GET_OBJECTS');
    }

    /**
     * Latest live positions — GPS-Server embeds the fix on each object row.
     *
     * @return array<int, array<string, mixed>>
     */
    public function latestPositions(): array
    {
        return $this->objects();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function command(string $cmd): array
    {
        $data = $this->json($this->send($cmd));

        if ($data === []) {
            return [];
        }

        if (array_is_list($data)) {
            /** @var array<int, array<string, mixed>> $data */
            return $data;
        }

        return [];
    }

    private function send(string $cmd): Response
    {
        try {
            return $this->request()->get('/api/api.php', [
                'api' => 'user',
                'ver' => '1.0',
                'key' => (string) $this->config->token,
                'cmd' => $cmd,
            ]);
        } catch (ConnectionException $e) {
            throw new TraccarUnavailableException('Could not reach the GPS-Server: '.$e->getMessage(), previous: $e);
        }
    }

    /**
     * @return array<int, array<string, mixed>>|array<string, mixed>
     */
    private function json(Response $response): array
    {
        if ($response->status() === 401 || $response->status() === 403) {
            throw new TraccarAuthenticationException('GPS-Server rejected the API key for this tenant.');
        }

        if ($response->failed()) {
            throw new TraccarUnavailableException("GPS-Server responded with HTTP {$response->status()}.");
        }

        $body = trim((string) $response->body());

        // Invalid keys often return a plain-text error instead of JSON.
        if ($body === '' || strcasecmp($body, 'false') === 0) {
            throw new TraccarAuthenticationException('GPS-Server rejected the API key for this tenant.');
        }

        $data = $response->json();

        if (! is_array($data)) {
            throw new TraccarAuthenticationException('GPS-Server rejected the API key for this tenant.');
        }

        return $data;
    }

    private function request(): PendingRequest
    {
        return Http::baseUrl(rtrim((string) $this->config->baseUrl(), '/'))
            ->timeout(30)
            ->connectTimeout(5)
            ->retry(2, 200, fn ($exception) => $exception instanceof ConnectionException, throw: false)
            ->acceptJson();
    }
}
