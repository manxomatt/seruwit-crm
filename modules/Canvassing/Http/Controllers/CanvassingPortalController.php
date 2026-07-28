<?php

namespace Modules\Canvassing\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Canvassing\Http\Requests\CheckInRequest;
use Modules\Canvassing\Http\Requests\CheckOutRequest;
use Modules\Canvassing\Http\Requests\SyncVisitOrderRequest;
use Modules\Canvassing\Models\CanvassingPhoto;
use Modules\Canvassing\Models\CanvassingVisit;
use Modules\Canvassing\Models\Salesperson;
use Modules\Canvassing\Support\VisitOrderToSalesOrderConverter;
use Modules\Inventory\Support\AccessibleWarehouses;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Product;
use RuntimeException;

class CanvassingPortalController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    private function resolveSalesperson(): Salesperson
    {
        $salesperson = Salesperson::forUser(auth()->user());
        abort_unless($salesperson, 403, 'No active salesperson account linked to your user.');

        return $salesperson;
    }

    public function today(): Response
    {
        $salesperson = $this->resolveSalesperson();

        $todayVisits = $salesperson->visits()
            ->with('partner')
            ->today()
            ->latest('checked_in_at')
            ->get();

        $openVisit = $salesperson->visits()
            ->open()
            ->latest('checked_in_at')
            ->first();

        $todayPlan = $salesperson->plans()
            ->where('plan_date', today())
            ->first();

        return Inertia::render('Modules/Canvassing/Portal/Today', [
            'salesperson' => $salesperson->only('id', 'name', 'area'),
            'todayVisits' => $todayVisits,
            'openVisit' => $openVisit?->load('partner'),
            'todayPlan' => $todayPlan,
        ]);
    }

    public function checkInForm(): Response
    {
        $salesperson = $this->resolveSalesperson();

        $openVisit = $salesperson->visits()->open()->latest('checked_in_at')->first();
        if ($openVisit) {
            return redirect()->route('module.canvassing.portal.visits.show', $openVisit);
        }

        $partners = Partner::query()
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'address']);

        $todayPlan = $salesperson->plans()
            ->where('plan_date', today())
            ->first();

        return Inertia::render('Modules/Canvassing/Portal/CheckIn', [
            'salesperson' => $salesperson->only('id', 'name'),
            'partners' => $partners,
            'todayPlan' => $todayPlan,
        ]);
    }

    public function checkIn(CheckInRequest $request): RedirectResponse
    {
        $salesperson = $this->resolveSalesperson();

        $openVisit = $salesperson->visits()->open()->exists();
        abort_if($openVisit, 422, 'You already have an open check-in. Please check out first.');

        $visit = CanvassingVisit::query()->create([
            'salesperson_id' => $salesperson->id,
            'partner_id' => $request->partner_id,
            'plan_id' => $request->plan_id,
            'submitted_by' => auth()->id(),
            'checked_in_at' => now(),
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'outcome' => CanvassingVisit::OUTCOME_PENDING,
            'notes' => $request->notes,
        ]);

        return redirect()->route('module.canvassing.portal.visits.show', $visit)
            ->with('success', __('canvassing.messages.checked_in'));
    }

    public function visitDetail(CanvassingVisit $visit): Response
    {
        $salesperson = $this->resolveSalesperson();
        abort_unless($visit->salesperson_id === $salesperson->id, 403);

        $visit->load(['partner', 'photos', 'orderItems.product:id,name,code,unit,price']);
        $converter = app(VisitOrderToSalesOrderConverter::class);

        $warehouses = [];
        $products = [];

        if ($converter->salesAvailable() && class_exists(AccessibleWarehouses::class)) {
            $warehouses = AccessibleWarehouses::query()
                ->where('status', 'active')
                ->salesOutbound()
                ->orderBy('name')
                ->get(['id', 'name']);
        }

        if ($visit->is_open && class_exists(Product::class)) {
            $products = Product::query()
                ->where('status', 'active')
                ->orderBy('name')
                ->limit(200)
                ->get(['id', 'name', 'code', 'unit', 'price']);
        }

        return Inertia::render('Modules/Canvassing/Portal/VisitDetail', [
            'salesperson' => $salesperson->only('id', 'name'),
            'visit' => $visit,
            'orderCapture' => [
                'enabled' => $converter->salesAvailable(),
                'warehouses' => $warehouses,
                'products' => $products,
                'sales_order_id' => $visit->sales_order_id,
            ],
        ]);
    }

    public function syncOrder(
        SyncVisitOrderRequest $request,
        CanvassingVisit $visit,
        VisitOrderToSalesOrderConverter $converter,
    ): RedirectResponse {
        $salesperson = $this->resolveSalesperson();
        abort_unless($visit->salesperson_id === $salesperson->id, 403);
        abort_unless($visit->checked_out_at === null, 422, 'This visit is already checked out.');
        abort_unless($converter->salesAvailable(), 422, __('canvassing.messages.sales_module_required'));

        $validated = $request->validated();

        try {
            if (isset($validated['warehouse_id'])) {
                $visit->update(['warehouse_id' => $validated['warehouse_id']]);
            }

            $converter->syncItems($visit, $validated['items'] ?? []);

            if ($request->boolean('convert')) {
                $so = $converter->convert($visit->fresh(['orderItems']), $validated['warehouse_id'] ?? null);

                return redirect()->route('module.canvassing.portal.visits.show', $visit)
                    ->with('success', __('canvassing.messages.order_converted', ['number' => $so->so_number]));
            }
        } catch (RuntimeException $e) {
            return back()->withErrors(['order' => $e->getMessage()]);
        }

        return back()->with('success', __('canvassing.messages.order_saved'));
    }

    public function checkOut(CheckOutRequest $request, CanvassingVisit $visit): RedirectResponse
    {
        $salesperson = $this->resolveSalesperson();
        abort_unless($visit->salesperson_id === $salesperson->id, 403);
        abort_unless($visit->checked_out_at === null, 422, 'This visit is already checked out.');

        DB::transaction(function () use ($request, $visit): void {
            $visit->update([
                'checked_out_at' => now(),
                'outcome' => $request->outcome,
                'notes' => $request->notes ?? $visit->notes,
            ]);

            foreach (($request->photos ?? []) as $index => $base64) {
                if (! str_starts_with($base64, 'data:image/')) {
                    continue;
                }

                $data = substr($base64, strpos($base64, ',') + 1);
                $decoded = base64_decode($data);
                $path = 'canvassing/photos/'.$visit->id.'_'.$index.'_'.time().'.jpg';
                Storage::disk('public')->put($path, $decoded);

                CanvassingPhoto::query()->create([
                    'canvassing_visit_id' => $visit->id,
                    'path' => $path,
                ]);
            }
        });

        return redirect()->route('module.canvassing.portal.today')
            ->with('success', __('canvassing.messages.checked_out'));
    }
}
