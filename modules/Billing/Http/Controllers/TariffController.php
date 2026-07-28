<?php

namespace Modules\Billing\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Billing\Http\Requests\StoreTariffRequest;
use Modules\Billing\Http\Requests\UpdateTariffRequest;
use Modules\Billing\Models\Tariff;
use Modules\Partners\Models\Location;
use Modules\Partners\Models\Partner;

class TariffController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Display a listing of the tariffs.
     */
    public function index(): Response
    {
        $user = Auth::user();

        $tariffs = Tariff::query()
            ->with([
                'partner:id,code,name',
                'originLocation:id,code,name',
                'destinationLocation:id,code,name',
            ])
            ->when(request('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('origin', 'like', "%{$search}%")
                        ->orWhere('destination', 'like', "%{$search}%");
                });
            })
            ->when(request('partner_id'), fn ($query, $partnerId) => $query->where('partner_id', $partnerId))
            ->orderBy('origin')
            ->orderBy('destination')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/Billing/Tariffs/Index', [
            'tariffs' => $tariffs,
            'partners' => Partner::query()->orderBy('name')->get(['id', 'code', 'name']),
            'locations' => Location::query()->active()->orderBy('name')->get(['id', 'code', 'name', 'city']),
            'filters' => [
                'search' => request('search'),
                'partner_id' => request('partner_id'),
            ],
            'can' => [
                'create' => $user->hasPermissionFor('billing', 'create'),
                'update' => $user->hasPermissionFor('billing', 'update'),
                'delete' => $user->hasPermissionFor('billing', 'delete'),
            ],
        ]);
    }

    /**
     * Store a newly created tariff in storage.
     */
    public function store(StoreTariffRequest $request): RedirectResponse
    {
        Tariff::create($this->payload($request->validated()));

        return redirect()->route($this->getRoutePrefix().'.billing.tariffs.index')
            ->with('success', __('billing.messages.tariff_created'));
    }

    /**
     * Update the specified tariff in storage.
     */
    public function update(UpdateTariffRequest $request, Tariff $tariff): RedirectResponse
    {
        $tariff->update($this->payload($request->validated()));

        return redirect()->route($this->getRoutePrefix().'.billing.tariffs.index')
            ->with('success', __('billing.messages.tariff_updated'));
    }

    /**
     * Remove the specified tariff from storage. Existing charges keep their
     * snapshot amount (tariff_id is nulled at the database level).
     */
    public function destroy(Tariff $tariff): RedirectResponse
    {
        $tariff->delete();

        return redirect()->route($this->getRoutePrefix().'.billing.tariffs.index')
            ->with('success', __('billing.messages.tariff_deleted'));
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function payload(array $data): array
    {
        $originLocationId = isset($data['origin_location_id']) ? (int) $data['origin_location_id'] : null;
        $destinationLocationId = isset($data['destination_location_id']) ? (int) $data['destination_location_id'] : null;

        if ($originLocationId) {
            $origin = Location::query()->find($originLocationId);
            $data['origin'] = $origin?->name ?? ($data['origin'] ?? '');
        }

        if ($destinationLocationId) {
            $destination = Location::query()->find($destinationLocationId);
            $data['destination'] = $destination?->name ?? ($data['destination'] ?? '');
        }

        $data['origin_location_id'] = $originLocationId;
        $data['destination_location_id'] = $destinationLocationId;
        $data['partner_id'] = filled($data['partner_id'] ?? null) ? (int) $data['partner_id'] : null;
        $data['is_active'] = $data['is_active'] ?? true;

        return $data;
    }
}
