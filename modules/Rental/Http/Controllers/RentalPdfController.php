<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response;
use Modules\Rental\Models\Rental;
use Modules\Rental\Support\RentalHandoverChecklist;

class RentalPdfController extends Controller
{
    /**
     * Rental agreement PDF — available once the booking is confirmed.
     */
    public function contract(Rental $rental): Response|RedirectResponse
    {
        if (in_array($rental->status, [Rental::STATUS_DRAFT, Rental::STATUS_CANCELLED], true)) {
            return back()->with('error', __('rental.errors.pdf_contract_confirmed_only'));
        }

        $rental->load([
            'vehicle:id,name,plate_number,type',
            'partner',
            'driver:id,name,phone',
            'charges' => fn ($query) => $query->where('kind', \Modules\Rental\Models\RentalCharge::KIND_ADDON)->orderBy('id'),
        ]);

        return Pdf::loadView('rental::contract', [
            'rental' => $rental,
            'company' => $this->company(),
            'checklistLabels' => $this->checklistLabels(),
        ])->stream("rental-contract-{$rental->code}.pdf");
    }

    /**
     * Handover berita acara — requires checkout; includes return section when returned.
     */
    public function handover(Rental $rental): Response|RedirectResponse
    {
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

        return Pdf::loadView('rental::handover', [
            'rental' => $rental,
            'company' => $this->company(),
            'checklistLabels' => $this->checklistLabels(),
        ])->stream("rental-handover-{$rental->code}.pdf");
    }

    /**
     * @return array{name: string, address: string, phone: string}
     */
    private function company(): array
    {
        return [
            'name' => Setting::getValue('general.site_name', config('app.name')),
            'address' => Setting::getValue('site.address', ''),
            'phone' => Setting::getValue('site.phone', ''),
        ];
    }

    /**
     * @return array<string, string>
     */
    private function checklistLabels(): array
    {
        $labels = [];

        foreach (RentalHandoverChecklist::itemKeys() as $key) {
            $labels[$key] = __('rental.checklist.items.'.$key);
        }

        return $labels;
    }
}
