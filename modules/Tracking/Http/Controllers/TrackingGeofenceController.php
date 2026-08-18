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
        $type = $request->input('type', TrackingGeofence::TYPE_CIRCLE);

        $rules = [
            'name' => ['required', 'string', 'max:191'],
            'type' => ['nullable', Rule::in(TrackingGeofence::types())],
            'alert_on' => ['required', Rule::in(TrackingGeofence::alertModes())],
            'active_rentals_only' => ['boolean'],
            'is_active' => ['boolean'],
        ];

        if ($type === TrackingGeofence::TYPE_POLYGON) {
            $rules['coordinates'] = ['required', 'array', 'min:3'];
            $rules['coordinates.*'] = ['array'];
            $rules['coordinates.*.0'] = ['required', 'numeric', 'between:-90,90'];
            $rules['coordinates.*.1'] = ['required', 'numeric', 'between:-180,180'];
            $rules['latitude'] = ['nullable', 'numeric', 'between:-90,90'];
            $rules['longitude'] = ['nullable', 'numeric', 'between:-180,180'];
            $rules['radius_m'] = ['nullable'];
        } else {
            $rules['latitude'] = ['required', 'numeric', 'between:-90,90'];
            $rules['longitude'] = ['required', 'numeric', 'between:-180,180'];
            $rules['radius_m'] = ['required', 'integer', 'min:50', 'max:50000'];
            $rules['coordinates'] = ['nullable', 'array'];
        }

        $validated = $request->validate($rules);

        $validated['type'] = $type;
        $validated['active_rentals_only'] = $request->boolean('active_rentals_only');
        $validated['is_active'] = $request->boolean('is_active', true);

        if ($type === TrackingGeofence::TYPE_POLYGON) {
            $coords = $validated['coordinates'];
            $lats = array_column($coords, 0);
            $lngs = array_column($coords, 1);
            $validated['latitude'] = round(array_sum($lats) / count($lats), 7);
            $validated['longitude'] = round(array_sum($lngs) / count($lngs), 7);
            $validated['radius_m'] = null;
        } else {
            $validated['coordinates'] = null;
        }

        return $validated;
    }
}
