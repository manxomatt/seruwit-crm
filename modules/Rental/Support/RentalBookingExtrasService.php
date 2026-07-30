<?php

namespace Modules\Rental\Support;

use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalCharge;
use Modules\Rental\Models\RentalInsurancePackage;

/**
 * Applies one-way fee and insurance package charges when a rental is confirmed.
 */
class RentalBookingExtrasService
{
    public function __construct(private readonly RentalInvoiceService $invoices) {}

    public function applyOnConfirm(Rental $rental): void
    {
        $this->ensureOneWayCharge($rental);
        $this->ensureInsuranceCharge($rental);
    }

    public function ensureOneWayCharge(Rental $rental): void
    {
        $amount = (float) ($rental->one_way_fee_amount ?? 0);

        if ($amount < 0.01) {
            return;
        }

        if ($this->hasAddonCharge($rental, RentalAddonCatalog::ONE_WAY)) {
            return;
        }

        $this->createAndInvoiceAddon(
            $rental,
            RentalAddonCatalog::ONE_WAY,
            $amount,
            RentalAddonCatalog::defaultDescription(RentalAddonCatalog::ONE_WAY),
        );
    }

    public function ensureInsuranceCharge(Rental $rental): void
    {
        if (! $rental->insurance_package_id) {
            return;
        }

        $package = $rental->insurancePackage
            ?? RentalInsurancePackage::query()->find($rental->insurance_package_id);

        if (! $package || ! $package->is_active) {
            return;
        }

        $code = $package->addonCode();

        if ($this->hasAddonCharge($rental, $code)) {
            return;
        }

        $periods = max(1, (int) $rental->total_periods);
        $amount = round((float) $package->amount * $periods, 2);

        if ($amount < 0.01) {
            return;
        }

        $description = sprintf(
            '%s × %d %s',
            $package->name,
            $periods,
            __('rental.period_type.'.match ($rental->period_type) {
                'weekly' => 'week',
                'monthly' => 'month',
                default => 'day',
            }),
        );

        $this->createAndInvoiceAddon($rental, $code, $amount, $description);
    }

    private function hasAddonCharge(Rental $rental, string $addonCode): bool
    {
        return $rental->charges()
            ->where('kind', RentalCharge::KIND_ADDON)
            ->where('addon_code', $addonCode)
            ->exists();
    }

    private function createAndInvoiceAddon(Rental $rental, string $code, float $amount, string $description): void
    {
        $charge = RentalCharge::query()->create([
            'rental_id' => $rental->id,
            'kind' => RentalCharge::KIND_ADDON,
            'addon_code' => $code,
            'amount' => $amount,
            'description' => $description,
        ]);

        $rental->recalculateTotalAmount();
        $this->invoices->invoiceAddon($rental->fresh(), $charge);
    }
}
