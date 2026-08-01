<?php

namespace Modules\Shuttle\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Shuttle\Http\Controllers\Api\Mobile\Concerns\InteractsWithMobilePassengerApi;
use Modules\Shuttle\Http\Requests\Mobile\SendOtpRequest;
use Modules\Shuttle\Http\Requests\Mobile\VerifyOtpRequest;
use Modules\Shuttle\Support\MobilePassengerTokenService;
use Modules\Shuttle\Support\PassengerOtpService;

class AuthController extends Controller
{
    use InteractsWithMobilePassengerApi;

    public function sendOtp(SendOtpRequest $request, PassengerOtpService $otp): JsonResponse
    {
        $this->ensurePassengerChannelEnabled();

        $code = $otp->send($request->string('phone')->toString());

        $payload = [
            'ok' => true,
            'message' => __('shuttle.public.otp_sent'),
            'expires_in' => 300,
        ];

        if (! app()->environment('production')) {
            $payload['debug_code'] = $code;
        }

        return response()->json($payload);
    }

    public function verifyOtp(
        VerifyOtpRequest $request,
        PassengerOtpService $otp,
        MobilePassengerTokenService $tokens,
    ): JsonResponse {
        $this->ensurePassengerChannelEnabled();

        $phone = $request->string('phone')->toString();
        $code = $request->string('code')->toString();

        if (! $otp->verify($phone, $code)) {
            return response()->json([
                'message' => __('shuttle.public.otp_invalid'),
                'code' => 'otp_invalid',
                'errors' => [
                    'code' => [__('shuttle.public.otp_invalid')],
                ],
            ], 422);
        }

        $issued = $tokens->issue($phone);

        return response()->json([
            'token' => $issued['token'],
            'token_type' => 'Bearer',
            'expires_at' => $issued['expires_at'],
            'phone' => $issued['phone'],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'phone' => $request->attributes->get('mobile_passenger_phone'),
        ]);
    }

    public function logout(Request $request, MobilePassengerTokenService $tokens): JsonResponse
    {
        $plain = (string) $request->bearerToken();
        if ($plain !== '') {
            $tokens->revoke($plain);
        }

        return response()->json([
            'ok' => true,
        ]);
    }
}
