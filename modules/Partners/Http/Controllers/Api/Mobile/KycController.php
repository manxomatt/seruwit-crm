<?php

namespace Modules\Partners\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Partners\Http\Requests\Mobile\SubmitKycRequest;
use Modules\Partners\Http\Resources\Mobile\MobileKycResource;
use Modules\Partners\Models\Partner;
use Modules\Rental\Support\MobilePassengerPartnerResolver;

class KycController extends Controller
{
    public function show(Request $request, MobilePassengerPartnerResolver $partners): JsonResponse
    {
        $phone = $this->requirePassengerPhone($request);
        $partner = $partners->resolve($phone);

        return response()->json([
            'kyc' => (new MobileKycResource($partner))->resolve(),
        ]);
    }

    public function submit(
        SubmitKycRequest $request,
        MobilePassengerPartnerResolver $partners,
    ): JsonResponse {
        $phone = $this->requirePassengerPhone($request);
        $partner = $partners->resolve($phone);

        $data = [
            'id_number' => $request->string('id_number')->toString(),
            'license_number' => $request->string('license_number')->toString(),
            'license_expires_at' => $request->date('license_expires_at')?->toDateString(),
            'emergency_contact_name' => $request->input('emergency_contact_name'),
            'emergency_contact_phone' => $request->input('emergency_contact_phone'),
            'emergency_contact_relationship' => $request->input('emergency_contact_relationship'),
            'kyc_status' => Partner::KYC_STATUS_PENDING,
            'kyc_submitted_at' => now(),
            'kyc_rejected_reason' => null,
        ];

        if ($request->hasFile('id_card_photo')) {
            $data['id_card_photo_path'] = $request->file('id_card_photo')->store('kyc/id_cards', 'public');
        }

        if ($request->hasFile('driver_license_photo')) {
            $data['driver_license_photo_path'] = $request->file('driver_license_photo')->store('kyc/driver_licenses', 'public');
        }

        if ($request->hasFile('selfie_photo')) {
            $data['selfie_photo_path'] = $request->file('selfie_photo')->store('kyc/selfies', 'public');
        }

        $partner->update($data);

        return response()->json([
            'message' => __('partners.kyc.submitted_success', ['default' => 'KYC documents submitted successfully. Please wait for verification.']),
            'kyc' => (new MobileKycResource($partner->fresh()))->resolve(),
        ], 200);
    }

    private function requirePassengerPhone(Request $request): string
    {
        $phone = $request->attributes->get('mobile_passenger_phone');

        if (! is_string($phone) || $phone === '') {
            abort(response()->json([
                'message' => 'Unauthenticated.',
                'code' => 'unauthenticated',
            ], 401));
        }

        return $phone;
    }
}
