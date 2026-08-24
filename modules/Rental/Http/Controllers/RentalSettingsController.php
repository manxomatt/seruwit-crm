<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Modules\Invoicing\Models\Invoice;
use Modules\Rental\Http\Requests\UpdateDocumentTemplateRequest;
use Modules\Rental\Http\Requests\UpdateRentalGeneralSettingsRequest;
use Modules\Rental\Http\Requests\UpdateRentalStorefrontSettingsRequest;
use Modules\Rental\Http\Requests\UpdateRentalTestimonialsRequest;
use Modules\Rental\Models\Rental;
use Modules\Rental\Support\DocumentTemplateManager;
use Modules\Rental\Support\RentalGeneralSettings;
use Modules\Rental\Support\RentalHandoverChecklist;
use Modules\Rental\Support\RentalStorefrontSettings;
use Modules\Rental\Support\RentalTestimonials;

class RentalSettingsController extends Controller
{
    /** @var list<string> */
    public const TABS = ['general', 'storefront', 'testimonials', 'documents'];

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
            'storefront' => RentalStorefrontSettings::all(),
            'testimonials' => RentalTestimonials::all(),
            'documents' => DocumentTemplateManager::all(),
            'centralAiEnabled' => \App\Support\CentralAiSettings::isEnabled(),
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

    public function updateStorefront(UpdateRentalStorefrontSettingsRequest $request): RedirectResponse
    {
        RentalStorefrontSettings::update($request->validated());

        return back()->with('success', __('rental.messages.settings_updated'));
    }

    public function updateTestimonials(UpdateRentalTestimonialsRequest $request): RedirectResponse
    {
        RentalTestimonials::save($request->validated()['testimonials'] ?? []);

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

    public function previewDocument(Request $request, string $code): Response|RedirectResponse
    {
        if (! in_array($code, DocumentTemplateManager::VALID_CODES, true)) {
            return back()->with('error', __('rental.errors.document_template_invalid_code'));
        }

        $template = DocumentTemplateManager::get($code);

        if ($code === DocumentTemplateManager::CODE_INVOICE) {
            $invoice = Invoice::query()
                ->whereIn('status', [Invoice::STATUS_ISSUED, Invoice::STATUS_PAID])
                ->latest('issue_date')
                ->first();

            if (! $invoice) {
                return back()->with('error', __('rental.messages.document_template_preview_no_data'));
            }

            $invoice->load(['partner:id,code,name', 'lines']);

            $resolved = DocumentTemplateManager::resolveForPdf($code, [
                'invoice' => $invoice,
                'partner' => $invoice->partner,
                'company' => $this->company(),
            ]);

            return Pdf::loadView('invoicing::invoice', [
                'invoice' => $invoice,
                'company' => $this->company(),
                'currencySymbol' => Setting::getValue('ecommerce.currency_symbol', 'Rp'),
                'template' => $resolved,
            ])->stream("preview-{$code}.pdf");
        }

        $statuses = match ($code) {
            DocumentTemplateManager::CODE_CONTRACT => [
                Rental::STATUS_CONFIRMED,
                Rental::STATUS_ACTIVE,
                Rental::STATUS_RETURNED,
                Rental::STATUS_COMPLETED,
            ],
            DocumentTemplateManager::CODE_HANDOVER => [
                Rental::STATUS_ACTIVE,
                Rental::STATUS_RETURNED,
                Rental::STATUS_COMPLETED,
            ],
            default => [],
        };

        $rental = Rental::query()
            ->whereIn('status', $statuses)
            ->latest('created_at')
            ->first();

        if (! $rental) {
            return back()->with('error', __('rental.messages.document_template_preview_no_data'));
        }

        $rental->load([
            'vehicle:id,name,plate_number,type',
            'partner',
            'driver:id,name,phone',
            'insurancePackage',
            'charges' => fn ($query) => $query->where('kind', \Modules\Rental\Models\RentalCharge::KIND_ADDON)->orderBy('id'),
            'damages',
        ]);

        $context = [
            'rental' => $rental,
            'partner' => $rental->partner,
            'vehicle' => $rental->vehicle,
            'company' => $this->company(),
            'checkout' => [
                'time' => $rental->checked_out_at,
            ],
            'return' => [
                'time' => $rental->returned_at,
            ],
        ];

        $resolved = DocumentTemplateManager::resolveForPdf($code, $context);

        if ($code === DocumentTemplateManager::CODE_CONTRACT) {
            return Pdf::loadView('rental::contract', [
                'rental' => $rental,
                'company' => $this->company(),
                'checklistLabels' => $this->checklistLabels(),
                'template' => $resolved,
            ])->stream("preview-{$code}.pdf");
        }

        return Pdf::loadView('rental::handover', [
            'rental' => $rental,
            'company' => $this->company(),
            'checklistLabels' => $this->checklistLabels(),
            'template' => $resolved,
        ])->stream("preview-{$code}.pdf");
    }

    private function company(): array
    {
        return [
            'name' => Setting::getValue('general.site_name', config('app.name')),
            'address' => Setting::getValue('site.address', ''),
            'phone' => Setting::getValue('site.phone', ''),
        ];
    }

    private function checklistLabels(): array
    {
        $labels = [];

        foreach (RentalHandoverChecklist::itemKeys() as $key) {
            $labels[$key] = __('rental.checklist.items.'.$key);
        }

        return $labels;
    }
}
