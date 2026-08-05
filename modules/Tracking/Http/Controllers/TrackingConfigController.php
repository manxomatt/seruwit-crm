<?php

namespace Modules\Tracking\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Tracking\Exceptions\GpsProviderException;
use Modules\Tracking\Http\Requests\StoreGpsSourceRequest;
use Modules\Tracking\Http\Requests\UpdateGpsSourceRequest;
use Modules\Tracking\Http\Requests\UpdateTrackingConfigRequest;
use Modules\Tracking\Models\GpsSource;
use Modules\Tracking\Models\TrackingConfig;
use Modules\Tracking\Services\GpsProviderFactory;

class TrackingConfigController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Settings hub: GPS sources + tenant alert/retention thresholds.
     */
    public function edit(): Response
    {
        $user = Auth::user();
        $config = TrackingConfig::current();

        $sources = GpsSource::query()
            ->withCount(['devices', 'devices as paired_devices_count' => fn ($q) => $q->whereNotNull('vehicle_id')])
            ->orderBy('name')
            ->get()
            ->map(fn (GpsSource $source): array => [
                'id' => $source->id,
                'name' => $source->name,
                'provider' => $source->provider,
                'base_url' => $source->base_url,
                'auth_type' => $source->auth_type,
                'email' => $source->email,
                'poll_enabled' => $source->poll_enabled,
                'configured' => $source->isConfigured(),
                'has_password' => filled($source->password),
                'has_token' => filled($source->token),
                'last_polled_at' => $source->last_polled_at?->toDateTimeString(),
                'last_poll_error' => $source->last_poll_error,
                'devices_count' => $source->devices_count,
                'paired_devices_count' => $source->paired_devices_count,
            ]);

        return Inertia::render('Modules/Tracking/Settings', [
            'config' => $config->only([
                'alerts_enabled',
                'alert_speed_kph',
                'alert_stale_minutes',
                'alert_idle_minutes',
                'alert_cooldown_minutes',
                'geofence_radius_m',
                'checkpoint_min_distance_m',
                'checkpoint_min_interval_minutes',
                'retention_days',
            ]),
            'sources' => $sources,
            'defaultBaseUrl' => config('services.traccar.base_url'),
            'maxSources' => GpsSource::MAX_PER_TENANT,
            'can' => [
                'update' => $user->hasPermissionFor('tracking', 'update'),
                'create' => $user->hasPermissionFor('tracking', 'create'),
                'delete' => $user->hasPermissionFor('tracking', 'delete'),
            ],
        ]);
    }

    public function update(UpdateTrackingConfigRequest $request): RedirectResponse
    {
        TrackingConfig::current()->update($request->validated());

        return back()->with('success', __('tracking.messages.settings_saved'));
    }

    public function storeSource(StoreGpsSourceRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        GpsSource::query()->create($validated);

        return back()->with('success', __('tracking.messages.source_created'));
    }

    public function updateSource(UpdateGpsSourceRequest $request, GpsSource $source): RedirectResponse
    {
        $validated = $request->validated();

        foreach (['password', 'token'] as $secret) {
            if (blank($validated[$secret] ?? null)) {
                unset($validated[$secret]);
            }
        }

        if (in_array($validated['provider'] ?? null, GpsSource::apiKeyProviders(), true)) {
            $validated['auth_type'] = GpsSource::AUTH_API_KEY;
            $validated['email'] = null;
            $validated['password'] = null;
        }

        $source->update($validated);

        return back()->with('success', __('tracking.messages.source_updated'));
    }

    public function destroySource(GpsSource $source): RedirectResponse
    {
        if ($source->hasPairedDevices()) {
            return back()->with('error', __('tracking.messages.source_has_paired_devices'));
        }

        $source->delete();

        return back()->with('success', __('tracking.messages.source_deleted'));
    }

    public function testSource(GpsSource $source, GpsProviderFactory $providers): RedirectResponse
    {
        if (! $source->isConfigured()) {
            return back()->with('error', __('tracking.messages.fill_credentials'));
        }

        try {
            $providers->make($source)->verify();
        } catch (GpsProviderException $e) {
            $source->forceFill(['last_poll_error' => $e->getMessage()])->save();

            return back()->with('error', $e->getMessage());
        }

        $source->forceFill(['last_poll_error' => null])->save();

        return back()->with('success', __('tracking.messages.connection_ok'));
    }
}
