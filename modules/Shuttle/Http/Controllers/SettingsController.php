<?php

namespace Modules\Shuttle\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Partners\Models\Location;
use Modules\Shuttle\Http\Requests\StoreShuttleCityRequest;
use Modules\Shuttle\Http\Requests\StoreShuttlePoolRequest;
use Modules\Shuttle\Http\Requests\UpdateShuttleSettingsRequest;
use Modules\Shuttle\Models\ShuttleCity;
use Modules\Shuttle\Models\ShuttleCorridor;
use Modules\Shuttle\Models\ShuttlePool;
use Modules\Shuttle\Models\ShuttleSetting;

class SettingsController extends Controller
{
    public function index(Request $request): Response
    {
        $tab = $request->string('tab', 'general')->toString();
        if (! in_array($tab, ['general', 'cities', 'pools'], true)) {
            $tab = 'general';
        }

        $settings = array_merge(ShuttleSetting::defaults(), ShuttleSetting::allMapped());

        return Inertia::render('Modules/Shuttle/Settings/Index', [
            'tab' => $tab,
            'settings' => [
                'default_seat_capacity' => $settings[ShuttleSetting::KEY_DEFAULT_SEAT_CAPACITY] ?? '14',
                'default_pickup_cutoff_minutes' => $settings[ShuttleSetting::KEY_DEFAULT_PICKUP_CUTOFF] ?? '90',
                'default_pool_base_fare' => $settings[ShuttleSetting::KEY_DEFAULT_POOL_FARE] ?? '200000',
                'default_door_base_fare' => $settings[ShuttleSetting::KEY_DEFAULT_DOOR_FARE] ?? '250000',
            ],
            'cities' => ShuttleCity::query()->orderBy('name')->get(),
            'pools' => ShuttlePool::query()->with(['city', 'location'])->orderBy('name')->get(),
            'can' => [
                'update' => auth()->user()?->hasPermissionFor('shuttle', 'update') ?? false,
                'create' => auth()->user()?->hasPermissionFor('shuttle', 'create') ?? false,
                'delete' => auth()->user()?->hasPermissionFor('shuttle', 'delete') ?? false,
            ],
        ]);
    }

    public function updateGeneral(UpdateShuttleSettingsRequest $request): RedirectResponse
    {
        $data = $request->validated();

        ShuttleSetting::putMany([
            ShuttleSetting::KEY_DEFAULT_SEAT_CAPACITY => $data['default_seat_capacity'],
            ShuttleSetting::KEY_DEFAULT_PICKUP_CUTOFF => $data['default_pickup_cutoff_minutes'],
            ShuttleSetting::KEY_DEFAULT_POOL_FARE => $data['default_pool_base_fare'],
            ShuttleSetting::KEY_DEFAULT_DOOR_FARE => $data['default_door_base_fare'],
        ]);

        return redirect()
            ->route('module.shuttle.settings.index', ['tab' => 'general'])
            ->with('success', __('shuttle.messages.settings_saved'));
    }

    public function storeCity(StoreShuttleCityRequest $request): RedirectResponse
    {
        ShuttleCity::query()->create($request->validated());

        return redirect()
            ->route('module.shuttle.settings.index', ['tab' => 'cities'])
            ->with('success', __('shuttle.messages.city_created'));
    }

    public function updateCity(StoreShuttleCityRequest $request, ShuttleCity $city): RedirectResponse
    {
        $city->update($request->validated());

        return redirect()
            ->route('module.shuttle.settings.index', ['tab' => 'cities'])
            ->with('success', __('shuttle.messages.city_updated'));
    }

    public function destroyCity(ShuttleCity $city): RedirectResponse
    {
        if ($city->pools()->exists()) {
            return back()->with('error', __('shuttle.messages.city_has_pools'));
        }

        $city->delete();

        return redirect()
            ->route('module.shuttle.settings.index', ['tab' => 'cities'])
            ->with('success', __('shuttle.messages.city_deleted'));
    }

    public function storePool(StoreShuttlePoolRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $city = ShuttleCity::query()->findOrFail($data['city_id']);

        $location = Location::query()->updateOrCreate(
            ['code' => 'SH-'.$data['code']],
            [
                'name' => $data['name'],
                'address' => $data['address'] ?? null,
                'city' => $city->name,
                'province' => $city->province,
                'latitude' => $data['latitude'],
                'longitude' => $data['longitude'],
                'is_active' => true,
            ],
        );

        ShuttlePool::query()->create([
            'city_id' => $data['city_id'],
            'code' => $data['code'],
            'name' => $data['name'],
            'location_id' => $location->id,
            'is_origin' => $data['is_origin'] ?? true,
            'is_destination' => $data['is_destination'] ?? true,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return redirect()
            ->route('module.shuttle.settings.index', ['tab' => 'pools'])
            ->with('success', __('shuttle.messages.pool_created'));
    }

    public function updatePool(StoreShuttlePoolRequest $request, ShuttlePool $pool): RedirectResponse
    {
        $data = $request->validated();
        $city = ShuttleCity::query()->findOrFail($data['city_id']);

        $pool->loadMissing('location');

        if ($pool->location) {
            $pool->location->update([
                'code' => 'SH-'.$data['code'],
                'name' => $data['name'],
                'address' => $data['address'] ?? $pool->location->address,
                'city' => $city->name,
                'province' => $city->province,
                'latitude' => $data['latitude'],
                'longitude' => $data['longitude'],
            ]);
            $locationId = $pool->location_id;
        } else {
            $location = Location::query()->create([
                'code' => 'SH-'.$data['code'],
                'name' => $data['name'],
                'address' => $data['address'] ?? null,
                'city' => $city->name,
                'province' => $city->province,
                'latitude' => $data['latitude'],
                'longitude' => $data['longitude'],
                'is_active' => true,
            ]);
            $locationId = $location->id;
        }

        $pool->update([
            'city_id' => $data['city_id'],
            'code' => $data['code'],
            'name' => $data['name'],
            'location_id' => $locationId,
            'is_origin' => $data['is_origin'] ?? true,
            'is_destination' => $data['is_destination'] ?? true,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return redirect()
            ->route('module.shuttle.settings.index', ['tab' => 'pools'])
            ->with('success', __('shuttle.messages.pool_updated'));
    }

    public function destroyPool(ShuttlePool $pool): RedirectResponse
    {
        $inUse = ShuttleCorridor::query()
            ->where('origin_pool_id', $pool->id)
            ->orWhere('destination_pool_id', $pool->id)
            ->exists();

        if ($inUse) {
            return back()->with('error', __('shuttle.messages.pool_in_use'));
        }

        $pool->delete();

        return redirect()
            ->route('module.shuttle.settings.index', ['tab' => 'pools'])
            ->with('success', __('shuttle.messages.pool_deleted'));
    }
}
