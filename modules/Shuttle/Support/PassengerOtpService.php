<?php

namespace Modules\Shuttle\Support;

use App\Models\Setting;
use App\Services\WhatsApp\WhatsAppGatewayManager;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

/**
 * Phone OTP for passenger self-booking and customer login.
 * Codes live in cache with a 5-minute TTL and are dispatched via WhatsApp Gateway.
 */
class PassengerOtpService
{
    private const TTL_SECONDS = 300;

    public function __construct(
        protected ?WhatsAppGatewayManager $gatewayManager = null,
    ) {
        $this->gatewayManager ??= app(WhatsAppGatewayManager::class);
    }

    public function send(string $phone): string
    {
        $phone = $this->normalize($phone);
        $code = (string) random_int(100000, 999999);

        Cache::put($this->cacheKey($phone), $code, self::TTL_SECONDS);

        if (\App\Support\SystemMode::shouldExposeDebugOtp()) {
            Log::info('Passenger OTP generated', ['phone' => $phone, 'code' => $code]);
        }

        $this->sendWhatsAppOtp($phone, $code);

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
        return WhatsAppGatewayManager::normalizePhone($phone);
    }

    protected function sendWhatsAppOtp(string $phone, string $code): bool
    {
        try {
            $companyName = (string) Setting::getValue(
                'general.site_name',
                Setting::getValue('site.company_name', config('app.name', 'Seruwit Rental'))
            );

            $message = "🔐 *KODE VERIFIKASI (OTP)*\n"
                ."*{$companyName}*\n\n"
                ."Kode OTP Anda adalah:\n"
                ."*{$code}*\n\n"
                ."Kode ini berlaku selama 5 menit. Demi keamanan akun Anda, *JANGAN* bagikan kode ini kepada siapa pun termasuk pihak {$companyName}.";

            $targetPhone = WhatsAppGatewayManager::normalizePhone($phone);

            return $this->gatewayManager->driver()->sendMessage($targetPhone, $message);
        } catch (Throwable $e) {
            Log::error('[PassengerOtpService] Failed to send WhatsApp OTP', [
                'phone' => $phone,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
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
