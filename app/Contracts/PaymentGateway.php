<?php

namespace App\Contracts;

use App\Models\PaymentOrder;
use Illuminate\Http\Request;

interface PaymentGateway
{
    public function initiate(PaymentOrder $order): GatewayResponse;

    public function verify(PaymentOrder $order): bool;

    public function handleWebhook(Request $request): void;
}
