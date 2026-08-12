<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\VehicleRentalClass;
use Modules\Rental\Http\Requests\UpdateDocumentTemplateRequest;
use Modules\Rental\Http\Requests\UpdateRentalGeneralSettingsRequest;
use Modules\Rental\Models\RentalRate;
use Modules\Rental\Support\DocumentTemplateManager;
use Modules\Rental\Support\RentalGeneralSettings;

class RentalSettingsController extends Controller
{
    /** @var list<string> */
    public const TABS = ['general', 'rates', 'documents'];

    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(Request $request): InertiaResponse|RedirectResponse
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
                ->with(['vehicle:id,name,plate_number,type', 'tiers'])
                ->orderBy('period_type')
                ->orderByDesc('priority')
                ->orderBy('name')
                ->paginate(15)
                ->withQueryString()
                ->appends(['tab' => 'rates']),
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
            'documents' => DocumentTemplateManager::all(),
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

    public function updateDocument(UpdateDocumentTemplateRequest $request, string $code): RedirectResponse
    {
        if (! in_array($code, DocumentTemplateManager::VALID_CODES, true)) {
            return back()->with('error', __('rental.errors.document_template_invalid_code'));
        }

        $data = $request->validated();

        DocumentTemplateManager::update($code, $data);

        return back()->with('success', __('rental.messages.document_template_updated'));
    }

    public function resetDocument(Request $request, string $code): RedirectResponse
    {
        if (! in_array($code, DocumentTemplateManager::VALID_CODES, true)) {
            return back()->with('error', __('rental.errors.document_template_invalid_code'));
        }

        DocumentTemplateManager::reset($code);

        return back()->with('success', __('rental.messages.document_template_reset'));
    }
}
