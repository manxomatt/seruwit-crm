<?php

namespace App\Services\Central;

use App\Models\CentralUser;
use App\Models\OnboardingSession;
use App\Models\PlatformSetting;
use App\Services\WhatsApp\WhatsAppGatewayManager;
use Illuminate\Support\Facades\Log;
use Throwable;

class CentralOnboardingWhatsAppNotifier
{
    public function __construct(
        protected WhatsAppGatewayManager $gatewayManager,
    ) {}

    /**
     * Send an automated welcome and workspace access message via WhatsApp to a new tenant.
     */
    public function sendWelcomeNotification(OnboardingSession $session): bool
    {
        try {
            if (! PlatformSetting::isOnboardingWelcomeWhatsAppEnabled()) {
                Log::info('[CentralOnboardingWhatsAppNotifier] WhatsApp welcome notification disabled in platform settings.');

                return false;
            }

            $phone = $session->phone ?: $session->base_phone;
            if (blank($phone)) {
                Log::info('[CentralOnboardingWhatsAppNotifier] Onboarding session has no phone number, skipping welcome message.', [
                    'session_id' => $session->id,
                ]);

                return false;
            }

            $owner = null;
            if ($session->global_user_id) {
                $owner = CentralUser::query()->where('global_id', $session->global_user_id)->first();
            }

            $ownerName = $owner?->name ?: 'Mitra';
            $email = $owner?->email ?: ($session->base_email ?: '-');
            $companyName = $session->company_name ?: 'Perusahaan Anda';
            $subdomain = (string) $session->subdomain;
            $planName = ucfirst(str_replace('_', ' ', $session->plan_key ?? 'Trial'));

            $centralHost = (string) (config('tenancy.tenant_base_domain') ?: parse_url(config('app.url'), PHP_URL_HOST) ?: 'localhost');
            $scheme = parse_url(config('app.url'), PHP_URL_SCHEME) ?: 'https';
            $port = parse_url(config('app.url'), PHP_URL_PORT);
            $portSuffix = ($port && ! in_array((int) $port, [80, 443], true)) ? ":{$port}" : '';
            $workspaceUrl = "{$scheme}://{$subdomain}.{$centralHost}{$portSuffix}";

            $template = (string) PlatformSetting::getValue(
                'whatsapp.onboarding_welcome_template',
                "Halo {owner_name}, selamat datang di Seruwit! 🎉\n\nWorkspace bisnis Anda untuk *{company_name}* telah berhasil dibuat dan siap digunakan.\n\nBerikut informasi akses workspace Anda:\n🔗 *URL Workspace:* {workspace_url}\n📧 *Email Login:* {email}\n📦 *Paket:* {plan_name}\n\nSilakan masuk dan mulai kelola armada serta operasional rental Anda. Jika ada kendala, tim kami siap membantu.\n\nSalam hangat,\n*Tim Seruwit*"
            );

            $replacements = [
                '{owner_name}' => $ownerName,
                '{company_name}' => $companyName,
                '{workspace_url}' => $workspaceUrl,
                '{email}' => $email,
                '{plan_name}' => $planName,
                '{subdomain}' => $subdomain,
            ];

            $message = str_replace(array_keys($replacements), array_values($replacements), $template);

            $gateway = $this->gatewayManager->forCentral();
            $success = $gateway->sendMessage($phone, $message);

            if ($success) {
                Log::info('[CentralOnboardingWhatsAppNotifier] Welcome message sent successfully.', [
                    'session_id' => $session->id,
                    'phone' => $phone,
                ]);
            } else {
                Log::warning('[CentralOnboardingWhatsAppNotifier] Failed to send welcome message via WhatsApp gateway.', [
                    'session_id' => $session->id,
                    'phone' => $phone,
                ]);
            }

            return $success;
        } catch (Throwable $e) {
            Log::error('[CentralOnboardingWhatsAppNotifier] Exception sending onboarding WhatsApp welcome notification', [
                'session_id' => $session->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
