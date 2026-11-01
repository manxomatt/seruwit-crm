<?php

namespace Modules\Receivables\Contracts;

use Modules\Receivables\Models\GatewayCharge;

/**
 * Contract for any domain model (Invoice, Rental, ShuttleBooking, etc.) that
 * can be paid via the Midtrans payment gateway without coupling Receivables
 * to Vertical modules.
 */
interface PayableViaGatewayContract
{
    public function getGatewayPurpose(): string;

    public function getGatewayAmount(): float;

    public function getGatewayItemName(): string;

    public function getGatewayPartnerId(): ?int;

    /**
     * @return array{name?: string|null, email?: string|null, phone?: string|null}
     */
    public function getGatewayCustomerDetails(): array;

    public function getGatewayFinishPath(): string;

    /**
     * @param  array<string, mixed>  $notification
     */
    public function onGatewayPaymentSettled(GatewayCharge $charge, array $notification, string $mappedPaymentMethod): void;
}
