<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response;
use Modules\Rental\Models\Rental;
use Modules\Rental\Support\DocumentTemplateManager;
use Modules\Rental\Support\RentalHandoverChecklist;

class RentalPdfController extends Controller
{
    public function contract(Rental $rental): Response|RedirectResponse
    {
        $this->ensureAccessibleRental($rental);

        if (in_array($rental->status, [Rental::STATUS_DRAFT, Rental::STATUS_CANCELLED], true)) {
            return back()->with('error', __('rental.errors.pdf_contract_confirmed_only'));
        }

        $rental->load([
            'vehicle:id,name,plate_number,type',
            'partner',
            'driver:id,name,phone',
            'insurancePackage',
            'charges' => fn ($query) => $query->where('kind', \Modules\Rental\Models\RentalCharge::KIND_ADDON)->orderBy('id'),
        ]);

        $template = DocumentTemplateManager::resolveForPdf(DocumentTemplateManager::CODE_CONTRACT, [
            'rental' => $rental,
            'partner' => $rental->partner,
            'vehicle' => $rental->vehicle,
            'company' => $this->company(),
        ]);

        $customerSigPath = $rental->contract_signature_path
            ?: ($rental->pickup_customer_signature_path ?: ($rental->checkout_signature_path ?: $rental->return_signature_path));

        $customerSignatureBase64 = $this->resolveSignatureBase64($customerSigPath);
        $staffSignatureBase64 = $this->resolveSignatureBase64($rental->checkout_signature_path);

        return Pdf::loadView('rental::contract', [
            'rental' => $rental,
            'company' => $this->company(),
            'checklistLabels' => $this->checklistLabels(),
            'template' => $template,
            'customerSignatureBase64' => $customerSignatureBase64,
            'staffSignatureBase64' => $staffSignatureBase64,
        ])->stream("rental-contract-{$rental->code}.pdf");
    }

    public function handover(Rental $rental): Response|RedirectResponse
    {
        $this->ensureAccessibleRental($rental);

        if (! in_array($rental->status, [
            Rental::STATUS_ACTIVE,
            Rental::STATUS_RETURNED,
            Rental::STATUS_COMPLETED,
        ], true)) {
            return back()->with('error', __('rental.errors.pdf_handover_checked_out_only'));
        }

        $rental->load([
            'vehicle:id,name,plate_number,type',
            'partner',
            'driver:id,name,phone',
            'damages',
        ]);

        $template = DocumentTemplateManager::resolveForPdf(DocumentTemplateManager::CODE_HANDOVER, [
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
        ]);

        $customerSigPath = $rental->contract_signature_path
            ?: ($rental->pickup_customer_signature_path ?: ($rental->return_signature_path ?: $rental->checkout_signature_path));

        $customerSignatureBase64 = $this->resolveSignatureBase64($customerSigPath);
        $staffSignatureBase64 = $this->resolveSignatureBase64($rental->checkout_signature_path);

        return Pdf::loadView('rental::handover', [
            'rental' => $rental,
            'company' => $this->company(),
            'checklistLabels' => $this->checklistLabels(),
            'template' => $template,
            'customerSignatureBase64' => $customerSignatureBase64,
            'staffSignatureBase64' => $staffSignatureBase64,
        ])->stream("rental-handover-{$rental->code}.pdf");
    }

    private function resolveSignatureBase64(?string $path): ?string
    {
        if (blank($path)) {
            return null;
        }

        if (str_starts_with($path, 'data:image/')) {
            return $path;
        }

        if (\Illuminate\Support\Facades\Storage::disk('public')->exists($path)) {
            $content = \Illuminate\Support\Facades\Storage::disk('public')->get($path);
            $mime = pathinfo($path, PATHINFO_EXTENSION) === 'png' ? 'image/png' : 'image/jpeg';

            return 'data:'.$mime.';base64,'.base64_encode($content);
        }

        return null;
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

    private function ensureAccessibleRental(Rental $rental): void
    {
        if (! \Modules\Fleet\Support\AccessibleFleetBases::allowsRental(auth()->user(), $rental)) {
            abort(403, __('rental.errors.rental_access_denied'));
        }
    }
}
