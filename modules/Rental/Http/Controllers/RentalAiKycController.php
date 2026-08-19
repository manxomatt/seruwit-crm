<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Modules\Rental\AI\Contracts\DocumentKycServiceInterface;
use Modules\Rental\Models\Rental;
use Modules\Rental\Support\RentalGeneralSettings;
use Throwable;

class RentalAiKycController extends Controller
{
    public function __construct(
        protected DocumentKycServiceInterface $kycService,
    ) {}

    /**
     * Run AI KYC analysis on saved KTP & SIM documents for a rental.
     */
    public function scanRentalDocuments(Request $request, Rental $rental): JsonResponse|RedirectResponse
    {
        if (! RentalGeneralSettings::all()['ai_kyc_enabled']) {
            $message = 'Fitur AI Smart KYC dinonaktifkan dalam pengaturan rental.';
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $message], 403);
            }

            return back()->with('error', $message);
        }

        if (blank($rental->passenger_ktp_path) && blank($rental->passenger_sim_path)) {
            $message = __('rental.ai.no_documents_uploaded');
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $message], 422);
            }

            return back()->with('error', $message);
        }

        try {
            $result = $this->kycService->analyzeRentalKyc($rental);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'assessment' => $result->toArray(),
                    'message' => __('rental.ai.kyc_success'),
                ]);
            }

            return back()->with('success', __('rental.ai.kyc_success'));
        } catch (Throwable $e) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
            }

            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Scan a single document (KTP or SIM) from base64 data-URL or uploaded file for quick auto-fill.
     */
    public function scanSingleDocument(Request $request): JsonResponse
    {
        if (! RentalGeneralSettings::all()['ai_kyc_enabled']) {
            return response()->json([
                'success' => false,
                'message' => 'Fitur AI Smart KYC dinonaktifkan dalam pengaturan rental.',
            ], 403);
        }

        $request->validate([
            'image' => ['required', 'string'],
            'doc_type' => ['nullable', 'string', 'in:ktp,sim,auto'],
        ]);

        try {
            $extracted = $this->kycService->scanSingleDocument(
                imageSource: $request->input('image'),
                docType: $request->input('doc_type', 'auto'),
            );

            return response()->json([
                'success' => true,
                'result' => $extracted,
                'message' => __('rental.ai.ocr_success'),
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Synchronize extracted KYC identity (NIK, SIM number, expiry) to Partner master record.
     */
    public function syncToPartner(Request $request, Rental $rental): JsonResponse|RedirectResponse
    {
        $rental->loadMissing('partner');
        $partner = $rental->partner;

        if (! $partner) {
            $message = 'Pelanggan tidak ditemukan pada data rental ini.';
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $message], 422);
            }

            return back()->with('error', $message);
        }

        $assessment = $rental->ai_kyc_assessment;
        if (! is_array($assessment)) {
            $message = 'Hasil verifikasi AI KYC belum tersedia.';
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $message], 422);
            }

            return back()->with('error', $message);
        }

        $updates = [];

        if (! empty($assessment['ktp']['nik']) && blank($partner->id_number)) {
            $updates['id_number'] = $assessment['ktp']['nik'];
        }

        if (! empty($assessment['sim']['license_number'])) {
            $updates['license_number'] = $assessment['sim']['license_number'];
        }

        if (! empty($assessment['sim']['expires_at'])) {
            $updates['license_expires_at'] = $assessment['sim']['expires_at'];
        }

        if ($updates !== []) {
            $partner->forceFill($updates)->save();
        }

        $message = __('rental.ai.sync_partner_success');

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'partner' => [
                    'id' => $partner->id,
                    'id_number' => $partner->id_number,
                    'license_number' => $partner->license_number,
                    'license_expires_at' => $partner->license_expires_at?->format('Y-m-d'),
                ],
                'message' => $message,
            ]);
        }

        return back()->with('success', $message);
    }
}
