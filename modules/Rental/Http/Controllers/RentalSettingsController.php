<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\VehicleRentalClass;
use Modules\Rental\Http\Requests\UpdateRentalGeneralSettingsRequest;
use Modules\Rental\Models\RentalRate;
use Modules\Rental\Support\RentalGeneralSettings;

class RentalSettingsController extends Controller
{
    /** @var list<string> */
    public const TABS = ['general', 'rates'];

    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(Request $request): Response|RedirectResponse
    {
        if (! $request->has('tab')) {
            return redirect()->route($this->getRoutePrefix().'.rental.settings.index', ['tab' => 'general']);
        }

        $tab = $request->string('tab')->toString();
        if (! in_array($tab, self::TABS, true)) {
            $tab = 'general';
        }

        return Inertia::render('Modules/Rental/Settings/Index', [
            'tab' => $tab,
            'general' => RentalGeneralSettings::all(),
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

    public function updateGeneral(UpdateRentalGeneralSettingsRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['passenger_booking_enabled'] = $request->boolean('passenger_booking_enabled');
        $data['calendar_click_to_book'] = $request->boolean('calendar_click_to_book');

        RentalGeneralSettings::update($data);

        return back()->with('success', __('rental.messages.settings_updated'));
    }
}
