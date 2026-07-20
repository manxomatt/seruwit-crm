<?php

namespace Modules\Tracking\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Tracking\Exceptions\TraccarException;
use Modules\Tracking\Http\Requests\UpdateTrackingConfigRequest;
use Modules\Tracking\Models\TrackingConfig;
use Modules\Tracking\Services\TraccarClient;

class TrackingConfigController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Show the Traccar connection settings.
     */
    public function edit(): Response
    {
        $user = Auth::user();
        $config = TrackingConfig::current();

        return Inertia::render('Modules/Tracking/Settings', [
            // The stored secrets are deliberately absent from the payload; the
            // page only needs to know whether one exists.
            'config' => $config->only([
                'base_url',
                'auth_type',
                'email',
                'poll_enabled',
                'geofence_radius_m',
                'checkpoint_min_distance_m',
                'checkpoint_min_interval_minutes',
                'retention_days',
            ]),
            'hasPassword' => filled($config->password),
            'hasToken' => filled($config->token),
            'defaultBaseUrl' => config('services.traccar.base_url'),
            'lastPolledAt' => $config->last_polled_at?->toDateTimeString(),
            'lastPollError' => $config->last_poll_error,
            'can' => [
                'update' => $user->hasPermissionFor('tracking', 'update'),
            ],
        ]);
    }

    /**
     * Save the connection settings and thresholds.
     */
    public function update(UpdateTrackingConfigRequest $request): RedirectResponse
    {
        $config = TrackingConfig::current();
        $validated = $request->validated();

        // A blank secret means the operator did not retype it, so keep the one
        // already stored rather than wiping the connection.
        foreach (['password', 'token'] as $secret) {
            if (blank($validated[$secret] ?? null)) {
                unset($validated[$secret]);
            }
        }

        $config->update($validated);

        return back()->with('success', 'Tracking settings saved.');
    }

    /**
     * Try the stored credentials against the Traccar server.
     */
    public function test(): RedirectResponse
    {
        $config = TrackingConfig::current();

        if (! $config->isConfigured()) {
            return back()->with('error', 'Fill in the server URL and credentials first.');
        }

        try {
            (new TraccarClient($config))->verify();
        } catch (TraccarException $e) {
            $config->forceFill(['last_poll_error' => $e->getMessage()])->save();

            return back()->with('error', $e->getMessage());
        }

        $config->forceFill(['last_poll_error' => null])->save();

        return back()->with('success', 'Connected to Traccar successfully.');
    }
}
