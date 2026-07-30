<?php

namespace Modules\Shuttle\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Shuttle\Http\Requests\StoreCorridorRequest;
use Modules\Shuttle\Http\Requests\UpdateCorridorRequest;
use Modules\Shuttle\Models\ShuttleCity;
use Modules\Shuttle\Models\ShuttleCorridor;
use Modules\Shuttle\Models\ShuttlePool;
use Modules\Shuttle\Models\ShuttleSetting;

class CorridorController extends Controller
{
    public function index(): Response
    {
        $corridors = ShuttleCorridor::query()
            ->with(['originPool:id,code,name', 'destinationPool:id,code,name'])
            ->when(request('search'), function ($q, $search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('code', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('origin_city', 'like', "%{$search}%")
                        ->orWhere('destination_city', 'like', "%{$search}%");
                });
            })
            ->orderBy('code')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/Shuttle/Corridors/Index', [
            'corridors' => $corridors,
            'filters' => request()->only(['search']),
            'can' => [
                'create' => auth()->user()?->hasPermissionFor('shuttle', 'create') ?? false,
                'update' => auth()->user()?->hasPermissionFor('shuttle', 'update') ?? false,
                'delete' => auth()->user()?->hasPermissionFor('shuttle', 'delete') ?? false,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Modules/Shuttle/Corridors/Create', $this->formOptions());
    }

    public function store(StoreCorridorRequest $request): RedirectResponse
    {
        ShuttleCorridor::query()->create($request->corridorAttributes());

        return redirect()->route('module.shuttle.corridors.index')
            ->with('success', __('shuttle.messages.corridor_created'));
    }

    public function edit(ShuttleCorridor $corridor): Response
    {
        return Inertia::render('Modules/Shuttle/Corridors/Edit', [
            'corridor' => $corridor->load(['originPool', 'destinationPool']),
            ...$this->formOptions(),
        ]);
    }

    public function update(UpdateCorridorRequest $request, ShuttleCorridor $corridor): RedirectResponse
    {
        $corridor->update($request->corridorAttributes());

        return redirect()->route('module.shuttle.corridors.index')
            ->with('success', __('shuttle.messages.corridor_updated'));
    }

    public function destroy(ShuttleCorridor $corridor): RedirectResponse
    {
        if ($corridor->departures()->exists()) {
            return back()->with('error', __('shuttle.messages.corridor_has_departures'));
        }

        $corridor->delete();

        return redirect()->route('module.shuttle.corridors.index')
            ->with('success', __('shuttle.messages.corridor_deleted'));
    }

    /**
     * @return array<string, mixed>
     */
    private function formOptions(): array
    {
        $settings = array_merge(ShuttleSetting::defaults(), ShuttleSetting::allMapped());

        return [
            'cities' => ShuttleCity::query()->where('is_active', true)->orderBy('name')->get(['id', 'code', 'name']),
            'pools' => ShuttlePool::query()
                ->with('city:id,name')
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'city_id', 'code', 'name', 'is_origin', 'is_destination']),
            'defaults' => [
                'pool_base_fare' => $settings[ShuttleSetting::KEY_DEFAULT_POOL_FARE] ?? '200000',
                'door_base_fare' => $settings[ShuttleSetting::KEY_DEFAULT_DOOR_FARE] ?? '250000',
            ],
        ];
    }
}
