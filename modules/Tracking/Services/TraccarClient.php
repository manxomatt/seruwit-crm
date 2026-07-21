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
     * Every device the account manages.
     *
     * The reseller-style accounts these fleets use are Traccar admins or
     * managers, and a plain /devices returns only devices they own *directly* —
     * empty, since the trackers belong to sub-users. ?all=true returns the whole
     * managed tree. A regular user's account rejects ?all=true with 400, so that
     * is the signal to fall back to the plain listing.
     *
     * @return array<int, array<string, mixed>>
     */
    public function devices(): array
    {
        $response = $this->send('/devices?all=true');

        if ($response->status() === 400) {
            return $this->getJson('/devices');
        }

        return $this->json($response);
    }

    /**
     * The latest fix for each managed device.
     *
     * A bare /positions returns only the positions of directly-owned devices,
     * which is empty for the admin/manager accounts these fleets use — so the
     * positions are derived from the device list's positionIds, which works for
     * every account type. That was designed as a fallback; the real server
     * proved it is the only path that works, so it is now the primary one.
     *
     * @return array<int, array<string, mixed>>
     */
    public function latestPositions(): array
    {
        $ids = collect($this->devices())
            ->pluck('positionId')
            ->filter(fn ($id) => is_numeric($id) && (int) $id > 0)
            ->map(fn ($id) => (int) $id)
            ->values();

        if ($ids->isEmpty()) {
            return [];
        }

        // Chunked so a large fleet's id list never overruns the server's URL
        // length limit — 260 devices is already a couple of kilobytes of query.
        return $ids->chunk(50)
            ->flatMap(fn ($chunk) => $this->fetchPositionsByIds($chunk->values()))
            ->all();
    }

    /**
     * Fetches a batch of positions by their ids, tolerating dangling ones.
     *
     * Traccar prunes old positions on its own retention schedule, so an offline
     * device's last positionId can point at a row that no longer exists — and a
     * single such id makes the whole batch return 400. The batch is split to
     * isolate the bad id and drop it; every retrievable position still comes
     * back. Real failures (auth, server error) still surface.
     *
     * @param  \Illuminate\Support\Collection<int, int>  $ids
     * @return array<int, array<string, mixed>>
     */
    private function fetchPositionsByIds(\Illuminate\Support\Collection $ids): array
    {
        if ($ids->isEmpty()) {
            return [];
        }

        $response = $this->send('/positions?'.$ids->map(fn (int $id) => 'id='.$id)->implode('&'));

        if ($response->successful()) {
            $data = $response->json();

            return is_array($data) ? $data : [];
        }

        if ($response->status() === 400) {
            if ($ids->count() === 1) {
                return []; // a single dangling id — skip it
            }

            $half = (int) ceil($ids->count() / 2);

            return array_merge(
                $this->fetchPositionsByIds($ids->take($half)->values()),
                $this->fetchPositionsByIds($ids->skip($half)->values()),
            );
        }

        // 401/403/5xx are genuine failures, not a bad id — let json() raise.
        return $this->json($response);
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
            // Retry only a dropped connection, never a 4xx: a 400 here is a
            // deterministic answer (a dangling position id) that the caller
            // handles by splitting the batch, so retrying it just wastes time.
            ->retry(2, 200, fn ($exception) => $exception instanceof ConnectionException, throw: false)
            ->acceptJson();

        $request = $this->config->auth_type === TrackingConfig::AUTH_TOKEN
            ? $request->withToken((string) $this->config->token)
            : $request->withBasicAuth((string) $this->config->email, (string) $this->config->password);

        return $request;
    }
}
