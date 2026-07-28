<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Response;
use Modules\Accounting\Http\Requests\StoreFixedAssetRequest;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\FiscalPeriod;
use Modules\Accounting\Models\FixedAsset;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Accounting\Support\FixedAssetService;

class FixedAssetController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(): Response
    {
        $assets = FixedAsset::query()
            ->with(['assetAccount:id,code,name'])
            ->orderBy('code')
            ->get()
            ->map(fn (FixedAsset $asset): array => [
                'id' => $asset->id,
                'code' => $asset->code,
                'name' => $asset->name,
                'category' => $asset->category,
                'acquisition_date' => $asset->acquisition_date->toDateString(),
                'acquisition_cost' => (float) $asset->acquisition_cost,
                'accumulated_depreciation' => (float) $asset->accumulated_depreciation,
                'book_value' => $asset->bookValue(),
                'status' => $asset->status,
                'last_depreciated_on' => $asset->last_depreciated_on?->toDateString(),
                'asset_account' => $asset->assetAccount
                    ? ['code' => $asset->assetAccount->code, 'name' => $asset->assetAccount->name]
                    : null,
            ]);

        return inertia('Modules/Accounting/FixedAssets/Index', [
            'assets' => $assets,
            'periods' => FiscalPeriod::query()->orderByDesc('starts_on')->limit(24)->get(['id', 'name']),
            'can' => [
                'manage' => auth()->user()?->hasPermissionFor('accounting', 'manage_assets') ?? false,
            ],
        ]);
    }

    public function create(): Response
    {
        return inertia('Modules/Accounting/FixedAssets/Create', [
            'accounts' => Account::query()
                ->where('is_postable', true)
                ->where('is_active', true)
                ->orderBy('code')
                ->get(['id', 'code', 'name', 'type', 'system_role']),
        ]);
    }

    public function store(StoreFixedAssetRequest $request, FixedAssetService $service): RedirectResponse
    {
        $service->create($request->validated(), auth()->id());

        return redirect()
            ->route($this->getRoutePrefix().'.accounting.fixed-assets.index')
            ->with('success', __('accounting.messages.fa_created'));
    }

    public function depreciate(
        Request $request,
        FixedAssetService $service,
        FiscalCalendarService $calendar,
    ): RedirectResponse {
        $validated = $request->validate([
            'period_id' => ['required', 'integer', 'exists:fiscal_periods,id'],
            'fixed_asset_id' => ['nullable', 'integer', 'exists:fixed_assets,id'],
        ]);

        $period = FiscalPeriod::query()->findOrFail($validated['period_id']);

        try {
            if (! empty($validated['fixed_asset_id'])) {
                $asset = FixedAsset::query()->findOrFail($validated['fixed_asset_id']);
                $service->depreciateForPeriod($asset, $period, auth()->id());
                $message = __('accounting.messages.fa_depreciated');
            } else {
                $count = $service->depreciateAllForPeriod($period, auth()->id());
                $message = __('accounting.messages.fa_depreciated_bulk', ['count' => $count]);
            }
        } catch (ValidationException $e) {
            throw $e;
        }

        return back()->with('success', $message);
    }
}
