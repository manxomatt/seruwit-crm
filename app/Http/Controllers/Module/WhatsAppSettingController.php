<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\WhatsApp\WhatsAppGatewayManager;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WhatsAppSettingController extends Controller
{
    public function __construct(
        protected WhatsAppService $whatsappService,
        protected WhatsAppGatewayManager $gatewayManager,
    ) {}

    protected function getSessionId(): string
    {
        return $this->gatewayManager->getSessionId();
    }

    /**
     * Display the tenant WhatsApp Gateway configuration page.
     */
    public function index(): Response
    {
        $sessionId = $this->getSessionId();
        $statusRes = $this->whatsappService->getStatus($sessionId);

        $connected = (($statusRes['status'] ?? '') === 'CONNECTED');
        if ($connected && Setting::getValue('whatsapp.is_enabled') !== '1') {
            Setting::query()->updateOrCreate(
                ['key' => 'whatsapp.is_enabled'],
                [
                    'group' => 'rental_whatsapp',
                    'value' => '1',
                    'type' => 'boolean',
                    'label' => 'Is enabled',
                    'is_public' => false,
                ]
            );
        }

        $deviceStatus = [
            'connected' => $connected,
            'status' => $statusRes['status'] ?? 'DISCONNECTED',
            'phone' => $statusRes['phone'] ?? '',
            'push_name' => $statusRes['push_name'] ?? '',
            'qr_base64' => $statusRes['qr_base64'] ?? '',
            'message' => $connected
                ? "Terhubung ke nomor {$statusRes['phone']}".($statusRes['push_name'] ? " ({$statusRes['push_name']})" : '')
                : 'WhatsApp belum terhubung. Silakan scan QR Code atau hubungkan dengan kode pairing.',
        ];

        return Inertia::render('Modules/Settings/WhatsApp', [
            'deviceStatus' => $deviceStatus,
            'sessionId' => $sessionId,
            'isEnabled' => filter_var(Setting::getValue('whatsapp.is_enabled', true), FILTER_VALIDATE_BOOLEAN),
        ]);
    }

    /**
     * Start session and fetch live QR Code.
     */
    public function startSession(): JsonResponse
    {
        $result = $this->whatsappService->startSession($this->getSessionId());

        return response()->json($result);
    }

    /**
     * Request 8-digit Pairing Code for a given phone number.
     */
    public function pairWithCode(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => ['required', 'string'],
        ]);

        $phone = WhatsAppGatewayManager::normalizePhone($request->string('phone')->toString());
        $result = $this->whatsappService->pairWithCode($this->getSessionId(), $phone);

        return response()->json($result);
    }

    /**
     * Check current connection status (for live polling).
     */
    public function status(): JsonResponse
    {
        $result = $this->whatsappService->getStatus($this->getSessionId());

        if (($result['status'] ?? '') === 'CONNECTED' && Setting::getValue('whatsapp.is_enabled') !== '1') {
            Setting::query()->updateOrCreate(
                ['key' => 'whatsapp.is_enabled'],
                [
                    'group' => 'rental_whatsapp',
                    'value' => '1',
                    'type' => 'boolean',
                    'label' => 'Is enabled',
                    'is_public' => false,
                ]
            );
        }

        return response()->json($result);
    }

    /**
     * Disconnect / Logout WhatsApp number.
     */
    public function logout(): JsonResponse
    {
        $result = $this->whatsappService->logout($this->getSessionId());

        return response()->json($result);
    }

    /**
     * Send test message to confirm connection.
     */
    public function sendTest(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => ['required', 'string'],
            'message' => ['nullable', 'string'],
        ]);

        $phone = WhatsAppGatewayManager::normalizePhone($request->string('phone')->toString());
        $text = $request->filled('message')
            ? $request->string('message')->toString()
            : 'Halo! Ini adalah pesan uji coba dari Seruwit WA Gateway. Nomor WhatsApp bisnis Anda berhasil terhubung.';

        $result = $this->whatsappService->sendText($this->getSessionId(), $phone, $text);

        return response()->json($result);
    }
}
