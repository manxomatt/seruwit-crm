<?php

namespace App\Services\Central;

use App\Models\CentralUser;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Services\WhatsApp\WhatsAppGatewayManager;
use App\Support\SystemMode;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

class CentralPhoneVerificationService
{
    public const TTL_SECONDS = 300; // 5 minutes

    public const MAX_ATTEMPTS = 5;

    public function __construct(
        protected WhatsAppGatewayManager $gatewayManager,
    ) {}

    /**
     * Check if phone verification is currently required on the platform.
     */
    public function isVerificationRequired(): bool
    {
        return PlatformSetting::isPhoneVerificationRequired();
    }

    /**
     * Normalize an Indonesian phone number.
     */
    public function normalize(string $phone): string
    {
        return WhatsAppGatewayManager::normalizePhone($phone);
    }

    /**
     * Cache key for active OTP data.
     */
    protected function otpCacheKey(string $phone): string
    {
        return 'central_phone_otp:'.$this->normalize($phone);
    }

    /**
     * Cache key for resend cooldown.
     */
    protected function cooldownCacheKey(int|string $userId, string $phone): string
    {
        return 'central_phone_cooldown:'.$userId.'_'.$this->normalize($phone);
    }

    /**
     * Determine if a user can request an OTP resend.
     */
    public function canResend(int|string $userId, string $phone): bool
    {
        return ! Cache::has($this->cooldownCacheKey($userId, $phone));
    }

    /**
     * Get remaining cooldown seconds before next OTP request is allowed.
     */
    public function getRemainingCooldown(int|string $userId, string $phone): int
    {
        $key = $this->cooldownCacheKey($userId, $phone);
        $expiresAt = Cache::get($key.'_expires_at');

        if (! $expiresAt) {
            return 0;
        }

        return max(0, (int) ($expiresAt - now()->timestamp));
    }

    /**
     * Generate and dispatch a 6-digit WhatsApp OTP code to the given user and phone.
     *
     * @return array{success: bool, phone: string, cooldown: int, error?: string, debug_code?: string}
     */
    public function sendOtp(CentralUser|User $user, string $phone): array
    {
        $normalizedPhone = $this->normalize($phone);

        if (blank($normalizedPhone)) {
            throw ValidationException::withMessages([
                'phone' => 'Nomor WhatsApp tidak valid.',
            ]);
        }

        $userId = $user->id ?? $user->global_id;

        if (! $this->canResend($userId, $normalizedPhone)) {
            $remaining = $this->getRemainingCooldown($userId, $normalizedPhone);

            throw ValidationException::withMessages([
                'phone' => "Mohon tunggu {$remaining} detik sebelum meminta kode OTP kembali.",
            ]);
        }

        $code = (string) random_int(100000, 999999);
        $hashedCode = Hash::make($code);

        Cache::put(
            $this->otpCacheKey($normalizedPhone),
            [
                'code_hash' => $hashedCode,
                'attempts' => 0,
                'created_at' => now()->timestamp,
            ],
            self::TTL_SECONDS
        );

        $cooldownSeconds = PlatformSetting::getOtpResendCooldownSeconds();
        $cooldownKey = $this->cooldownCacheKey($userId, $normalizedPhone);
        Cache::put($cooldownKey, true, $cooldownSeconds);
        Cache::put($cooldownKey.'_expires_at', now()->timestamp + $cooldownSeconds, $cooldownSeconds);

        $debugCode = null;
        if (SystemMode::shouldExposeDebugOtp()) {
            $debugCode = $code;
            Log::info('[CentralPhoneVerificationService] Debug WhatsApp OTP generated', [
                'user_id' => $userId,
                'phone' => $normalizedPhone,
                'code' => $code,
            ]);
        }

        $dispatched = $this->dispatchWhatsAppOtp($user, $normalizedPhone, $code);

        return [
            'success' => $dispatched,
            'phone' => $normalizedPhone,
            'cooldown' => $cooldownSeconds,
            'debug_code' => $debugCode,
            'error' => $dispatched ? null : 'Gagal mengirim pesan WhatsApp. Pastikan gateway WhatsApp Central aktif dan terhubung.',
        ];
    }

    /**
     * Verify an entered OTP code against the cached challenge.
     *
     * @return array{success: bool, message?: string, error?: string}
     */
    public function verifyOtp(CentralUser|User $user, string $phone, string $code): array
    {
        $normalizedPhone = $this->normalize($phone);
        $cacheKey = $this->otpCacheKey($normalizedPhone);
        $cached = Cache::get($cacheKey);

        if (! $cached || ! is_array($cached)) {
            return [
                'success' => false,
                'error' => 'Kode OTP telah kedaluwarsa atau belum diminta. Silakan minta kode baru.',
            ];
        }

        $attempts = (int) ($cached['attempts'] ?? 0);

        if ($attempts >= self::MAX_ATTEMPTS) {
            Cache::forget($cacheKey);

            return [
                'success' => false,
                'error' => 'Terlalu banyak percobaan salah. Kode OTP telah dibatalkan, silakan minta kode baru.',
            ];
        }

        $hashed = (string) ($cached['code_hash'] ?? '');
        $isValid = Hash::check(trim($code), $hashed);

        if (! $isValid) {
            $attempts++;
            $remaining = self::MAX_ATTEMPTS - $attempts;

            Cache::put(
                $cacheKey,
                [
                    'code_hash' => $hashed,
                    'attempts' => $attempts,
                    'created_at' => $cached['created_at'] ?? now()->timestamp,
                ],
                self::TTL_SECONDS
            );

            return [
                'success' => false,
                'error' => "Kode OTP yang Anda masukkan salah. Sisa percobaan: {$remaining} kali.",
            ];
        }

        // OTP Valid: consume challenge and mark user's phone as verified
        Cache::forget($cacheKey);

        $user->forceFill([
            'phone' => $normalizedPhone,
            'phone_verified_at' => now(),
        ])->save();

        Log::info('[CentralPhoneVerificationService] User phone verified successfully', [
            'user_id' => $user->id ?? $user->global_id,
            'phone' => $normalizedPhone,
        ]);

        return [
            'success' => true,
            'message' => 'Nomor WhatsApp berhasil diverifikasi.',
        ];
    }

    /**
     * Dispatch OTP WhatsApp message via Central WhatsApp Gateway.
     */
    protected function dispatchWhatsAppOtp(CentralUser|User $user, string $phone, string $code): bool
    {
        try {
            $template = (string) PlatformSetting::getValue(
                'whatsapp.otp_template',
                "🔐 *KODE VERIFIKASI SERUWIT*\n\nHalo *{user_name}*,\nGunakan kode berikut untuk memverifikasi nomor WhatsApp akun bisnis Anda:\n\n👉 *{code}*\n\nKode ini berlaku selama *5 menit*. Jangan bagikan kode ini kepada siapa pun demi keamanan akun Anda.\n\nSalam,\n*Tim Seruwit Platform*"
            );

            $message = str_replace(
                ['{user_name}', '{code}', '{expiry_minutes}'],
                [$user->name ?: 'Mitra', $code, '5'],
                $template
            );

            $gateway = $this->gatewayManager->forCentral();

            return $gateway->sendMessage($phone, $message);
        } catch (Throwable $e) {
            Log::error('[CentralPhoneVerificationService] Failed to dispatch WhatsApp OTP', [
                'phone' => $phone,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
