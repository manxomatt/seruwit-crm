<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\VehicleRentalClass;
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

    public function index(): Response
    {
        return Inertia::render('Modules/Rental/Rates/Index', [
            'rates' => RentalRate::query()
                ->with('vehicle:id,name,plate_number,type')
                ->orderBy('period_type')
                ->orderBy('name')
                ->get(),
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

    public function store(StoreRentalRateRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['deposit_amount'] = $data['deposit_amount'] ?? 0;
        $data['priority'] = $data['priority'] ?? 0;

        RentalRate::create($data);

        return back()->with('success', __('rental.messages.rate_created'));
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
        $rate->delete();

        return back()->with('success', __('rental.messages.rate_deleted'));
    }
}
