<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use App\Support\CentralAiSettings;
use App\Support\SystemMode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Central admin panel for platform-global settings (App\Models\PlatformSetting).
 * Distinct from the tenant settings UI (App\Http\Controllers\Admin\SettingController),
 * which manages each tenant's own values. Gated to platform admins.
 */
class PlatformSettingController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('manage-platform-settings');

        return Inertia::render('Module/PlatformSettings/Index', [
            'settings' => [
                'ai_features_enabled' => CentralAiSettings::isEnabled(),
                'system_mode' => SystemMode::current(),
                'capacity_credits_lifetime_enabled' => PlatformSetting::isCapacityCreditsLifetime(),
                'vehicle_activation_duration_days' => PlatformSetting::getVehicleActivationDurationDays(),
                'vehicle_grace_period_days' => PlatformSetting::getVehicleGracePeriodDays(),
                'pause_during_maintenance_enabled' => PlatformSetting::isPauseDuringMaintenanceEnabled(),
            ],
            'systemModes' => SystemMode::values(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        Gate::authorize('manage-platform-settings');

        $data = $request->validate([
            'ai_features_enabled' => ['required', 'boolean'],
            'system_mode' => ['required', Rule::in(SystemMode::values())],
            'capacity_credits_lifetime_enabled' => ['required', 'boolean'],
            'vehicle_activation_duration_days' => ['required', 'integer', 'min:1', 'max:365'],
            'vehicle_grace_period_days' => ['required', 'integer', 'min:0', 'max:30'],
            'pause_during_maintenance_enabled' => ['required', 'boolean'],
        ]);

        PlatformSetting::setValue(CentralAiSettings::KEY, $data['ai_features_enabled'] ? '1' : '0');
        PlatformSetting::setValue(SystemMode::KEY, $data['system_mode']);
        PlatformSetting::setValue(PlatformSetting::KEY_CAPACITY_CREDITS_LIFETIME, $data['capacity_credits_lifetime_enabled'] ? '1' : '0');
        PlatformSetting::setValue(PlatformSetting::KEY_VEHICLE_ACTIVATION_DURATION_DAYS, (string) $data['vehicle_activation_duration_days']);
        PlatformSetting::setValue(PlatformSetting::KEY_VEHICLE_GRACE_PERIOD_DAYS, (string) $data['vehicle_grace_period_days']);
        PlatformSetting::setValue(PlatformSetting::KEY_PAUSE_DURING_MAINTENANCE, $data['pause_during_maintenance_enabled'] ? '1' : '0');

        \App\Models\Setting::query()->where('key', SystemMode::KEY)->update(['value' => $data['system_mode']]);

        return back()->with('success', __('settings.messages.bulk_updated'));
    }
}
