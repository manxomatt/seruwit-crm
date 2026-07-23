<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Http\Requests\StoreRentalRateRequest;
use Modules\Rental\Http\Requests\UpdateRentalRateRequest;
use Modules\Rental\Models\RentalRate;

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
        ]);
    }

    public function store(StoreRentalRateRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['deposit_amount'] = $data['deposit_amount'] ?? 0;

        RentalRate::create($data);

        return back()->with('success', 'Rate created.');
    }

    public function update(UpdateRentalRateRequest $request, RentalRate $rate): RedirectResponse
    {
        $data = $request->validated();
        $data['deposit_amount'] = $data['deposit_amount'] ?? 0;

        $rate->update($data);

        return back()->with('success', 'Rate updated.');
    }

    public function destroy(RentalRate $rate): RedirectResponse
    {
        $rate->delete();

        return back()->with('success', 'Rate deleted.');
    }
}
