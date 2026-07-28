<?php

namespace Modules\Tracking\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Tracking\Models\TrackingGeofence;

class TrackingGeofenceController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Modules/Tracking/Geofences/Index', [
            'geofences' => TrackingGeofence::query()->latest('id')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validated($request);
        TrackingGeofence::query()->create($validated);

        return back()->with('success', __('tracking.messages.geofence_created'));
    }

    public function update(Request $request, TrackingGeofence $geofence): RedirectResponse
    {
        $geofence->update($this->validated($request));

        return back()->with('success', __('tracking.messages.geofence_updated'));
    }

    public function destroy(TrackingGeofence $geofence): RedirectResponse
    {
        $geofence->delete();

        return back()->with('success', __('tracking.messages.geofence_deleted'));
    }

    /** @return array<string, mixed> */
    private function validated(Request $request): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:191'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'radius_m' => ['required', 'integer', 'min:50', 'max:50000'],
            'alert_on' => ['required', Rule::in(TrackingGeofence::alertModes())],
            'active_rentals_only' => ['boolean'],
            'is_active' => ['boolean'],
        ]);

        $validated['active_rentals_only'] = $request->boolean('active_rentals_only');
        $validated['is_active'] = $request->boolean('is_active', true);

        return $validated;
    }
}
