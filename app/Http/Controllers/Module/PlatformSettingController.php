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
    /**
     * Redirect to the first group's page.
     */
    public function index(): RedirectResponse
    {
        Gate::authorize('manage-platform-settings');

        $firstGroup = PlatformSetting::orderedVisibleGroups()[0] ?? 'general';

        return redirect()->route('module.platform-settings.group', $firstGroup);
    }

    /**
     * Display the platform settings belonging to a single group as an editable form.
     */
    public function group(string $group): Response
    {
        Gate::authorize('manage-platform-settings');

        $settings = PlatformSetting::query()
            ->where('group', $group)
            ->orderBy('sort_order')
            ->get();

        $groups = PlatformSetting::orderedVisibleGroups();

        return Inertia::render('Module/PlatformSettings/Group', [
            'groupSettings' => $settings,
            'groups' => $groups,
            'currentGroup' => $group,
            'systemModes' => SystemMode::values(),
        ]);
    }

    /**
     * Update multiple platform settings at once (bulk update).
     */
    public function bulkUpdate(Request $request): RedirectResponse
    {
        Gate::authorize('manage-platform-settings');

        $data = $request->validate([
            'group' => ['required', 'string'],
            'settings' => ['required', 'array'],
            'settings.*.id' => ['required', 'exists:platform_settings,id'],
            'settings.*.value' => ['nullable', 'string'],
        ]);

        foreach ($data['settings'] as $index => $settingData) {
            $setting = PlatformSetting::query()->findOrFail($settingData['id']);
            $value = $settingData['value'];

            if ($setting->key === SystemMode::KEY) {
                $request->validate([
                    "settings.{$index}.value" => ['required', Rule::in(SystemMode::values())],
                ]);
            }

            $setting->update(['value' => $value]);
        }

        return redirect()->route('module.platform-settings.group', $data['group'])
            ->with('success', __('settings.messages.bulk_updated'));
    }

    /**
     * Backward-compatible update endpoint.
     */
    public function update(Request $request): RedirectResponse
    {
        Gate::authorize('manage-platform-settings');

        $data = $request->validate([
            'ai_features_enabled' => ['required', 'boolean'],
            'system_mode' => ['required', Rule::in(SystemMode::values())],
            'capacity_credits_lifetime_enabled' => ['sometimes', 'boolean'],
            'vehicle_activation_duration_days' => ['sometimes', 'integer', 'min:1', 'max:365'],
            'vehicle_grace_period_days' => ['sometimes', 'integer', 'min:0', 'max:30'],
            'pause_during_maintenance_enabled' => ['sometimes', 'boolean'],
        ]);

        PlatformSetting::setValue(CentralAiSettings::KEY, $data['ai_features_enabled'] ? '1' : '0');
        PlatformSetting::setValue(SystemMode::KEY, $data['system_mode']);

        if (isset($data['capacity_credits_lifetime_enabled'])) {
            PlatformSetting::setValue(PlatformSetting::KEY_CAPACITY_CREDITS_LIFETIME, $data['capacity_credits_lifetime_enabled'] ? '1' : '0');
        }
        if (isset($data['vehicle_activation_duration_days'])) {
            PlatformSetting::setValue(PlatformSetting::KEY_VEHICLE_ACTIVATION_DURATION_DAYS, (string) $data['vehicle_activation_duration_days']);
        }
        if (isset($data['vehicle_grace_period_days'])) {
            PlatformSetting::setValue(PlatformSetting::KEY_VEHICLE_GRACE_PERIOD_DAYS, (string) $data['vehicle_grace_period_days']);
        }
        if (isset($data['pause_during_maintenance_enabled'])) {
            PlatformSetting::setValue(PlatformSetting::KEY_PAUSE_DURING_MAINTENANCE, $data['pause_during_maintenance_enabled'] ? '1' : '0');
        }

        return back()->with('success', __('settings.messages.bulk_updated'));
    }
}
