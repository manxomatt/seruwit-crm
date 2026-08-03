<?php

namespace Modules\Maintenance\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;
use Modules\Maintenance\Models\WorkOrder;

class WorkOrderPdfController extends Controller
{
    public function jobCard(WorkOrder $workOrder): Response
    {
        $workOrder->load([
            'vehicle:id,name,plate_number',
            'category:id,name',
            'bay:id,code,name',
            'mechanic:id,name',
            'vendorPartner:id,name,code',
            'creator:id,name',
            'items',
            'checklistItems',
        ]);

        return Pdf::loadView('maintenance::job-card', [
            'workOrder' => $workOrder,
            'company' => [
                'name' => Setting::getValue('general.site_name', config('app.name')),
                'address' => Setting::getValue('site.address', ''),
                'phone' => Setting::getValue('site.phone', ''),
            ],
        ])
            ->setPaper('a5', 'portrait')
            ->stream("job-card-{$workOrder->reference_number}.pdf");
    }
}
