<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\VehicleRentalClass;
use Modules\Rental\Models\RentalRate;

class RentalSettingsController extends Controller
{
    /** @var list<string> */
    public const TABS = ['rates'];

    public function index(Request $request): Response
    {
        $tab = $request->string('tab', 'rates')->toString();
        if (! in_array($tab, self::TABS, true)) {
            $tab = 'rates';
        }

        return Inertia::render('Modules/Rental/Settings/Index', [
            'tab' => $tab,
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
}
