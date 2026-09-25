<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Support\CentralAiSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Partners\Models\Partner;
use Modules\Receivables\Support\GatewayCheckoutService;
use Modules\Rental\AI\Contracts\DocumentKycServiceInterface;
use Modules\Rental\Models\Customer;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalCharge;
use Modules\Rental\Support\RentalBookingPolicy;
use Modules\Rental\Support\RentalGeneralSettings;
use Modules\Rental\Support\RentalStorefrontSettings;

class CustomerPortalController extends Controller
{
    public function dashboard(): Response
    {
        $customer = $this->activeCustomer();
        $partner = $customer->partner;

        $activeRentals = $partner !== null
            ? Rental::query()
                ->where('partner_id', $partner->id)
                ->whereIn('status', [
                    Rental::STATUS_PENDING,
                    Rental::STATUS_PENDING_RESERVED,
                    Rental::STATUS_CONFIRMED,
                    Rental::STATUS_ACTIVE,
                ])
                ->with(['vehicle:id,name,plate_number,photo_url,rental_class_label', 'pickupLocation:id,name', 'returnLocation:id,name'])
                ->latest()
                ->get()
            : collect();

        $recentRentals = $partner !== null
            ? Rental::query()
                ->where('partner_id', $partner->id)
                ->with(['vehicle:id,name,plate_number,photo_url', 'pickupLocation:id,name'])
                ->latest()
                ->limit(5)
                ->get()
            : collect();

        $totalRentalsCount = $partner !== null
            ? Rental::query()->where('partner_id', $partner->id)->count()
            : 0;

        return Inertia::render('Modules/Rental/Public/Customer/Dashboard', [
            'brand' => $this->brand(),
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'email' => $customer->email,
                'has_password' => filled($customer->password),
            ],
            'kyc' => [
                'status' => $partner?->kyc_status ?? Partner::KYC_STATUS_UNVERIFIED,
                'rejected_reason' => $partner?->kyc_rejected_reason,
                'has_id_card' => filled($partner?->id_card_photo_path),
                'has_driver_license' => filled($partner?->driver_license_photo_path),
                'id_number' => $partner?->id_number,
                'license_number' => $partner?->license_number,
            ],
            'activeRentals' => $activeRentals,
            'recentRentals' => $recentRentals,
            'stats' => [
                'total' => $totalRentalsCount,
                'active' => $activeRentals->count(),
                'pending_action' => $activeRentals->where('status', Rental::STATUS_PENDING_RESERVED)->count(),
            ],
            'holdTtlMinutes' => app(RentalBookingPolicy::class)->pendingReservedTtlMinutes(),
        ]);
    }

    public function rentals(Request $request): Response
    {
        $customer = $this->activeCustomer();
        $partner = $customer->partner;
        $tab = $request->query('tab', 'all');

        $query = Rental::query()
            ->where('partner_id', $partner?->id ?? 0)
            ->with(['vehicle:id,name,plate_number,photo_url,rental_class_label', 'pickupLocation:id,name', 'returnLocation:id,name'])
            ->latest();

        if ($tab === 'active') {
            $query->whereIn('status', [
                Rental::STATUS_PENDING,
                Rental::STATUS_PENDING_RESERVED,
                Rental::STATUS_CONFIRMED,
                Rental::STATUS_ACTIVE,
            ]);
        } elseif ($tab === 'completed') {
            $query->where('status', Rental::STATUS_COMPLETED);
        } elseif ($tab === 'cancelled') {
            $query->whereIn('status', [Rental::STATUS_CANCELLED, Rental::STATUS_ABANDONED]);
        }

        $rentals = $query->paginate(10)->withQueryString();

        return Inertia::render('Modules/Rental/Public/Customer/Rentals', [
            'brand' => $this->brand(),
            'customer' => $customer->only(['id', 'name', 'phone']),
            'rentals' => $rentals,
            'currentTab' => $tab,
        ]);
    }

    public function showRental(string $code): Response
    {
        $customer = $this->activeCustomer();
        $partner = $customer->partner;

        $rental = Rental::query()
            ->where('code', $code)
            ->where('partner_id', $partner?->id ?? 0)
            ->with([
                'vehicle:id,name,plate_number,photo_url,rental_class_label,capacity_seats,fuel_label,model_year',
                'pickupLocation:id,name,address,city',
                'returnLocation:id,name,address,city',
                'insurancePackage:id,name,amount',
                'charges' => fn ($q) => $q->where('kind', RentalCharge::KIND_ADDON)->orderBy('id'),
            ])
            ->firstOrFail();

        return Inertia::render('Modules/Rental/Public/Customer/RentalDetail', [
            'brand' => $this->brand(),
            'customer' => $customer->only(['id', 'name', 'phone']),
            'rental' => $rental,
            'holdTtlMinutes' => app(RentalBookingPolicy::class)->pendingReservedTtlMinutes(),
            'gatewayAvailable' => app(GatewayCheckoutService::class)->isConfigured(),
        ]);
    }

    public function documents(): Response
    {
        $customer = $this->activeCustomer();
        $partner = $customer->partner;

        return Inertia::render('Modules/Rental/Public/Customer/Documents', [
            'brand' => $this->brand(),
            'customer' => $customer->only(['id', 'name', 'phone']),
            'ocrEnabled' => CentralAiSettings::isOcrEnabled() && RentalGeneralSettings::all()['ai_kyc_enabled'],
            'partner' => [
                'kyc_status' => $partner?->kyc_status ?? Partner::KYC_STATUS_UNVERIFIED,
                'kyc_rejected_reason' => $partner?->kyc_rejected_reason,
                'id_number' => $partner?->id_number,
                'license_number' => $partner?->license_number,
                'id_card_photo_path' => $partner?->id_card_photo_path,
                'driver_license_photo_path' => $partner?->driver_license_photo_path,
                'id_card_url' => app(\Modules\Rental\Support\RentalPassengerDocMedia::class)->publicUrl($partner?->id_card_photo_path),
                'driver_license_url' => app(\Modules\Rental\Support\RentalPassengerDocMedia::class)->publicUrl($partner?->driver_license_photo_path),
                'selfie_photo_path' => $partner?->selfie_photo_path,
                'emergency_contact_name' => $partner?->emergency_contact_name,
                'emergency_contact_phone' => $partner?->emergency_contact_phone,
            ],
        ]);
    }

    public function scanDocument(Request $request, DocumentKycServiceInterface $kycService): JsonResponse
    {
        if (! CentralAiSettings::isOcrEnabled() || ! RentalGeneralSettings::all()['ai_kyc_enabled']) {
            return response()->json([
                'success' => false,
                'message' => __('rental.ai.feature_disabled', ['feature' => 'AI OCR Dokumen']),
            ], 403);
        }

        $request->validate([
            'image' => ['nullable'],
            'file' => ['nullable', 'file', 'mimes:jpeg,png,jpg,webp', 'max:10240'],
            'doc_type' => ['nullable', 'string', 'in:ktp,sim,auto'],
            'source' => ['nullable', 'string', 'in:upload,saved_ktp,saved_sim'],
        ]);

        $customer = $this->activeCustomer();
        $partner = $customer->partner;

        $imageSource = null;
        if ($request->hasFile('file')) {
            $imageSource = $request->file('file')->getRealPath();
        } elseif ($request->hasFile('image')) {
            $imageSource = $request->file('image')->getRealPath();
        } elseif ($request->filled('image')) {
            $imageSource = (string) $request->input('image');
        } elseif ($request->input('source') === 'saved_ktp' && filled($partner?->id_card_photo_path)) {
            $imageSource = (string) $partner->id_card_photo_path;
        } elseif ($request->input('source') === 'saved_sim' && filled($partner?->driver_license_photo_path)) {
            $imageSource = (string) $partner->driver_license_photo_path;
        }

        if (blank($imageSource)) {
            return response()->json([
                'success' => false,
                'message' => __('rental.ai.no_documents_uploaded'),
            ], 422);
        }

        try {
            $extracted = $kycService->scanSingleDocument(
                imageSource: $imageSource,
                docType: $request->input('doc_type', 'auto'),
            );

            return response()->json([
                'success' => true,
                'result' => $extracted,
                'message' => __('rental.ai.ocr_success'),
            ]);
        } catch (\Throwable $e) {
            Log::error('[CustomerPortal OCR] '.$e->getMessage(), ['exception' => $e]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function updateDocuments(Request $request): RedirectResponse
    {
        $customer = $this->activeCustomer();
        $partner = $customer->partner;

        abort_if($partner === null, 404);

        $validated = $request->validate([
            'id_number' => ['nullable', 'string', 'max:50'],
            'license_number' => ['nullable', 'string', 'max:50'],
            'id_card_photo_path' => ['nullable', 'string', 'max:2048'],
            'driver_license_photo_path' => ['nullable', 'string', 'max:2048'],
            'ktp' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:10240'],
            'sim' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:10240'],
            'emergency_contact_name' => ['nullable', 'string', 'max:100'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:50'],
        ]);

        if ($request->hasFile('ktp')) {
            $file = $request->file('ktp');
            $ext = strtolower($file->getClientOriginalExtension() ?: 'jpg');
            $path = 'rental/partner-kyc/'.$partner->id.'/ktp-'.Str::uuid().'.'.$ext;
            Storage::disk('public')->put($path, file_get_contents($file->getRealPath()) ?: '');
            $validated['id_card_photo_path'] = $path;
        }

        if ($request->hasFile('sim')) {
            $file = $request->file('sim');
            $ext = strtolower($file->getClientOriginalExtension() ?: 'jpg');
            $path = 'rental/partner-kyc/'.$partner->id.'/sim-'.Str::uuid().'.'.$ext;
            Storage::disk('public')->put($path, file_get_contents($file->getRealPath()) ?: '');
            $validated['driver_license_photo_path'] = $path;
        }

        unset($validated['ktp'], $validated['sim']);

        $partner->update([
            ...$validated,
            'kyc_status' => Partner::KYC_STATUS_PENDING,
            'kyc_submitted_at' => now(),
            'kyc_rejected_reason' => null,
        ]);

        try {
            $staffUsers = \App\Models\User::query()
                ->get()
                ->filter(fn (\App\Models\User $u) => $u->isAdmin() || $u->hasPermissionFor('partners', 'update'));

            if ($staffUsers->isNotEmpty()) {
                \Illuminate\Support\Facades\Notification::send(
                    $staffUsers,
                    new \App\Notifications\GenericNotification(
                        title: 'Verifikasi KYC Baru',
                        body: "Pelanggan {$partner->name} ({$partner->code}) telah mengunggah dokumen KTP/SIM yang memerlukan verifikasi.",
                        url: route('module.partners.show', $partner->id),
                        icon: 'id-card',
                        type: 'warning',
                    )
                );
            }
        } catch (\Throwable $e) {
            Log::warning('[CustomerPortal] Gagal mengirim notifikasi KYC ke staff: '.$e->getMessage());
        }

        return back()->with('success', 'Dokumen identitas berhasil diperbarui dan sedang menunggu verifikasi.');
    }

    public function profile(): Response
    {
        $customer = $this->activeCustomer();

        return Inertia::render('Modules/Rental/Public/Customer/Profile', [
            'brand' => $this->brand(),
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'email' => $customer->email,
                'has_password' => filled($customer->password),
                'created_at' => $customer->created_at?->toFormattedDateString(),
            ],
        ]);
    }

    public function updateProfile(Request $request): RedirectResponse
    {
        $customer = $this->activeCustomer();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
        ]);

        $customer->update($validated);

        if ($customer->partner !== null) {
            $customer->partner->update([
                'name' => $validated['name'],
                'email' => $validated['email'] ?? $customer->partner->email,
            ]);
        }

        return back()->with('success', 'Profil Anda berhasil diperbarui.');
    }

    public function updatePassword(Request $request): RedirectResponse
    {
        $customer = $this->activeCustomer();

        $rules = [
            'password' => ['required', 'confirmed', Password::defaults()],
        ];

        if (filled($customer->password)) {
            $rules['current_password'] = ['required', 'current_password:customer'];
        }

        $validated = $request->validate($rules);

        $customer->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back()->with('success', 'Kata sandi berhasil diperbarui.');
    }

    private function activeCustomer(): Customer
    {
        /** @var Customer $customer */
        $customer = Auth::guard('customer')->user();
        abort_if($customer === null, 401);

        $customer->loadMissing('partner');

        return $customer;
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
