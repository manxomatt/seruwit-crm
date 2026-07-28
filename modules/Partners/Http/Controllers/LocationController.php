<?php

namespace Modules\Partners\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Facades\Modules;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Partners\Http\Requests\StoreLocationRequest;
use Modules\Partners\Http\Requests\UpdateLocationRequest;
use Modules\Partners\Models\Location;

class LocationController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(): Response
    {
        $user = Auth::user();

        $locations = Location::query()
            ->when(request('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('code', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%")
                        ->orWhere('city', 'like', "%{$search}%");
                });
            })
            ->when(request()->filled('active'), function ($query) {
                $query->where('is_active', request('active') === '1');
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/Partners/Locations/Index', [
            'locations' => $locations,
            'filters' => [
                'search' => request('search'),
                'active' => request('active'),
            ],
            'canGeocode' => Modules::available('inventory'),
            'can' => [
                'create' => $user->hasPermissionFor('partners', 'create'),
                'update' => $user->hasPermissionFor('partners', 'update'),
                'delete' => $user->hasPermissionFor('partners', 'delete'),
            ],
        ]);
    }

    public function store(StoreLocationRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['code'] = filled($data['code'] ?? null) ? $data['code'] : Location::nextCode();
        $data['is_active'] = $data['is_active'] ?? true;

        Location::query()->create($data);

        return redirect()->route($this->getRoutePrefix().'.partners.locations.index')
            ->with('success', __('partners.messages.location_created'));
    }

    public function update(UpdateLocationRequest $request, Location $location): RedirectResponse
    {
        $data = $request->validated();
        if (! filled($data['code'] ?? null)) {
            $data['code'] = $location->code;
        }

        $location->update($data);

        return redirect()->route($this->getRoutePrefix().'.partners.locations.index')
            ->with('success', __('partners.messages.location_updated'));
    }

    public function destroy(Location $location): RedirectResponse
    {
        try {
            $location->delete();
        } catch (QueryException) {
            return back()->with('error', __('partners.messages.location_delete_referenced'));
        }

        return redirect()->route($this->getRoutePrefix().'.partners.locations.index')
            ->with('success', __('partners.messages.location_deleted'));
    }
}
