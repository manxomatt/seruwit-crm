<?php

declare(strict_types=1);

namespace Modules\Rental\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalExtensionRequest;
use Modules\Rental\Support\RentalAccountingService;
use Modules\Rental\Support\RentalConfirmationService;
use Modules\Rental\Support\RentalExtensionService;
use Modules\Rental\Support\RentalPassengerDocMedia;
use Modules\Rental\Support\RentalWhatsAppNotifier;

class StaffApprovalApiController extends Controller
{
    /**
     * List rentals with pending manual transfer deposit proofs.
     */
    public function paymentProofs(Request $request, RentalPassengerDocMedia $docMedia): JsonResponse
    {
        $rentals = Rental::query()
            ->where('deposit_proof_status', Rental::PROOF_PENDING)
            ->with(['partner', 'vehicle', 'depositCompanyBankAccount'])
            ->latest('deposit_proof_uploaded_at')
            ->limit(50)
            ->get();

        $data = $rentals->map(function (Rental $r) use ($docMedia): array {
            $amount = (float) ($r->deposit_amount > 0 ? $r->deposit_amount : $r->total_amount);
            $proofUrl = $r->deposit_proof_path ? $docMedia->publicUrl($r->deposit_proof_path) : null;

            return [
                'id' => $r->id,
                'booking_number' => $r->booking_number,
                'customer_name' => $r->partner?->name ?? $r->booker_name ?? '-',
                'customer_phone' => $r->partner?->phone ?? $r->booker_phone ?? '-',
                'vehicle_name' => $r->vehicle?->name ?? '-',
                'vehicle_plate' => $r->vehicle?->license_plate ?? '-',
                'amount' => $amount,
                'payment_type' => (float) $r->deposit_amount > 0 ? 'deposit' : 'full',
                'bank_target' => $r->depositCompanyBankAccount
                    ? "{$r->depositCompanyBankAccount->bank_name} - {$r->depositCompanyBankAccount->account_number} ({$r->depositCompanyBankAccount->account_holder})"
                    : null,
                'proof_image_url' => $proofUrl,
                'uploaded_at' => $r->deposit_proof_uploaded_at?->toIso8601String(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Confirm a customer's manual transfer payment proof.
     */
    public function confirmPayment(
        Request $request,
        Rental $rental,
        RentalConfirmationService $confirmation,
        RentalAccountingService $accounting
    ): JsonResponse {
        if ($rental->deposit_proof_status !== Rental::PROOF_PENDING) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'DEPOSIT_PROOF_NOT_PENDING',
                    'message' => __('rental.errors.deposit_proof_not_pending', ['default' => 'Bukti transfer tidak dalam status menunggu verifikasi.']),
                ],
            ], 422);
        }

        $rental->update([
            'deposit_proof_status' => Rental::PROOF_APPROVED,
            'deposit_proof_approved_at' => now(),
            'deposit_proof_approved_by' => $request->user()?->id,
        ]);

        $accounting->receiveDeposit($rental, [
            'payment_method' => $rental->deposit_payment_method ?? 'transfer',
            'company_bank_account_id' => $rental->deposit_company_bank_account_id,
        ]);

        if (in_array($rental->status, [Rental::STATUS_PENDING, Rental::STATUS_PENDING_RESERVED, Rental::STATUS_DRAFT], true)) {
            $confirmation->confirmAfterPaymentIfPending($rental->fresh());
        }

        if ((float) $rental->deposit_amount <= 0 || in_array($rental->status, [Rental::STATUS_ACTIVE, Rental::STATUS_CONFIRMED], true)) {
            $accounting->payRentalInvoicesFromProof($rental->fresh());
        }

        return response()->json([
            'success' => true,
            'data' => [
                'rental_id' => $rental->id,
                'booking_number' => $rental->booking_number,
                'status' => $rental->fresh()->status,
                'confirmed_at' => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Reject a customer's manual transfer payment proof.
     */
    public function rejectPayment(Request $request, Rental $rental): JsonResponse
    {
        if ($rental->deposit_proof_status !== Rental::PROOF_PENDING) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'DEPOSIT_PROOF_NOT_PENDING',
                    'message' => __('rental.errors.deposit_proof_not_pending', ['default' => 'Bukti transfer tidak dalam status menunggu verifikasi.']),
                ],
            ], 422);
        }

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $rental->update([
            'deposit_proof_status' => Rental::PROOF_REJECTED,
            'deposit_proof_rejected_reason' => $validated['reason'],
        ]);

        return response()->json([
            'success' => true,
            'message' => __('rental.messages.deposit_proof_rejected', ['default' => 'Bukti pembayaran berhasil ditolak.']),
        ]);
    }

    /**
     * List pending rental extension requests from customers.
     */
    public function extensions(Request $request): JsonResponse
    {
        $requests = RentalExtensionRequest::query()
            ->where('status', RentalExtensionRequest::STATUS_PENDING)
            ->with(['rental.vehicle', 'rental.partner'])
            ->latest('id')
            ->limit(50)
            ->get();

        $data = $requests->map(fn (RentalExtensionRequest $req): array => [
            'id' => $req->id,
            'rental_id' => $req->rental_id,
            'booking_number' => $req->rental?->booking_number,
            'customer_name' => $req->rental?->partner?->name ?? $req->rental?->booker_name,
            'customer_phone' => $req->rental?->partner?->phone ?? $req->rental?->booker_phone,
            'vehicle_name' => $req->rental?->vehicle?->name,
            'vehicle_plate' => $req->rental?->vehicle?->license_plate,
            'current_end_date' => $req->rental?->end_date?->toDateString(),
            'requested_end_date' => $req->requested_end_date?->toDateString(),
            'estimated_periods' => (int) $req->estimated_periods,
            'estimated_amount' => (float) $req->estimated_amount,
            'has_conflict' => (bool) $req->has_conflict,
            'notes' => $req->notes,
            'created_at' => $req->created_at?->toIso8601String(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Review and approve/reject an extension request.
     */
    public function reviewExtension(
        Request $request,
        RentalExtensionRequest $extensionRequest,
        RentalExtensionService $extensions
    ): JsonResponse {
        if ($extensionRequest->status !== RentalExtensionRequest::STATUS_PENDING) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'EXTENSION_NOT_PENDING',
                    'message' => 'Permintaan perpanjangan sewa ini sudah pernah diproses sebelumnya.',
                ],
            ], 422);
        }

        $validated = $request->validate([
            'action' => ['required', 'string', 'in:approve,reject'],
            'staff_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $rental = $extensionRequest->rental;

        if ($validated['action'] === 'approve') {
            $extensions->approveRequest(
                $extensionRequest,
                reviewedBy: $request->user()?->id,
                staffNotes: $validated['staff_notes'] ?? null,
            );

            if (class_exists(RentalWhatsAppNotifier::class) && $rental) {
                try {
                    app(RentalWhatsAppNotifier::class)->sendExtensionApproved($rental->fresh(), $extensionRequest->fresh());
                } catch (\Throwable) {
                    // Non-fatal if whatsapp notification fails
                }
            }

            return response()->json([
                'success' => true,
                'message' => __('rental.messages.extend_request_approved', ['default' => 'Permintaan perpanjangan sewa disetujui.']),
                'data' => [
                    'id' => $extensionRequest->id,
                    'status' => 'approved',
                    'new_end_date' => $rental?->fresh()->end_date?->toDateString(),
                ],
            ]);
        }

        $extensions->rejectRequest(
            $extensionRequest,
            reviewedBy: $request->user()?->id,
            staffNotes: $validated['staff_notes'] ?? null,
        );

        return response()->json([
            'success' => true,
            'message' => 'Permintaan perpanjangan sewa ditolak.',
            'data' => [
                'id' => $extensionRequest->id,
                'status' => 'rejected',
            ],
        ]);
    }
}
