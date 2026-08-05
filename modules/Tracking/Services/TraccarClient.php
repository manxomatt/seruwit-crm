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
 * Talks to the tenant's Traccar server. Deliberately thin: it fetches and
 * hands back raw arrays, leaving interpretation to PositionPayload, so the
 * shape Traccar happens to use is pinned down in exactly one place.
 */
class TraccarClient implements GpsProvider
{
    public function __construct(private readonly GpsSource $source) {}

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listDevices(): array
    {
        return $this->devices();
    }

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

        return $ids->chunk(50)
            ->flatMap(fn ($chunk) => $this->fetchPositionsByIds($chunk->values()))
            ->all();
    }

    /**
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
                return [];
            }

            $half = (int) ceil($ids->count() / 2);

            return array_merge(
                $this->fetchPositionsByIds($ids->take($half)->values()),
                $this->fetchPositionsByIds($ids->skip($half)->values()),
            );
        }

        return $this->json($response);
    }

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

    private function send(string $path): Response
    {
        try {
            return $this->request()->get($path);
        } catch (ConnectionException $e) {
            throw new GpsProviderUnavailableException('Could not reach the Traccar server: '.$e->getMessage(), previous: $e);
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function json(Response $response): array
    {
        if ($response->status() === 401 || $response->status() === 403) {
            throw new GpsProviderAuthenticationException('Traccar rejected the credentials for this source.');
        }

        if ($response->failed()) {
            throw new GpsProviderUnavailableException("Traccar responded with HTTP {$response->status()}.");
        }

        $data = $response->json();

        return is_array($data) ? $data : [];
    }

    private function request(): PendingRequest
    {
        $request = Http::baseUrl(rtrim((string) $this->source->baseUrl(), '/').'/api')
            ->timeout(10)
            ->connectTimeout(5)
            ->retry(2, 200, fn ($exception) => $exception instanceof ConnectionException, throw: false)
            ->acceptJson();

        $request = $this->source->auth_type === GpsSource::AUTH_TOKEN
            ? $request->withToken((string) $this->source->token)
            : $request->withBasicAuth((string) $this->source->email, (string) $this->source->password);

        return $request;
    }
}
