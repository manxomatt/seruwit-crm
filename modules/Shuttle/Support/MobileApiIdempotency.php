<?php

namespace Modules\Shuttle\Support;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Replay-safe responses for mobile POST hold/pay using Idempotency-Key.
 */
class MobileApiIdempotency
{
    private const TTL_SECONDS = 86400;

    public function key(Request $request): ?string
    {
        $raw = trim((string) $request->header('Idempotency-Key', ''));

        return $raw !== '' ? $raw : null;
    }

    /**
     * @return JsonResponse|null Cached response when this key was already completed
     */
    public function recall(Request $request, string $scope): ?JsonResponse
    {
        $key = $this->key($request);
        if ($key === null) {
            return null;
        }

        $cached = Cache::get($this->cacheKey($scope, $key));
        if (! is_array($cached)) {
            return null;
        }

        $bodyHash = $this->bodyHash($request);
        if (($cached['body_hash'] ?? null) !== $bodyHash) {
            return response()->json([
                'message' => 'Idempotency key reused with a different payload.',
                'code' => 'idempotency_conflict',
            ], Response::HTTP_CONFLICT);
        }

        return response()->json($cached['payload'], (int) $cached['status'])
            ->header('Idempotent-Replayed', 'true');
    }

    public function store(Request $request, string $scope, JsonResponse $response): void
    {
        $key = $this->key($request);
        if ($key === null) {
            return;
        }

        if ($response->getStatusCode() >= 500) {
            return;
        }

        Cache::put($this->cacheKey($scope, $key), [
            'body_hash' => $this->bodyHash($request),
            'status' => $response->getStatusCode(),
            'payload' => json_decode($response->getContent() ?: '{}', true),
        ], self::TTL_SECONDS);
    }

    private function cacheKey(string $scope, string $key): string
    {
        $tenant = tenancy()->initialized ? (string) tenant('id') : 'central';

        return 'mobile_idem:'.$tenant.':'.$scope.':'.hash('sha256', $key);
    }

    private function bodyHash(Request $request): string
    {
        return hash('sha256', json_encode($request->all(), JSON_THROW_ON_ERROR));
    }
}
