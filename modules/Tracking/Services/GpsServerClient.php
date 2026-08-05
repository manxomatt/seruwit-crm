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
 * Talks to a GPS-Server (gsi-tracking style) API that authenticates with a
 * `key` query parameter on `/api/api.php`.
 */
class GpsServerClient implements GpsProvider
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
        return $this->command('USER_GET_OBJECTS');
    }

    /**
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
                'key' => (string) $this->source->token,
                'cmd' => $cmd,
            ]);
        } catch (ConnectionException $e) {
            throw new GpsProviderUnavailableException('Could not reach the GPS-Server: '.$e->getMessage(), previous: $e);
        }
    }

    /**
     * @return array<int, array<string, mixed>>|array<string, mixed>
     */
    private function json(Response $response): array
    {
        if ($response->status() === 401 || $response->status() === 403) {
            throw new GpsProviderAuthenticationException('GPS-Server rejected the API key for this source.');
        }

        if ($response->failed()) {
            throw new GpsProviderUnavailableException("GPS-Server responded with HTTP {$response->status()}.");
        }

        $body = trim((string) $response->body());

        if ($body === '' || strcasecmp($body, 'false') === 0) {
            throw new GpsProviderAuthenticationException('GPS-Server rejected the API key for this source.');
        }

        $data = $response->json();

        if (! is_array($data)) {
            throw new GpsProviderAuthenticationException('GPS-Server rejected the API key for this source.');
        }

        return $data;
    }

    private function request(): PendingRequest
    {
        return Http::baseUrl(rtrim((string) $this->source->baseUrl(), '/'))
            ->timeout(30)
            ->connectTimeout(5)
            ->retry(2, 200, fn ($exception) => $exception instanceof ConnectionException, throw: false)
            ->acceptJson();
    }
}
