<?php

namespace Modules\Receivables\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Receivables\Models\PaymentGatewayConfig;
use Modules\Receivables\Support\GatewayCheckoutService;

class PaymentGatewayConfigController extends Controller
{
    public function edit(GatewayCheckoutService $gateway): Response
    {
        $config = $gateway->config();

        return Inertia::render('Modules/Receivables/Gateway/Settings', [
            'config' => $config->toPublicArray(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'is_enabled' => ['required', 'boolean'],
            'is_production' => ['required', 'boolean'],
            'merchant_id' => ['nullable', 'string', 'max:100'],
            'server_key' => ['nullable', 'string', 'max:255'],
            'client_key' => ['nullable', 'string', 'max:255'],
        ]);

        $config = PaymentGatewayConfig::current();

        $attributes = [
            'provider' => PaymentGatewayConfig::PROVIDER_MIDTRANS,
            'is_enabled' => $validated['is_enabled'],
            'is_production' => $validated['is_production'],
            'merchant_id' => $validated['merchant_id'] ?? null,
        ];

        if (filled($validated['server_key'] ?? null)) {
            $attributes['server_key'] = $validated['server_key'];
        }

        if (filled($validated['client_key'] ?? null)) {
            $attributes['client_key'] = $validated['client_key'];
        }

        $config->update($attributes);

        return back()->with('success', __('receivables.gateway.config_saved'));
    }
}
