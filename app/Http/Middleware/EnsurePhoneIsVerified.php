<?php

namespace App\Http\Middleware;

use App\Models\PlatformSetting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePhoneIsVerified
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $isVerificationRequired = PlatformSetting::isPhoneVerificationRequired();

        if (! $isVerificationRequired) {
            return $next($request);
        }

        $user = $request->user();

        if ($user && ! $user->hasVerifiedPhone()) {
            return $request->expectsJson()
                ? abort(403, 'Nomor WhatsApp Anda belum terverifikasi.')
                : redirect()->route('central.phone.notice');
        }

        return $next($request);
    }
}
