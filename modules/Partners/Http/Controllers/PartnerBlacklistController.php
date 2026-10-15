<?php

namespace Modules\Partners\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Partners\Models\CommunityBlacklist;
use Modules\Partners\Models\Partner;
use Modules\Partners\Models\PartnerBlacklist;
use Modules\Partners\Services\CommunityBlacklistSyncService;
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
            'partners' => Partner::query()->select('id', 'name', 'code', 'phone', 'id_number')->orderBy('name')->get(),
        ]);
    }

    /**
     * Display the Blacklist & Anti-Fraud Registry dashboard.
     */
    public function index(Request $request): Response
    {
        $tab = $request->query('tab', 'local'); // 'local' or 'community'
        $search = $request->query('search');
        $category = $request->query('category', 'all');
        $severity = $request->query('severity', 'all');
        $status = $request->query('status', 'active'); // active, inactive, all

        $currentTenantId = function_exists('tenant') && tenant() ? (string) tenant('id') : null;

        // Local Blacklist Query
        $localQuery = PartnerBlacklist::query()
            ->with(['partner:id,code,name,phone', 'reporter:id,name']);

        if ($search) {
            $localQuery->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('id_number', 'ilike', "%{$search}%")
                    ->orWhere('phone', 'ilike', "%{$search}%")
                    ->orWhere('license_number', 'ilike', "%{$search}%")
                    ->orWhere('police_report_number', 'ilike', "%{$search}%")
                    ->orWhere('incident_details', 'ilike', "%{$search}%");
            });
        }

        if ($category !== 'all') {
            $localQuery->where('category', $category);
        }

        if ($severity !== 'all') {
            $localQuery->where('severity', $severity);
        }

        if ($status === 'active') {
            $localQuery->where('is_active', true);
        } elseif ($status === 'inactive') {
            $localQuery->where('is_active', false);
        }

        $blacklists = $localQuery->latest('id')->get();

        // Community Blacklist Query (Shared Network)
        $communityQuery = CommunityBlacklist::query()->active();

        if ($search) {
            $communityQuery->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('id_number', 'ilike', "%{$search}%")
                    ->orWhere('phone', 'ilike', "%{$search}%")
                    ->orWhere('license_number', 'ilike', "%{$search}%")
                    ->orWhere('police_report_number', 'ilike', "%{$search}%")
                    ->orWhere('incident_details', 'ilike', "%{$search}%");
            });
        }

        if ($category !== 'all') {
            $communityQuery->where('category', $category);
        }

        if ($severity !== 'all') {
            $communityQuery->where('severity', $severity);
        }

        $communityBlacklists = $communityQuery->latest('id')->limit(100)->get()->map(function ($item) use ($currentTenantId) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'id_number' => $item->id_number,
                'phone' => $item->phone,
                'license_number' => $item->license_number,
                'category' => $item->category,
                'category_label' => $item->category_label,
                'severity' => $item->severity,
                'incident_date' => $item->incident_date?->toDateString(),
                'incident_details' => $item->incident_details,
                'police_report_number' => $item->police_report_number,
                'reporter_display' => $item->reporter_display,
                'is_own_tenant' => $currentTenantId && $item->tenant_id === $currentTenantId,
                'created_at' => $item->created_at?->toISOString(),
            ];
        });

        // Calculate Metrics
        $allLocalEntries = PartnerBlacklist::all();
        $metrics = [
            'total_cases' => $allLocalEntries->count(),
            'theft_cases' => $allLocalEntries->whereIn('category', [
                PartnerBlacklist::CATEGORY_CAR_THEFT,
                PartnerBlacklist::CATEGORY_PAWN_ATTEMPT,
            ])->count(),
            'bad_debt_cases' => $allLocalEntries->where('category', PartnerBlacklist::CATEGORY_BAD_DEBT)->count(),
            'active_cases' => $allLocalEntries->where('is_active', true)->count(),
            'community_total_cases' => CommunityBlacklist::query()->active()->count(),
            'my_shared_cases' => $allLocalEntries->where('is_shared_with_community', true)->count(),
        ];

        return Inertia::render('Modules/Partners/Blacklist/Index', [
            'tab' => $tab,
            'blacklists' => $blacklists,
            'community_blacklists' => $communityBlacklists,
            'metrics' => $metrics,
            'current_tenant_id' => $currentTenantId,
            'filters' => [
                'search' => $search ?? '',
                'category' => $category,
                'severity' => $severity,
                'status' => $status,
                'tab' => $tab,
            ],
        ]);
    }

    /**
     * Store a new blacklist record and sync partner status and community registry.
     */
    public function store(Request $request, CommunityBlacklistSyncService $syncService): RedirectResponse
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
            'is_shared_with_community' => ['nullable', 'boolean'],
            'share_anonymously' => ['nullable', 'boolean'],
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
            'is_shared_with_community' => (bool) ($validated['is_shared_with_community'] ?? false),
            'share_anonymously' => (bool) ($validated['share_anonymously'] ?? true),
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

        // Synchronize with Central Community Blacklist
        $syncService->sync($blacklist);

        return redirect()->route($this->getRoutePrefix().'.partners.blacklist.index')
            ->with('success', "Identitas {$validated['name']} ({$validated['id_number']}) berhasil dimasukkan ke Daftar Hitam.");
    }

    /**
     * Update blacklist record details or toggle status.
     */
    public function update(Request $request, PartnerBlacklist $blacklist, CommunityBlacklistSyncService $syncService): RedirectResponse
    {
        $validated = $request->validate([
            'category' => ['sometimes', 'string', 'in:car_theft,pawn_attempt,bad_debt,fake_identity,reckless_damage,other'],
            'severity' => ['sometimes', 'string', 'in:critical,warning,caution'],
            'incident_date' => ['nullable', 'date'],
            'incident_details' => ['sometimes', 'string', 'max:2000'],
            'police_report_number' => ['nullable', 'string', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
            'is_shared_with_community' => ['sometimes', 'boolean'],
            'share_anonymously' => ['sometimes', 'boolean'],
        ]);

        $blacklist->update($validated);

        // Synchronize with Central Community Blacklist
        $syncService->sync($blacklist);

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
    public function destroy(PartnerBlacklist $blacklist, CommunityBlacklistSyncService $syncService): RedirectResponse
    {
        $partnerId = $blacklist->partner_id;
        $name = $blacklist->name;

        // Synchronize deletion in Central Community Blacklist
        $syncService->delete($blacklist);

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
     * Import a community blacklist record into this tenant's local registry.
     */
    public function importFromCommunity(CommunityBlacklist $communityBlacklist): RedirectResponse
    {
        $existing = PartnerBlacklist::query()
            ->where('id_number', $communityBlacklist->id_number)
            ->first();

        if ($existing) {
            return redirect()->back()->with('error', "Identitas {$communityBlacklist->name} ({$communityBlacklist->id_number}) sudah ada di Blacklist Internal Anda.");
        }

        // Link to local partner if existing
        $cleanPhone = preg_replace('/[^0-9]/', '', $communityBlacklist->phone);
        $partner = Partner::query()
            ->where('id_number', $communityBlacklist->id_number)
            ->orWhere('phone', 'like', "%{$cleanPhone}%")
            ->first();

        PartnerBlacklist::create([
            'partner_id' => $partner?->id,
            'name' => $communityBlacklist->name,
            'id_number' => $communityBlacklist->id_number,
            'phone' => $communityBlacklist->phone,
            'license_number' => $communityBlacklist->license_number,
            'category' => $communityBlacklist->category,
            'severity' => $communityBlacklist->severity,
            'incident_date' => $communityBlacklist->incident_date,
            'incident_details' => "[Impor dari Komunitas Seruwit]\n".$communityBlacklist->incident_details,
            'police_report_number' => $communityBlacklist->police_report_number,
            'is_active' => true,
            'reported_by' => Auth::id(),
            'is_shared_with_community' => false, // Already in community
        ]);

        if ($partner) {
            $partner->update([
                'is_blacklisted' => true,
                'blacklist_reason' => $communityBlacklist->incident_details,
                'blacklisted_at' => now(),
            ]);
        }

        return redirect()->back()->with('success', "Identitas {$communityBlacklist->name} berhasil disalin ke Blacklist Internal Anda.");
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
