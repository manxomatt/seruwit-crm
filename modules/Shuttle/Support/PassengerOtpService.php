<?php

namespace Modules\Shuttle\Support;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Phone OTP for passenger self-booking. Codes live in cache (no SMS provider
 * required for MVP). In system development mode the code is returned to the
 * client and logged for local testing.
 */
class PassengerOtpService
{
    private const TTL_SECONDS = 300;

    public function send(string $phone): string
    {
        $phone = $this->normalize($phone);
        $code = (string) random_int(100000, 999999);

        Cache::put($this->cacheKey($phone), $code, self::TTL_SECONDS);

        if (\App\Support\SystemMode::shouldExposeDebugOtp()) {
            Log::info('Shuttle passenger OTP', ['phone' => $phone, 'code' => $code]);
        }

        return $code;
    }

    public function verify(string $phone, string $code): bool
    {
        $phone = $this->normalize($phone);
        $expected = Cache::get($this->cacheKey($phone));

        if ($expected === null || ! hash_equals((string) $expected, trim($code))) {
            return false;
        }

        Cache::forget($this->cacheKey($phone));
        Cache::put($this->verifiedKey($phone), true, 1800);

        return true;
    }

    public function isVerified(string $phone): bool
    {
        return (bool) Cache::get($this->verifiedKey($this->normalize($phone)));
    }

    public function normalize(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        if (Str::startsWith($digits, '0')) {
            $digits = '62'.substr($digits, 1);
        }

        return $digits;
    }

    private function cacheKey(string $phone): string
    {
        return 'shuttle_otp:'.$phone;
    }

    private function verifiedKey(string $phone): string
    {
        return 'shuttle_otp_ok:'.$phone;
    }
}
