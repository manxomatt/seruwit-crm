<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Http\Requests\StoreRentalRateRequest;
use Modules\Rental\Http\Requests\UpdateRentalRateRequest;
use Modules\Rental\Models\RentalRate;
use Modules\Rental\Support\RentalRateResolver;

class RentalRateController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(): RedirectResponse
    {
        return redirect()->route($this->getRoutePrefix() . '.rental.settings.index', ['tab' => 'rates']);
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

    public function store(StoreRentalRateRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['deposit_amount'] = $data['deposit_amount'] ?? 0;
        $data['priority'] = $data['priority'] ?? 0;

        RentalRate::create($data);

        return back()->with('success', __('rental.messages.rate_created'));
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
                DB::transaction(fn() => $rate->delete());
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

        $rate->update($data);

        return back()->with('success', __('rental.messages.rate_updated'));
    }

    public function destroy(RentalRate $rate): RedirectResponse
    {
        try {
            DB::transaction(fn() => $rate->delete());
        } catch (QueryException) {
            return back()->with('error', __('rental.messages.rate_delete_referenced'));
        }

        return back()->with('success', __('rental.messages.rate_deleted'));
    }
}
