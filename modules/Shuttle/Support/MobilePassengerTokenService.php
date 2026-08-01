<?php

namespace Modules\Shuttle\Support;

use Illuminate\Support\Str;
use Modules\Shuttle\Models\MobilePassengerToken;

/**
 * Bearer tokens for mobile passenger clients (Capacitor). Tokens are tenant-scoped
 * via the tenancy connection; plaintext is returned once at issue time.
 */
class MobilePassengerTokenService
{
    public const TTL_DAYS = 30;

    /**
     * @return array{token: string, phone: string, expires_at: string}
     */
    public function issue(string $phone): array
    {
        $phone = app(PassengerOtpService::class)->normalize($phone);
        $plain = Str::random(40);
        $expiresAt = now()->addDays(self::TTL_DAYS);

        MobilePassengerToken::query()->create([
            'phone' => $phone,
            'token_hash' => hash('sha256', $plain),
            'expires_at' => $expiresAt,
        ]);

        return [
            'token' => $plain,
            'phone' => $phone,
            'expires_at' => $expiresAt->toIso8601String(),
        ];
    }

    public function findValid(string $plainToken): ?MobilePassengerToken
    {
        if ($plainToken === '') {
            return null;
        }

        /** @var MobilePassengerToken|null $row */
        $row = MobilePassengerToken::query()
            ->where('token_hash', hash('sha256', $plainToken))
            ->first();

        if ($row === null || $row->isExpired()) {
            return null;
        }

        $row->forceFill(['last_used_at' => now()])->save();

        return $row;
    }

    public function revoke(string $plainToken): void
    {
        MobilePassengerToken::query()
            ->where('token_hash', hash('sha256', $plainToken))
            ->delete();
    }

    public function revokeAllForPhone(string $phone): void
    {
        $phone = app(PassengerOtpService::class)->normalize($phone);

        MobilePassengerToken::query()->where('phone', $phone)->delete();
    }
}
