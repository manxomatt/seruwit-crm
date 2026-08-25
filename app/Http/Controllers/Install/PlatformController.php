<?php

namespace App\Http\Controllers\Install;

use App\Http\Controllers\Controller;
use App\Http\Requests\Install\PlatformProfileRequest;
use App\Models\PlatformSetting;
use App\Support\CentralAiSettings;
use App\Support\Installer\EnvironmentWriter;
use App\Support\SystemMode;
use Illuminate\Http\RedirectResponse;

class PlatformController extends Controller
{
    public function store(PlatformProfileRequest $request, EnvironmentWriter $env): RedirectResponse
    {
        $env->write([
            'APP_NAME' => (string) $request->input('app_name'),
            'APP_URL' => (string) $request->input('app_url'),
            'TENANT_BASE_DOMAIN' => (string) $request->input('tenant_base_domain', ''),
            'CENTRAL_SERVES_APP' => ! $request->isProduction(),
        ]);

        // Platform toggles live in platform_settings (central), migrated by now.
        PlatformSetting::setValue(SystemMode::KEY, $request->systemMode());
        PlatformSetting::setValue(CentralAiSettings::KEY, $request->boolean('ai_features_enabled') ? '1' : '0');

        return redirect()->route('install.index')->with('status', 'platform-configured');
    }
}
