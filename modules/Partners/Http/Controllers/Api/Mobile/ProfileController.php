<?php

namespace Modules\Partners\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Partners\Http\Requests\Mobile\UpdateProfileRequest;
use Modules\Partners\Http\Resources\Mobile\MobileProfileResource;
use Modules\Rental\Models\Rental;
use Modules\Rental\Support\MobilePassengerPartnerResolver;
use Modules\Shuttle\Models\ShuttleBooking;
use Modules\Shuttle\Support\MobilePassengerTokenService;

class ProfileController extends Controller
{
    public function show(Request $request, MobilePassengerPartnerResolver $partners): JsonResponse
    {
        $phone = $this->requirePassengerPhone($request);
        $partner = $partners->resolve($phone);

        return response()->json([
            'profile' => (new MobileProfileResource($partner))->resolve(),
        ]);
    }

    public function update(
        UpdateProfileRequest $request,
        MobilePassengerPartnerResolver $partners,
    ): JsonResponse {
        $phone = $this->requirePassengerPhone($request);
        $partner = $partners->resolve($phone);

        $data = [
            'name' => $request->string('name')->toString(),
            'email' => $request->filled('email') ? $request->string('email')->toString() : $partner->email,
            'address' => $request->input('address'),
            'emergency_contact_name' => $request->input('emergency_contact_name'),
            'emergency_contact_phone' => $request->input('emergency_contact_phone'),
            'emergency_contact_relationship' => $request->input('emergency_contact_relationship'),
        ];

        if ($request->hasFile('avatar')) {
            $data['picture_url'] = $request->file('avatar')->store('avatars', 'public');
        }

        $partner->update($data);

        return response()->json([
            'message' => __('partners.profile.updated_success', ['default' => 'Profile updated successfully.']),
            'profile' => (new MobileProfileResource($partner->fresh()))->resolve(),
        ]);
    }

    public function destroy(
        Request $request,
        MobilePassengerPartnerResolver $partners,
        MobilePassengerTokenService $tokens,
    ): JsonResponse {
        $phone = $this->requirePassengerPhone($request);
        $partner = $partners->findByPhone($phone);

        if ($partner !== null) {
            // Check active rentals
            if (class_exists(Rental::class)) {
                $hasActiveRental = Rental::query()
                    ->where(function ($q) use ($phone, $partner): void {
                        $q->where('booker_phone', $phone)
                            ->orWhere('partner_id', $partner->id);
                    })
                    ->whereIn('status', [
                        Rental::STATUS_DRAFT,
                        Rental::STATUS_PENDING,
                        Rental::STATUS_PENDING_RESERVED,
                        Rental::STATUS_CONFIRMED,
                        Rental::STATUS_ACTIVE,
                        Rental::STATUS_RETURNED,
                    ])
                    ->exists();

                if ($hasActiveRental) {
                    return response()->json([
                        'message' => __('partners.account.cannot_delete_active_rentals', [
                            'default' => 'Account cannot be deleted while you have active or ongoing rentals.',
                        ]),
                        'code' => 'active_rentals_exist',
                    ], 400);
                }
            }

            // Check active shuttle bookings
            if (class_exists(ShuttleBooking::class)) {
                $hasActiveShuttle = ShuttleBooking::query()
                    ->where(function ($q) use ($phone, $partner): void {
                        $q->where('passenger_phone', $phone)
                            ->orWhere('partner_id', $partner->id);
                    })
                    ->whereIn('status', [
                        ShuttleBooking::STATUS_DRAFT,
                        ShuttleBooking::STATUS_CONFIRMED,
                        ShuttleBooking::STATUS_BOARDED,
                    ])
                    ->exists();

                if ($hasActiveShuttle) {
                    return response()->json([
                        'message' => __('partners.account.cannot_delete_active_shuttle', [
                            'default' => 'Account cannot be deleted while you have active or upcoming shuttle trips.',
                        ]),
                        'code' => 'active_shuttle_exist',
                    ], 400);
                }
            }

            // Anonymize and soft delete partner
            $partner->update([
                'name' => 'Deleted User',
                'email' => null,
                'address' => null,
                'picture_url' => null,
                'id_number' => null,
                'license_number' => null,
                'id_card_photo_path' => null,
                'driver_license_photo_path' => null,
                'selfie_photo_path' => null,
                'emergency_contact_name' => null,
                'emergency_contact_phone' => null,
                'emergency_contact_relationship' => null,
                'status' => 'inactive',
            ]);

            $partner->delete();
        }

        // Revoke all tokens
        $tokens->revokeAllForPhone($phone);

        return response()->json([
            'ok' => true,
            'message' => __('partners.account.deleted_success', [
                'default' => 'Your account has been deleted successfully.',
            ]),
        ]);
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
