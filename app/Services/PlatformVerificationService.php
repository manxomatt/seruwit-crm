<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Contracts\Auth\MustVerifyEmail;

/**
 * Platform identity verification (self-serve signup).
 *
 * P0: email channel via Laravel MustVerifyEmail notifications.
 * Phone/SMS OTP will plug in here later — do not reuse PassengerOtpService.
 */
class PlatformVerificationService
{
    public function isVerified(User $user): bool
    {
        if ($user instanceof MustVerifyEmail) {
            return $user->hasVerifiedEmail();
        }

        return $user->email_verified_at !== null;
    }

    public function sendEmailVerification(User $user): void
    {
        if ($this->isVerified($user)) {
            return;
        }

        $user->sendEmailVerificationNotification();
    }
}
