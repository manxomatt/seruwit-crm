<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use App\Support\CentralAiSettings;
use App\Support\SystemMode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Mail;
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

        PlatformSetting::ensureDefaultsExist();

        $firstGroup = PlatformSetting::orderedVisibleGroups()[0] ?? 'general';

        return redirect()->route('module.platform-settings.group', $firstGroup);
    }

    /**
     * Display the platform settings belonging to a single group as an editable form.
     */
    public function group(string $group): Response
    {
        Gate::authorize('manage-platform-settings');

        PlatformSetting::ensureDefaultsExist();

        $settings = PlatformSetting::query()
            ->where('group', $group)
            ->orderBy('sort_order')
            ->get();

        $groups = PlatformSetting::orderedVisibleGroups();

        // Check if SMTP password exists in DB
        $hasSmtpPassword = filled(PlatformSetting::getValue('email.smtp_password'));

        return Inertia::render('Module/PlatformSettings/Group', [
            'groupSettings' => $settings,
            'groups' => $groups,
            'currentGroup' => $group,
            'systemModes' => SystemMode::values(),
            'hasSmtpPassword' => $hasSmtpPassword,
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

            // Keep existing password if blank is submitted
            if ($setting->key === 'email.smtp_password' && blank($value) && filled($setting->value)) {
                continue;
            }

            $setting->update(['value' => $value]);
        }

        // Dynamically re-apply updated mail configuration
        PlatformSetting::applyCentralMailConfig();

        return redirect()->route('module.platform-settings.group', $data['group'])
            ->with('success', __('settings.messages.bulk_updated'));
    }

    /**
     * Send a test email to verify central SMTP configuration.
     */
    public function testEmail(Request $request): RedirectResponse
    {
        Gate::authorize('manage-platform-settings');

        $data = $request->validate([
            'recipient' => ['required', 'email'],
        ]);

        try {
            PlatformSetting::applyCentralMailConfig();

            $appName = config('app.name', 'Seruwit');
            $recipient = $data['recipient'];

            Mail::raw(
                __('settings.platform.email.test_email_body', [
                    'app' => $appName,
                    'time' => now()->toDateTimeString(),
                    'user' => $request->user()->name,
                ]),
                function ($message) use ($recipient, $appName) {
                    $message->to($recipient)
                        ->subject(__('settings.platform.email.test_email_subject', ['app' => $appName]));
                }
            );

            return back()->with('success', __('settings.platform.email.test_email_sent', ['email' => $recipient]));
        } catch (\Throwable $e) {
            return back()->with('error', __('settings.platform.email.test_email_failed', ['error' => $e->getMessage()]));
        }
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
            'capacity_business_model' => ['sometimes', Rule::in([PlatformSetting::MODEL_PER_VEHICLE_TRIAL, PlatformSetting::MODEL_TENANT_QUOTA])],
            'vehicle_trial_duration_days' => ['sometimes', 'integer', 'min:1', 'max:365'],
            'prevent_duplicate_plate_trial' => ['sometimes', 'boolean'],
            'capacity_credits_lifetime_enabled' => ['sometimes', 'boolean'],
            'vehicle_activation_duration_days' => ['sometimes', 'integer', 'min:1', 'max:365'],
            'vehicle_grace_period_days' => ['sometimes', 'integer', 'min:0', 'max:30'],
            'pause_during_maintenance_enabled' => ['sometimes', 'boolean'],
        ]);

        PlatformSetting::setValue(CentralAiSettings::KEY, $data['ai_features_enabled'] ? '1' : '0');
        PlatformSetting::setValue(SystemMode::KEY, $data['system_mode']);

        if (isset($data['capacity_business_model'])) {
            PlatformSetting::setValue(PlatformSetting::KEY_CAPACITY_BUSINESS_MODEL, $data['capacity_business_model']);
        }
        if (isset($data['vehicle_trial_duration_days'])) {
            PlatformSetting::setValue(PlatformSetting::KEY_VEHICLE_TRIAL_DURATION_DAYS, (string) $data['vehicle_trial_duration_days']);
        }
        if (isset($data['prevent_duplicate_plate_trial'])) {
            PlatformSetting::setValue(PlatformSetting::KEY_PREVENT_DUPLICATE_PLATE_TRIAL, $data['prevent_duplicate_plate_trial'] ? '1' : '0');
        }
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

        PlatformSetting::applyCentralMailConfig();

        return back()->with('success', __('settings.messages.bulk_updated'));
    }
}
