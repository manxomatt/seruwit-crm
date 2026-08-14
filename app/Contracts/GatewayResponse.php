<?php

namespace App\Contracts;

class GatewayResponse
{
    public function __construct(
        public readonly ?string $paymentUrl,
        public readonly array $data = [],
    ) {}
}
