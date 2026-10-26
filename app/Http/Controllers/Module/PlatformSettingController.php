<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use App\Services\WhatsApp\WhatsAppGatewayManager;
use App\Services\WhatsAppService;
use App\Support\CentralAiSettings;
use App\Support\SystemMode;
use Illuminate\Http\JsonResponse;
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
    public function __construct(
        protected WhatsAppService $whatsappService,
        protected WhatsAppGatewayManager $gatewayManager,
    ) {}

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

        $deviceStatus = null;
        $whatsappSessionId = null;
        if ($group === 'whatsapp') {
            $whatsappSessionId = $this->gatewayManager->getSessionId();
            $statusRes = $this->whatsappService->getStatus($whatsappSessionId);
            $connected = (($statusRes['status'] ?? '') === 'CONNECTED');

            if ($connected) {
                if (PlatformSetting::getValue('whatsapp.is_enabled') !== '1') {
                    PlatformSetting::query()->updateOrCreate(
                        ['key' => 'whatsapp.is_enabled'],
                        [
                            'group' => 'whatsapp',
                            'value' => '1',
                            'type' => 'boolean',
                            'label' => 'Aktifkan WhatsApp Gateway Central',
                            'is_public' => false,
                        ]
                    );
                }
            }

            $deviceStatus = [
                'connected' => $connected,
                'status' => $statusRes['status'] ?? 'DISCONNECTED',
                'phone' => $statusRes['phone'] ?? '',
                'push_name' => $statusRes['push_name'] ?? '',
                'qr_base64' => $statusRes['qr_base64'] ?? '',
                'message' => $connected
                    ? "Terhubung ke nomor {$statusRes['phone']}".($statusRes['push_name'] ? " ({$statusRes['push_name']})" : '')
                    : 'WhatsApp Central belum terhubung. Silakan scan QR Code atau hubungkan dengan kode pairing.',
            ];
        }

        return Inertia::render('Module/PlatformSettings/Group', [
            'groupSettings' => $settings,
            'groups' => $groups,
            'currentGroup' => $group,
            'systemModes' => SystemMode::values(),
            'hasSmtpPassword' => $hasSmtpPassword,
            'deviceStatus' => $deviceStatus,
            'sessionId' => $whatsappSessionId,
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
            'max_trial_vehicles_per_tenant' => ['sometimes', 'integer', 'min:0', 'max:10000'],
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
        if (isset($data['max_trial_vehicles_per_tenant'])) {
            PlatformSetting::setValue(PlatformSetting::KEY_MAX_TRIAL_VEHICLES_PER_TENANT, (string) $data['max_trial_vehicles_per_tenant']);
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

    /**
     * Start Central WhatsApp session and retrieve live QR Code.
     */
    public function startWhatsApp(): JsonResponse
    {
        Gate::authorize('manage-platform-settings');

        $result = $this->whatsappService->startSession($this->gatewayManager->getSessionId());

        return response()->json($result);
    }

    /**
     * Request 8-digit Pairing Code for Central WhatsApp phone number.
     */
    public function pairWhatsAppWithCode(Request $request): JsonResponse
    {
        Gate::authorize('manage-platform-settings');

        $request->validate([
            'phone' => ['required', 'string'],
        ]);

        $phone = WhatsAppGatewayManager::normalizePhone($request->string('phone')->toString());
        $result = $this->whatsappService->pairWithCode($this->gatewayManager->getSessionId(), $phone);

        return response()->json($result);
    }

    /**
     * Check Central WhatsApp connection status for real-time polling.
     */
    public function whatsappStatus(): JsonResponse
    {
        Gate::authorize('manage-platform-settings');

        $sessionId = $this->gatewayManager->getSessionId();
        $result = $this->whatsappService->getStatus($sessionId);

        if (($result['status'] ?? '') === 'CONNECTED') {
            if (PlatformSetting::getValue('whatsapp.is_enabled') !== '1') {
                PlatformSetting::query()->updateOrCreate(
                    ['key' => 'whatsapp.is_enabled'],
                    [
                        'group' => 'whatsapp',
                        'value' => '1',
                        'type' => 'boolean',
                        'label' => 'Aktifkan WhatsApp Gateway Central',
                        'is_public' => false,
                    ]
                );
            }
        }

        return response()->json($result);
    }

    /**
     * Disconnect / Logout Central WhatsApp session.
     */
    public function logoutWhatsApp(): JsonResponse
    {
        Gate::authorize('manage-platform-settings');

        $result = $this->whatsappService->logout($this->gatewayManager->getSessionId());

        return response()->json($result);
    }

    /**
     * Send test WhatsApp message from Central account to confirm connectivity.
     */
    public function testWhatsApp(Request $request): JsonResponse
    {
        Gate::authorize('manage-platform-settings');

        $request->validate([
            'phone' => ['required', 'string'],
            'message' => ['nullable', 'string'],
        ]);

        $phone = WhatsAppGatewayManager::normalizePhone($request->string('phone')->toString());
        $text = $request->filled('message')
            ? $request->string('message')->toString()
            : 'Halo! Ini adalah pesan uji coba dari Seruwit Platform Central. WhatsApp Gateway Central berhasil terhubung.';

        $result = $this->whatsappService->sendText($this->gatewayManager->getSessionId(), $phone, $text);

        return response()->json($result);
    }
}
