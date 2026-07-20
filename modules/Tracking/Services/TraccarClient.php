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
 * Talks to the tenant's Traccar server. Deliberately thin: it fetches and
 * hands back raw arrays, leaving interpretation to PositionPayload, so the
 * shape Traccar happens to use is pinned down in exactly one place.
 */
class TraccarClient
{
    public function __construct(private readonly TrackingConfig $config) {}

    /**
     * Every device the authenticated Traccar user can see.
     *
     * @return array<int, array<string, mixed>>
     */
    public function devices(): array
    {
        return $this->getJson('/devices');
    }

    /**
     * The latest fix for each visible device.
     *
     * Assumes GET /api/positions with no parameters returns one row per device,
     * which is Traccar's documented behaviour. Deployments differ, so a 400 is
     * treated as "this server wants explicit ids" and retried through the
     * device list rather than surfaced as a failure.
     *
     * @return array<int, array<string, mixed>>
     */
    public function latestPositions(): array
    {
        $response = $this->send('/positions');

        if ($response->status() === 400) {
            return $this->latestPositionsViaDevices();
        }

        return $this->json($response);
    }

    /**
     * Fallback path: read each device's current positionId, then ask for those
     * positions by id.
     *
     * @return array<int, array<string, mixed>>
     */
    public function latestPositionsViaDevices(): array
    {
        $ids = collect($this->devices())
            ->pluck('positionId')
            ->filter(fn ($id) => is_numeric($id) && (int) $id > 0)
            ->map(fn ($id) => (int) $id)
            ->values();

        if ($ids->isEmpty()) {
            return [];
        }

        return $this->getJson('/positions?'.$ids->map(fn (int $id) => 'id='.$id)->implode('&'));
    }

    /**
     * Cheapest call that proves the credentials work, used by the settings
     * page's "test connection" button.
     */
    public function verify(): bool
    {
        $this->getJson('/devices');

        return true;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function getJson(string $path): array
    {
        return $this->json($this->send($path));
    }

    /**
     * Issues the request, translating an unreachable server into this module's
     * own exception type rather than letting Guzzle's escape.
     */
    private function send(string $path): Response
    {
        try {
            return $this->request()->get($path);
        } catch (ConnectionException $e) {
            throw new TraccarUnavailableException('Could not reach the Traccar server: '.$e->getMessage(), previous: $e);
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function json(Response $response): array
    {
        if ($response->status() === 401 || $response->status() === 403) {
            throw new TraccarAuthenticationException('Traccar rejected the credentials for this tenant.');
        }

        if ($response->failed()) {
            throw new TraccarUnavailableException("Traccar responded with HTTP {$response->status()}.");
        }

        $data = $response->json();

        return is_array($data) ? $data : [];
    }

    private function request(): PendingRequest
    {
        $request = Http::baseUrl(rtrim((string) $this->config->baseUrl(), '/').'/api')
            ->timeout(10)
            ->connectTimeout(5)
            // Never throw on a retried status: a failed run must degrade into a
            // recorded error for one tenant, not an exception mid-loop.
            ->retry(2, 200, throw: false)
            ->acceptJson();

        $request = $this->config->auth_type === TrackingConfig::AUTH_TOKEN
            ? $request->withToken((string) $this->config->token)
            : $request->withBasicAuth((string) $this->config->email, (string) $this->config->password);

        return $request;
    }
}
