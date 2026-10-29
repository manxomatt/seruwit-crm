<?php

namespace Modules\FleetCompliance\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Facades\Modules;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Document\Models\Document;
use Modules\Document\Models\DocumentType;
use Modules\Fleet\Models\FleetBase;
use Modules\Fleet\Models\Vehicle;
use Modules\FleetCompliance\Models\VehicleComplianceRenewal;
use Modules\Partners\Models\Partner;

class FleetComplianceController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Display the fleet compliance and document expiration board.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $statusFilter = $request->query('status', 'all'); // all, expired, expiring_soon, safe, incomplete
        $documentFilter = $request->query('document', 'all'); // all, stnk_annual, stnk_five_year, insurance, kir
        $homeBaseId = $request->query('home_base_id');
        $ownershipType = $request->query('ownership_type');

        $query = Vehicle::query()
            ->with([
                'homeBase:id,code,name',
                'partner:id,code,name,phone',
            ])
            ->whereIn('status', [Vehicle::STATUS_ACTIVE, Vehicle::STATUS_MAINTENANCE]);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('plate_number', 'ilike', "%{$search}%")
                    ->orWhere('name', 'ilike', "%{$search}%");
            });
        }

        if ($homeBaseId) {
            $query->where('home_base_id', $homeBaseId);
        }

        if ($ownershipType) {
            $query->where('ownership_type', $ownershipType);
        }

        $allVehicles = $query->orderBy('plate_number')->get();

        // Calculate KPI metrics across all active/maintenance vehicles
        $now = now()->startOfDay();
        $in30Days = $now->copy()->addDays(30);

        $expiredCount = 0;
        $expiringSoonCount = 0;
        $safeCount = 0;

        foreach ($allVehicles as $vehicle) {
            $summary = $vehicle->compliance_summary;
            $overall = $summary['overall'] ?? 'safe';

            if ($overall === 'expired') {
                $expiredCount++;
            } elseif ($overall === 'expiring_soon') {
                $expiringSoonCount++;
            } elseif ($overall === 'safe') {
                $safeCount++;
            }
        }

        // Apply in-memory status filter if specific status is requested
        $filteredVehicles = $allVehicles;
        if ($statusFilter !== 'all') {
            $filteredVehicles = $allVehicles->filter(function (Vehicle $v) use ($statusFilter) {
                return ($v->compliance_summary['overall'] ?? '') === $statusFilter;
            })->values();
        }

        // Apply document filter if requested
        if ($documentFilter !== 'all') {
            $filteredVehicles = $filteredVehicles->filter(function (Vehicle $v) use ($documentFilter) {
                $doc = $v->compliance_summary[$documentFilter] ?? null;

                return $doc && in_array($doc['status'], ['expired', 'expiring_soon'], true);
            })->values();
        }

        $recentRenewals = VehicleComplianceRenewal::query()
            ->with([
                'vehicle:id,plate_number,name,type',
                'partner:id,name',
                'creator:id,name',
            ])
            ->latest('renewal_date')
            ->limit(15)
            ->get();

        $bases = FleetBase::query()->orderBy('name')->get(['id', 'code', 'name']);
        $partners = Partner::query()->where('status', 'active')->orderBy('name')->get(['id', 'code', 'name']);

        return Inertia::render('Modules/FleetCompliance/Index', [
            'vehicles' => $filteredVehicles,
            'kpi' => [
                'total_monitored' => $allVehicles->count(),
                'expired_count' => $expiredCount,
                'expiring_soon_count' => $expiringSoonCount,
                'safe_count' => $safeCount,
            ],
            'recentRenewals' => $recentRenewals,
            'bases' => $bases,
            'partners' => $partners,
            'filters' => [
                'search' => $search ?? '',
                'status' => $statusFilter,
                'document' => $documentFilter,
                'home_base_id' => $homeBaseId ? (int) $homeBaseId : null,
                'ownership_type' => $ownershipType ?? '',
            ],
            'permissions' => [
                'update' => $request->user()?->hasPermissionFor('fleet-compliance', 'update')
                    || $request->user()?->hasPermissionFor('fleet', 'update'),
                'renew' => $request->user()?->hasPermissionFor('fleet-compliance', 'renew')
                    || $request->user()?->hasPermissionFor('fleet-compliance', 'update')
                    || $request->user()?->hasPermissionFor('fleet', 'update'),
            ],
        ]);
    }

    /**
     * Record a document renewal transaction and update the vehicle's expiration date.
     */
    public function renew(Request $request, Vehicle $vehicle): RedirectResponse
    {
        $validated = $request->validate([
            'document_type' => ['required', 'string', 'in:stnk_annual,stnk_five_year,insurance,kir'],
            'new_expires_at' => ['required', 'date'],
            'renewal_date' => ['required', 'date'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'payer' => ['required', 'string', 'in:tenant,owner,shared'],
            'insurance_provider' => ['nullable', 'string', 'max:100'],
            'insurance_policy_number' => ['nullable', 'string', 'max:100'],
            'insurance_type' => ['nullable', 'string', 'in:all_risk,tlo,comprehensive'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $previousExpiresAt = null;
        switch ($validated['document_type']) {
            case VehicleComplianceRenewal::TYPE_STNK_ANNUAL:
                $previousExpiresAt = $vehicle->stnk_expires_at;
                $vehicle->stnk_expires_at = $validated['new_expires_at'];
                break;
            case VehicleComplianceRenewal::TYPE_STNK_FIVE_YEAR:
                $previousExpiresAt = $vehicle->stnk_five_year_expires_at;
                $vehicle->stnk_five_year_expires_at = $validated['new_expires_at'];
                break;
            case VehicleComplianceRenewal::TYPE_INSURANCE:
                $previousExpiresAt = $vehicle->insurance_expires_at;
                $vehicle->insurance_expires_at = $validated['new_expires_at'];
                if (! empty($validated['insurance_provider'])) {
                    $vehicle->insurance_provider = $validated['insurance_provider'];
                }
                if (! empty($validated['insurance_policy_number'])) {
                    $vehicle->insurance_policy_number = $validated['insurance_policy_number'];
                }
                if (! empty($validated['insurance_type'])) {
                    $vehicle->insurance_type = $validated['insurance_type'];
                }
                break;
            case VehicleComplianceRenewal::TYPE_KIR:
                $previousExpiresAt = $vehicle->kir_expires_at;
                $vehicle->kir_expires_at = $validated['new_expires_at'];
                break;
        }

        DB::transaction(function () use ($vehicle, $validated, $previousExpiresAt): void {
            $vehicle->save();

            VehicleComplianceRenewal::create([
                'vehicle_id' => $vehicle->id,
                'document_type' => $validated['document_type'],
                'previous_expires_at' => $previousExpiresAt,
                'new_expires_at' => $validated['new_expires_at'],
                'renewal_date' => $validated['renewal_date'],
                'cost' => $validated['cost'] ?? 0,
                'payer' => $validated['payer'],
                'partner_id' => $vehicle->partner_id,
                'reference_number' => $validated['reference_number'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'created_by' => Auth::id(),
            ]);

            $this->syncDocumentRecord($vehicle, $validated);
        });

        return redirect()->back()->with('success', "Dokumen {$vehicle->plate_number} berhasil diperbarui.");
    }

    /**
     * Synchronize the vehicle compliance renewal with the central Document
     * control center so both views share a single source of truth.
     *
     * @param  array<string, mixed>  $validated
     */
    private function syncDocumentRecord(Vehicle $vehicle, array $validated): void
    {
        if (! Modules::available('document') || ! Schema::hasTable('document_types') || ! Schema::hasTable('documents')) {
            return;
        }

        $typeConfig = match ($validated['document_type']) {
            VehicleComplianceRenewal::TYPE_STNK_ANNUAL => [
                'key' => 'stnk',
                'name' => 'Pajak STNK Tahunan',
                'validity' => 365,
                'sort_order' => 1,
            ],
            VehicleComplianceRenewal::TYPE_STNK_FIVE_YEAR => [
                'key' => 'stnk_five_year',
                'name' => 'STNK 5 Tahunan (Plat Nomor)',
                'validity' => 1825,
                'sort_order' => 2,
            ],
            VehicleComplianceRenewal::TYPE_INSURANCE => [
                'key' => 'insurance',
                'name' => 'Polis Asuransi Kendaraan',
                'validity' => 365,
                'sort_order' => 3,
            ],
            VehicleComplianceRenewal::TYPE_KIR => [
                'key' => 'kir',
                'name' => 'Uji Berkala KIR',
                'validity' => 180,
                'sort_order' => 4,
            ],
            default => null,
        };

        if ($typeConfig === null) {
            return;
        }

        $documentType = DocumentType::query()->firstOrCreate(
            ['key' => $typeConfig['key']],
            [
                'entity_type' => DocumentType::ENTITY_VEHICLE,
                'name' => $typeConfig['name'],
                'is_required' => $typeConfig['key'] === 'stnk',
                'has_expiry' => true,
                'typical_validity_days' => $typeConfig['validity'],
                'reminder_days' => [30, 14, 7],
                'sort_order' => $typeConfig['sort_order'],
            ],
        );

        Document::query()
            ->where('documentable_type', 'vehicle')
            ->where('documentable_id', $vehicle->id)
            ->where('document_type_id', $documentType->id)
            ->delete();

        $documentNumber = $validated['reference_number']
            ?? ($validated['document_type'] === VehicleComplianceRenewal::TYPE_INSURANCE ? ($validated['insurance_policy_number'] ?? $vehicle->insurance_policy_number) : null);

        Document::query()->create([
            'document_type_id' => $documentType->id,
            'documentable_type' => 'vehicle',
            'documentable_id' => $vehicle->id,
            'document_number' => $documentNumber,
            'issued_at' => $validated['renewal_date'],
            'expires_at' => $validated['new_expires_at'],
            'notes' => $validated['notes'] ?? null,
            'uploaded_by' => Auth::id(),
        ]);
    }
}
