<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Rental\Models\Customer;
use Modules\Rental\Support\MobilePassengerPartnerResolver;
use Modules\Rental\Support\RentalStorefrontSettings;
use Modules\Shuttle\Support\PassengerOtpService;

class CustomerAuthController extends Controller
{
    public function __construct(
        private readonly PassengerOtpService $otp,
        private readonly MobilePassengerPartnerResolver $partnerResolver,
    ) {}

    public function showLogin(Request $request): Response|RedirectResponse
    {
        if (Auth::guard('customer')->check()) {
            return redirect()->intended(route('book.rental.portal.dashboard'));
        }

        return Inertia::render('Modules/Rental/Public/Customer/Login', [
            'brand' => $this->brand(),
            'redirect' => $request->query('redirect'),
        ]);
    }

    public function sendOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'max:30'],
        ]);

        $normalized = $this->otp->normalize($validated['phone']);
        $code = $this->otp->send($normalized);

        $response = [
            'ok' => true,
            'success' => true,
            'message' => 'Kode OTP verifikasi telah dikirim ke nomor WhatsApp Anda.',
        ];

        if (\App\Support\SystemMode::shouldExposeDebugOtp()) {
            $response['debug_otp'] = $code;
        }

        return response()->json($response);
    }

    public function verifyOtp(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'max:30'],
            'code' => ['nullable', 'string', 'max:10'],
            'otp_code' => ['nullable', 'string', 'max:10'],
            'name' => ['nullable', 'string', 'max:255'],
            'redirect' => ['nullable', 'string', 'max:500'],
        ]);

        $code = (string) ($validated['code'] ?? $validated['otp_code'] ?? '');
        if ($code === '') {
            throw ValidationException::withMessages([
                'code' => 'Kode OTP wajib diisi.',
            ]);
        }

        $normalized = $this->otp->normalize($validated['phone']);

        if (! $this->otp->verify($normalized, $code)) {
            throw ValidationException::withMessages([
                'code' => 'Kode OTP salah atau telah kedaluwarsa. Silakan minta kode baru.',
            ]);
        }

        $customer = Customer::query()->where('phone', $normalized)->first();

        if ($customer === null) {
            $partner = $this->partnerResolver->resolve(
                phone: $normalized,
                name: $validated['name'] ?? null,
            );

            $customer = Customer::query()->create([
                'partner_id' => $partner->id,
                'name' => $partner->name,
                'phone' => $normalized,
                'email' => $partner->email,
                'phone_verified_at' => now(),
                'last_login_at' => now(),
            ]);
        } else {
            if ($customer->partner_id === null) {
                $partner = $this->partnerResolver->resolve(
                    phone: $normalized,
                    name: $customer->name,
                    email: $customer->email,
                );
                $customer->update(['partner_id' => $partner->id]);
            }

            $customer->update([
                'phone_verified_at' => $customer->phone_verified_at ?? now(),
                'last_login_at' => now(),
            ]);
        }

        Auth::guard('customer')->login($customer, true);
        $request->session()->regenerate();

        $destination = ! empty($validated['redirect']) ? $validated['redirect'] : route('book.rental.portal.dashboard');

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'redirect' => $destination,
            ]);
        }

        return redirect()->intended($destination);
    }

    public function loginWithPassword(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'login' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'min:4'],
            'remember' => ['nullable', 'boolean'],
            'redirect' => ['nullable', 'string', 'max:500'],
        ]);

        $loginInput = trim($validated['login']);
        $normalizedPhone = $this->otp->normalize($loginInput);

        $customer = Customer::query()
            ->where(function ($q) use ($loginInput, $normalizedPhone): void {
                $q->where('email', $loginInput)
                    ->orWhere('phone', $normalizedPhone)
                    ->orWhere('phone', $loginInput);
            })
            ->first();

        if ($customer === null || ! Hash::check($validated['password'], (string) $customer->password)) {
            throw ValidationException::withMessages([
                'login' => 'Nomor WhatsApp / Email atau kata sandi tidak cocok.',
            ]);
        }

        $customer->update(['last_login_at' => now()]);
        Auth::guard('customer')->login($customer, (bool) ($validated['remember'] ?? true));
        $request->session()->regenerate();

        $destination = ! empty($validated['redirect']) ? $validated['redirect'] : route('book.rental.portal.dashboard');

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'redirect' => $destination,
            ]);
        }

        return redirect()->intended($destination);
    }

    public function showRegister(Request $request): Response|RedirectResponse
    {
        if (Auth::guard('customer')->check()) {
            return redirect()->intended(route('book.rental.portal.dashboard'));
        }

        return Inertia::render('Modules/Rental/Public/Customer/Register', [
            'brand' => $this->brand(),
            'redirect' => $request->query('redirect'),
        ]);
    }

    public function register(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            'code' => ['nullable', 'string', 'max:10'],
            'otp_code' => ['nullable', 'string', 'max:10'],
            'email' => ['nullable', 'email', 'max:255'],
            'password' => ['nullable', 'string', 'min:6'],
            'redirect' => ['nullable', 'string', 'max:500'],
        ]);

        $normalized = $this->otp->normalize($validated['phone']);
        $code = (string) ($validated['code'] ?? $validated['otp_code'] ?? '');

        if ($code !== '') {
            if (! $this->otp->verify($normalized, $code)) {
                throw ValidationException::withMessages([
                    'code' => 'Kode OTP salah atau telah kedaluwarsa. Silakan minta kode baru.',
                ]);
            }
        } elseif (empty($validated['password'])) {
            throw ValidationException::withMessages([
                'code' => 'Kode OTP atau password wajib diisi untuk mendaftar.',
            ]);
        }

        $customer = Customer::query()->where('phone', $normalized)->first();

        if ($customer !== null) {
            $customer->update([
                'name' => $validated['name'],
                'email' => $validated['email'] ?? $customer->email,
                'password' => ! empty($validated['password']) ? Hash::make($validated['password']) : $customer->password,
                'phone_verified_at' => now(),
                'last_login_at' => now(),
            ]);
        } else {
            $partner = $this->partnerResolver->resolve(
                phone: $normalized,
                name: $validated['name'],
                email: $validated['email'] ?? null,
            );

            $customer = Customer::query()->create([
                'partner_id' => $partner->id,
                'name' => $validated['name'],
                'phone' => $normalized,
                'email' => $validated['email'] ?? null,
                'password' => ! empty($validated['password']) ? Hash::make($validated['password']) : null,
                'phone_verified_at' => now(),
                'last_login_at' => now(),
            ]);
        }

        Auth::guard('customer')->login($customer, true);
        $request->session()->regenerate();

        $destination = ! empty($validated['redirect']) ? $validated['redirect'] : route('book.rental.portal.dashboard');

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'redirect' => $destination,
            ]);
        }

        return redirect()->intended($destination);
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('customer')->logout();
        $request->session()->regenerateToken();

        return redirect()->route('book.rental.search');
    }

    /**
     * @return array{name: string, color: string, support_phone: string|null, logo_url: string|null}
     */
    private function brand(): array
    {
        $settings = RentalStorefrontSettings::all();

        return [
            'name' => $settings['brand_name'] ?: config('app.name', 'Seruwit Rental'),
            'color' => $settings['primary_color'] ?: '#0f766e',
            'support_phone' => $settings['support_phone'] ?: null,
            'logo_url' => $settings['logo_url'] ?: null,
        ];
    }
}
