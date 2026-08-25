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
        ]);

        PlatformSetting::setValue(CentralAiSettings::KEY, $data['ai_features_enabled'] ? '1' : '0');
        PlatformSetting::setValue(SystemMode::KEY, $data['system_mode']);

        return back()->with('success', __('settings.messages.bulk_updated'));
    }
}
