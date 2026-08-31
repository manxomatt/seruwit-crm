<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\VehicleRentalClass;
use Modules\Rental\Http\Requests\StoreRentalRateRequest;
use Modules\Rental\Http\Requests\UpdateRentalRateRequest;
use Modules\Rental\Models\RentalRate;
use Modules\Rental\Support\RentalGeneralSettings;
use Modules\Rental\Support\RentalRateResolver;

class RentalRateController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(Request $request): Response
    {
        return Inertia::render('Modules/Rental/Rates/Index', [
            'rates' => RentalRate::query()
                ->with(['vehicle:id,name,plate_number,type', 'tiers'])
                ->orderBy('period_type')
                ->orderByDesc('priority')
                ->orderBy('name')
                ->paginate(15)
                ->withQueryString(),
            'vehicles' => Vehicle::query()
                ->where('status', Vehicle::STATUS_ACTIVE)
                ->orderBy('name')
                ->get(['id', 'name', 'plate_number', 'type']),
            'rentalClasses' => collect(VehicleRentalClass::values())
                ->map(fn (string $value): array => [
                    'value' => $value,
                    'label' => VehicleRentalClass::label($value),
                ])
                ->values()
                ->all(),
            'aiPricingOptimizerEnabled' => (bool) (RentalGeneralSettings::all()['ai_pricing_optimizer_enabled'] ?? true),
            'aiPricingAnalyzeUrl' => route($this->getRoutePrefix().'.rental.ai_pricing_analyze'),
            'aiPricingApplyUrl' => route($this->getRoutePrefix().'.rental.ai_pricing_apply'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Modules/Rental/Rates/Form', [
            'rate' => null,
            'vehicles' => Vehicle::query()
                ->where('status', Vehicle::STATUS_ACTIVE)
                ->orderBy('name')
                ->get(['id', 'name', 'plate_number', 'type']),
            'rentalClasses' => collect(VehicleRentalClass::values())
                ->map(fn (string $value): array => [
                    'value' => $value,
                    'label' => VehicleRentalClass::label($value),
                ])
                ->values()
                ->all(),
            'mode' => 'create',
            'aiPricingOptimizerEnabled' => (bool) (RentalGeneralSettings::all()['ai_pricing_optimizer_enabled'] ?? true),
            'aiPricingAnalyzeUrl' => route($this->getRoutePrefix().'.rental.ai_pricing_analyze'),
            'aiPricingApplyUrl' => route($this->getRoutePrefix().'.rental.ai_pricing_apply'),
        ]);
    }

    public function edit(RentalRate $rate): Response
    {
        $rate->load(['tiers', 'vehicle:id,name,plate_number,type']);

        return Inertia::render('Modules/Rental/Rates/Form', [
            'rate' => $rate,
            'vehicles' => Vehicle::query()
                ->where('status', Vehicle::STATUS_ACTIVE)
                ->orderBy('name')
                ->get(['id', 'name', 'plate_number', 'type']),
            'rentalClasses' => collect(VehicleRentalClass::values())
                ->map(fn (string $value): array => [
                    'value' => $value,
                    'label' => VehicleRentalClass::label($value),
                ])
                ->values()
                ->all(),
            'mode' => 'edit',
            'aiPricingOptimizerEnabled' => (bool) (RentalGeneralSettings::all()['ai_pricing_optimizer_enabled'] ?? true),
            'aiPricingAnalyzeUrl' => route($this->getRoutePrefix().'.rental.ai_pricing_analyze'),
            'aiPricingApplyUrl' => route($this->getRoutePrefix().'.rental.ai_pricing_apply'),
        ]);
    }

    public function suggest(Request $request, RentalRateResolver $resolver): JsonResponse
    {
        $data = $request->validate([
            'vehicle_id' => ['required', 'integer', 'exists:vehicles,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'period_type' => ['required', 'in:daily,weekly,monthly'],
        ]);

        $rate = $resolver->suggest(
            Vehicle::query()->find($data['vehicle_id']),
            $data['start_date'],
            $data['end_date'],
            $data['period_type'],
        );

        return response()->json([
            'rate' => $rate,
        ]);
    }

    public function aiGenerate(Request $request, \Modules\Rental\AI\Contracts\RentalRateAiGeneratorServiceInterface $generator): JsonResponse
    {
        $validated = $request->validate([
            'text' => ['required', 'string', 'max:2000'],
            'vehicles' => ['nullable', 'array'],
            'rentalClasses' => ['nullable', 'array'],
        ]);

        $vehicles = $validated['vehicles'] ?? Vehicle::query()
            ->where('status', Vehicle::STATUS_ACTIVE)
            ->get(['id', 'name', 'plate_number', 'type'])
            ->toArray();

        $rentalClasses = $validated['rentalClasses'] ?? collect(VehicleRentalClass::values())
            ->map(fn (string $value): array => [
                'value' => $value,
                'label' => VehicleRentalClass::label($value),
            ])
            ->values()
            ->all();

        $result = $generator->generateFromText(
            $validated['text'],
            $vehicles,
            $rentalClasses,
        );

        return response()->json([
            'success' => true,
            'data' => $result,
            'message' => __('rental.ai.rate_generate_success'),
        ]);
    }

    public function store(StoreRentalRateRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['deposit_amount'] = $data['deposit_amount'] ?? 0;
        $data['priority'] = $data['priority'] ?? 0;

        DB::transaction(function () use ($data): void {
            /** @var RentalRate $rate */
            $rate = RentalRate::create($data);
            $this->syncTiers($rate, $data['tiers'] ?? [], $data['tiers_to_delete'] ?? []);
        });

        return redirect()->route($this->getRoutePrefix().'.rental.rates.index')
            ->with('success', __('rental.messages.rate_created'));
    }

    /**
     * Aktifkan / Nonaktifkan banyak tarif sekaligus.
     */
    public function batchUpdateStatus(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:rental_rates,id'],
            'is_active' => ['required', 'boolean'],
        ]);

        /** @var list<int> $ids */
        $ids = array_map('intval', $validated['ids']);
        $isActive = (bool) $validated['is_active'];

        $updated = RentalRate::query()
            ->whereIn('id', $ids)
            ->update(['is_active' => $isActive]);

        $label = $isActive ? 'Aktif' : 'Non Aktif';

        return back()->with('success', __('rental.messages.rate_batch_status_updated', [
            'count' => $updated,
            'status' => $label,
        ]));
    }

    /**
     * Hapus banyak tarif sekaligus, lewati yang terhalang constraint.
     */
    public function batchDestroy(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:rental_rates,id'],
        ]);

        /** @var list<int> $ids */
        $ids = array_map('intval', $validated['ids']);

        $deleted = 0;
        $blocked = 0;

        $rates = RentalRate::query()->whereIn('id', $ids)->get();

        foreach ($rates as $rate) {
            try {
                DB::transaction(fn () => $rate->delete());
                $deleted++;
            } catch (QueryException) {
                $blocked++;
            }
        }

        if ($deleted === 0 && $blocked > 0) {
            return back()->with('error', __('rental.messages.rate_batch_delete_blocked', [
                'blocked' => $blocked,
            ]));
        }

        if ($blocked > 0) {
            return back()->with('warning', __('rental.messages.rate_batch_delete_partial', [
                'deleted' => $deleted,
                'blocked' => $blocked,
            ]));
        }

        return back()->with('success', __('rental.messages.rate_batch_deleted', [
            'count' => $deleted,
        ]));
    }

    public function update(UpdateRentalRateRequest $request, RentalRate $rate): RedirectResponse
    {
        $data = $request->validated();
        $data['deposit_amount'] = $data['deposit_amount'] ?? 0;
        $data['priority'] = $data['priority'] ?? 0;

        DB::transaction(function () use ($rate, $data): void {
            $rate->update($data);
            $this->syncTiers($rate, $data['tiers'] ?? [], $data['tiers_to_delete'] ?? []);
        });

        return redirect()->route($this->getRoutePrefix().'.rental.rates.index')
            ->with('success', __('rental.messages.rate_updated'));
    }

    public function destroy(RentalRate $rate): RedirectResponse
    {
        try {
            DB::transaction(fn () => $rate->delete());
        } catch (QueryException) {
            return back()->with('error', __('rental.messages.rate_delete_referenced'));
        }

        return back()->with('success', __('rental.messages.rate_deleted'));
    }

    /**
     * Sync tier rows: create baru, update existing, hapus ids yang masuk delete list.
     *
     * @param  list<array<string, mixed>>  $tiers
     * @param  list<int>  $toDeleteIds
     */
    protected function syncTiers(RentalRate $rate, array $tiers, array $toDeleteIds = []): void
    {
        if ($toDeleteIds !== []) {
            $idsToDelete = array_map('intval', $toDeleteIds);
            RentalRateTier::query()
                ->where('rental_rate_id', $rate->id)
                ->whereIn('id', $idsToDelete)
                ->delete();
        }

        foreach ($tiers as $tier) {
            $attrs = [
                'tier_type' => $tier['tier_type'],
                'min_threshold' => (int) $tier['min_threshold'],
                'max_threshold' => isset($tier['max_threshold']) && filled($tier['max_threshold']) ? (int) $tier['max_threshold'] : null,
                'rate_per_period' => filled($tier['rate_per_period'] ?? null) ? (float) $tier['rate_per_period'] : null,
                'discount_percent' => filled($tier['discount_percent'] ?? null) ? (float) $tier['discount_percent'] : null,
                'discount_flat' => filled($tier['discount_flat'] ?? null) ? (float) $tier['discount_flat'] : null,
                'priority' => (int) ($tier['priority'] ?? 0),
                'is_active' => (bool) ($tier['is_active'] ?? true),
            ];

            if (isset($tier['id']) && filled($tier['id'])) {
                $rate->tiers()
                    ->where('id', (int) $tier['id'])
                    ->update($attrs);
            } else {
                $rate->tiers()->create($attrs);
            }
        }
    }
}
