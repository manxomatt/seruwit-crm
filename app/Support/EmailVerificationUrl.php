<?php

namespace App\Support;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\URL;

/**
 * Builds the signed email-verification URL used by the VerifyEmail notification
 * and by the development on-screen preview when mail is disabled.
 */
final class EmailVerificationUrl
{
    public static function for(object $notifiable): string
    {
        $route = Route::has('central.verification.verify')
            ? 'central.verification.verify'
            : 'verification.verify';

        return URL::temporarySignedRoute(
            $route,
            now()->addMinutes((int) config('auth.verification.expire', 60)),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ],
        );
    }
}
