<?php

namespace App\Http\Controllers\Central;

use App\Actions\Auth\ResolvePostAuthDestination;
use App\Http\Controllers\Controller;
use App\Models\OnboardingSession;
use App\Models\Setting;
use App\Services\Central\CentralPhoneVerificationService;
use App\Services\WhatsApp\WhatsAppGatewayManager;
use App\Support\SystemMode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PhoneVerificationController extends Controller
{
    public function __construct(
        protected CentralPhoneVerificationService $verificationService,
        protected ResolvePostAuthDestination $postAuthDestination,
    ) {}

    /**
     * Display the phone verification prompt page.
     */
    public function notice(Request $request): RedirectResponse|Response
    {
        $user = $request->user();

        if ($user->hasVerifiedPhone()) {
            return redirect()->intended($this->postAuthDestination->url($user));
        }

        $userId = $user->id ?? $user->global_id;
        $phone = $user->phone ?? '';
        $cooldown = $phone ? $this->verificationService->getRemainingCooldown($userId, $phone) : 0;

        $settings = Setting::getPublic()
            ->mapWithKeys(fn (Setting $setting) => [$setting->key => $setting->value])
            ->toArray();

        return Inertia::render('Central/Auth/VerifyPhone', [
            'phone' => $phone,
            'hasPhone' => filled($phone),
            'cooldown' => $cooldown,
            'isDevelopment' => SystemMode::shouldExposeDebugOtp(),
            'debugOtp' => session('debug_otp'),
            'settings' => $settings,
            'status' => session('status'),
        ]);
    }

    /**
     * Send or resend a WhatsApp OTP to the user's phone.
     */
    public function send(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedPhone()) {
            return redirect()->intended($this->postAuthDestination->url($user));
        }

        $phone = $request->input('phone') ?: $user->phone;

        if (blank($phone)) {
            throw ValidationException::withMessages([
                'phone' => 'Nomor WhatsApp belum diatur. Silakan masukkan nomor Anda.',
            ]);
        }

        $normalizedPhone = WhatsAppGatewayManager::normalizePhone($phone);

        if ($user->phone !== $normalizedPhone) {
            $user->forceFill(['phone' => $normalizedPhone])->save();
        }

        try {
            $result = $this->verificationService->sendOtp($user, $normalizedPhone);

            if ($result['debug_code'] ?? null) {
                session()->flash('debug_otp', $result['debug_code']);
            }

            if (! $result['success']) {
                return back()->with('error', $result['error'] ?? 'Gagal mengirim kode OTP WhatsApp.');
            }

            return back()->with('status', 'Kode verifikasi telah dikirimkan via WhatsApp ke nomor Anda.');
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            return back()->with('error', 'Terjadi kesalahan saat mengirim kode verifikasi WhatsApp.');
        }
    }

    /**
     * Verify the user's submitted OTP code.
     */
    public function verify(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedPhone()) {
            return redirect()->intended($this->postAuthDestination->url($user));
        }

        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $phone = $user->phone;
        if (blank($phone)) {
            return back()->withErrors(['phone' => 'Nomor WhatsApp belum terdaftar.']);
        }

        $result = $this->verificationService->verifyOtp($user, $phone, $request->string('code')->toString());

        if (! $result['success']) {
            return back()->withErrors(['code' => $result['error'] ?? 'Kode OTP salah.']);
        }

        // Sync verified phone into OnboardingSession if present
        if ($user->global_id) {
            OnboardingSession::query()
                ->where('global_user_id', $user->global_id)
                ->whereNull('phone')
                ->update(['phone' => $phone]);
        }

        return redirect()->intended($this->postAuthDestination->url($user))
            ->with('status', 'Nomor WhatsApp berhasil diverifikasi!');
    }

    /**
     * Update the user's phone number and dispatch a fresh OTP code.
     */
    public function updatePhone(Request $request): RedirectResponse
    {
        $user = $request->user();

        $request->validate([
            'phone' => ['required', 'string', 'min:9', 'max:20'],
        ]);

        $normalizedPhone = WhatsAppGatewayManager::normalizePhone($request->string('phone')->toString());

        $user->forceFill([
            'phone' => $normalizedPhone,
            'phone_verified_at' => null,
        ])->save();

        // Also sync to active onboarding session if applicable
        if ($user->global_id) {
            OnboardingSession::query()
                ->where('global_user_id', $user->global_id)
                ->update(['phone' => $normalizedPhone]);
        }

        try {
            $result = $this->verificationService->sendOtp($user, $normalizedPhone);

            if ($result['debug_code'] ?? null) {
                session()->flash('debug_otp', $result['debug_code']);
            }

            return back()->with('status', 'Nomor berhasil diperbarui dan kode verifikasi telah dikirim.');
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        } catch (\Throwable) {
            return back()->with('status', 'Nomor berhasil disimpan. Silakan klik kirim kode verifikasi.');
        }
    }
}
