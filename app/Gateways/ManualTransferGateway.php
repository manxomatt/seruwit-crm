<?php

namespace App\Gateways;

use App\Contracts\GatewayResponse;
use App\Contracts\PaymentGateway;
use App\Models\PaymentOrder;
use Illuminate\Http\Request;

class ManualTransferGateway implements PaymentGateway
{
    public function initiate(PaymentOrder $order): GatewayResponse
    {
        $instructions = config('payment.manual_transfer', []);

        return new GatewayResponse(
            paymentUrl: null,
            data: [
                'bank_name' => $order->bank_name ?? $instructions['bank_name'] ?? null,
                'bank_account_number' => $order->bank_account_number ?? $instructions['bank_account_number'] ?? null,
                'bank_account_name' => $order->bank_account_name ?? $instructions['bank_account_name'] ?? null,
            ],
        );
    }

    public function verify(PaymentOrder $order): bool
    {
        return false;
    }

    public function handleWebhook(Request $request): void
    {
        //
    }
}
