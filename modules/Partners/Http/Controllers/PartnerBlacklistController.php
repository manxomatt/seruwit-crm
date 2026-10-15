<?php

namespace Modules\Partners\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Partners\Models\Partner;
use Modules\Partners\Models\PartnerBlacklist;
use Modules\Partners\Support\CustomerRiskService;

class PartnerBlacklistController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Show the form for creating a new blacklist record.
     */
    public function create(Request $request): Response
    {
        $partnerId = $request->query('partner_id');
        $selectedPartner = null;
        if ($partnerId) {
            $selectedPartner = Partner::query()->select('id', 'name', 'code', 'phone', 'id_number')->find($partnerId);
        }

        return Inertia::render('Modules/Partners/Blacklist/Create', [
            'partner' => $selectedPartner,
        ]);
    }

    /**
     * Display the Blacklist & Anti-Fraud Registry dashboard.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $category = $request->query('category', 'all');
        $severity = $request->query('severity', 'all');
        $status = $request->query('status', 'active'); // active, inactive, all

        $query = PartnerBlacklist::query()
            ->with(['partner:id,code,name,phone', 'reporter:id,name']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('id_number', 'ilike', "%{$search}%")
                    ->orWhere('phone', 'ilike', "%{$search}%")
                    ->orWhere('license_number', 'ilike', "%{$search}%")
                    ->orWhere('police_report_number', 'ilike', "%{$search}%")
                    ->orWhere('incident_details', 'ilike', "%{$search}%");
            });
        }

        if ($category !== 'all') {
            $query->where('category', $category);
        }

        if ($severity !== 'all') {
            $query->where('severity', $severity);
        }

        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        }

        $blacklists = $query->latest('id')->get();

        // Calculate KPI Metrics
        $allEntries = PartnerBlacklist::all();
        $metrics = [
            'total_cases' => $allEntries->count(),
            'theft_cases' => $allEntries->whereIn('category', [
                PartnerBlacklist::CATEGORY_CAR_THEFT,
                PartnerBlacklist::CATEGORY_PAWN_ATTEMPT,
            ])->count(),
            'bad_debt_cases' => $allEntries->where('category', PartnerBlacklist::CATEGORY_BAD_DEBT)->count(),
            'active_cases' => $allEntries->where('is_active', true)->count(),
        ];

        return Inertia::render('Modules/Partners/Blacklist/Index', [
            'blacklists' => $blacklists,
            'metrics' => $metrics,
            'filters' => [
                'search' => $search ?? '',
                'category' => $category,
                'severity' => $severity,
                'status' => $status,
            ],
        ]);
    }

    /**
     * Store a new blacklist record and sync partner status.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'id_number' => ['required', 'string', 'max:50'],
            'phone' => ['required', 'string', 'max:50'],
            'license_number' => ['nullable', 'string', 'max:50'],
            'category' => ['required', 'string', 'in:car_theft,pawn_attempt,bad_debt,fake_identity,reckless_damage,other'],
            'severity' => ['required', 'string', 'in:critical,warning,caution'],
            'incident_date' => ['nullable', 'date'],
            'incident_details' => ['required', 'string', 'max:2000'],
            'police_report_number' => ['nullable', 'string', 'max:100'],
            'partner_id' => ['nullable', 'exists:partners,id'],
        ]);

        $blacklist = PartnerBlacklist::create([
            'partner_id' => $validated['partner_id'] ?? null,
            'name' => $validated['name'],
            'id_number' => trim($validated['id_number']),
            'phone' => trim($validated['phone']),
            'license_number' => $validated['license_number'] ?? null,
            'category' => $validated['category'],
            'severity' => $validated['severity'],
            'incident_date' => $validated['incident_date'] ?? null,
            'incident_details' => $validated['incident_details'],
            'police_report_number' => $validated['police_report_number'] ?? null,
            'is_active' => true,
            'reported_by' => Auth::id(),
        ]);

        // Auto-link to matching partner if partner_id not provided
        $partner = null;
        if (! empty($validated['partner_id'])) {
            $partner = Partner::find($validated['partner_id']);
        } else {
            $cleanPhone = preg_replace('/[^0-9]/', '', $validated['phone']);
            $partner = Partner::query()
                ->where('id_number', trim($validated['id_number']))
                ->orWhere('phone', 'like', "%{$cleanPhone}%")
                ->first();

            if ($partner) {
                $blacklist->update(['partner_id' => $partner->id]);
            }
        }

        // Sync Partner model blacklist flag
        if ($partner) {
            $partner->update([
                'is_blacklisted' => true,
                'blacklist_reason' => $validated['incident_details'],
                'blacklisted_at' => now(),
            ]);
        }

        return redirect()->route($this->getRoutePrefix().'.partners.blacklist.index')
            ->with('success', "Identitas {$validated['name']} ({$validated['id_number']}) berhasil dimasukkan ke Daftar Hitam.");
    }

    /**
     * Update blacklist record details or toggle status.
     */
    public function update(Request $request, PartnerBlacklist $blacklist): RedirectResponse
    {
        $validated = $request->validate([
            'category' => ['sometimes', 'string', 'in:car_theft,pawn_attempt,bad_debt,fake_identity,reckless_damage,other'],
            'severity' => ['sometimes', 'string', 'in:critical,warning,caution'],
            'incident_date' => ['nullable', 'date'],
            'incident_details' => ['sometimes', 'string', 'max:2000'],
            'police_report_number' => ['nullable', 'string', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $blacklist->update($validated);

        // If deactivated and linked to partner, check if partner still has other active blacklists
        if (isset($validated['is_active']) && ! $validated['is_active'] && $blacklist->partner_id) {
            $hasOtherActive = PartnerBlacklist::query()
                ->where('partner_id', $blacklist->partner_id)
                ->where('is_active', true)
                ->where('id', '!=', $blacklist->id)
                ->exists();

            if (! $hasOtherActive) {
                $blacklist->partner?->update([
                    'is_blacklisted' => false,
                    'blacklist_reason' => null,
                    'blacklisted_at' => null,
                ]);
            }
        }

        return redirect()->back()->with('success', 'Data catatan daftar hitam berhasil diperbarui.');
    }

    /**
     * Delete a blacklist record and adjust partner flag if appropriate.
     */
    public function destroy(PartnerBlacklist $blacklist): RedirectResponse
    {
        $partnerId = $blacklist->partner_id;
        $name = $blacklist->name;
        $blacklist->delete();

        if ($partnerId) {
            $hasOtherActive = PartnerBlacklist::query()
                ->where('partner_id', $partnerId)
                ->where('is_active', true)
                ->exists();

            if (! $hasOtherActive) {
                Partner::where('id', $partnerId)->update([
                    'is_blacklisted' => false,
                    'blacklist_reason' => null,
                    'blacklisted_at' => null,
                ]);
            }
        }

        return redirect()->back()->with('success', "Catatan daftar hitam {$name} telah dihapus.");
    }

    /**
     * Live Ajax Risk Check API.
     */
    public function checkRisk(Request $request, CustomerRiskService $riskService): JsonResponse
    {
        $idNumber = $request->query('id_number') ?? $request->input('id_number');
        $phone = $request->query('phone') ?? $request->input('phone');
        $name = $request->query('name') ?? $request->input('name');
        $partnerId = $request->query('partner_id') ?? $request->input('partner_id');

        $result = $riskService->evaluate(
            idNumber: $idNumber,
            phone: $phone,
            name: $name,
            partnerId: $partnerId ? (int) $partnerId : null,
        );

        return response()->json($result);
    }
}
