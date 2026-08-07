<?php

namespace Modules\Rental\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalExtension;
use Modules\Rental\Models\RentalExtensionRequest;

/**
 * Shared extension apply + passenger request helpers.
 */
class RentalExtensionService
{
    public function __construct(
        private readonly RentalInvoiceService $invoices,
        private readonly RentalAccountingService $accounting,
    ) {}

    /**
     * @return array{extended_periods: int, additional_amount: float}
     */
    public function quote(Rental $rental, string $newEndDate): array
    {
        $this->assertExtendable($rental, $newEndDate);

        $extendedPeriods = Rental::computePeriods(
            $rental->end_date->copy()->addDay()->toDateString(),
            $newEndDate,
            $rental->period_type,
        );
        $additionalAmount = round($extendedPeriods * (float) $rental->rate_per_period, 2);

        return [
            'extended_periods' => $extendedPeriods,
            'additional_amount' => $additionalAmount,
        ];
    }

    public function apply(Rental $rental, string $newEndDate, ?string $notes = null): RentalExtension
    {
        $quote = $this->quote($rental, $newEndDate);
        $originalEnd = $rental->end_date->toDateString();

        return DB::transaction(function () use ($rental, $newEndDate, $notes, $quote, $originalEnd): RentalExtension {
            $extension = $rental->extensions()->create([
                'original_end_date' => $originalEnd,
                'new_end_date' => $newEndDate,
                'extended_periods' => $quote['extended_periods'],
                'additional_amount' => $quote['additional_amount'],
                'notes' => $notes,
            ]);

            $rental->update([
                'end_date' => $newEndDate,
                'total_periods' => $rental->total_periods + $quote['extended_periods'],
                'base_amount' => (float) $rental->base_amount + $quote['additional_amount'],
                'total_amount' => (float) $rental->total_amount + $quote['additional_amount'],
            ]);

            $this->invoices->invoiceExtension($rental->fresh(), $extension);
            $this->accounting->issueDraftInvoices($rental->fresh());

            return $extension->fresh();
        });
    }

    public function requestFromPassenger(
        Rental $rental,
        string $newEndDate,
        string $channel,
        ?string $notes = null,
    ): RentalExtensionRequest {
        if ($rental->status !== Rental::STATUS_ACTIVE) {
            throw ValidationException::withMessages([
                'booking' => __('rental.public.extend_active_only'),
            ]);
        }

        $pending = RentalExtensionRequest::query()
            ->where('rental_id', $rental->id)
            ->where('status', RentalExtensionRequest::STATUS_PENDING)
            ->exists();

        if ($pending) {
            throw ValidationException::withMessages([
                'new_end_date' => __('rental.public.extend_request_pending'),
            ]);
        }

        $quote = $this->quote($rental, $newEndDate);

        return RentalExtensionRequest::query()->create([
            'rental_id' => $rental->id,
            'requested_end_date' => $newEndDate,
            'estimated_periods' => $quote['extended_periods'],
            'estimated_amount' => $quote['additional_amount'],
            'status' => RentalExtensionRequest::STATUS_PENDING,
            'channel' => $channel,
            'notes' => $notes,
        ]);
    }

    public function approveRequest(RentalExtensionRequest $request, ?int $reviewedBy = null, ?string $staffNotes = null): RentalExtension
    {
        if ($request->status !== RentalExtensionRequest::STATUS_PENDING) {
            throw ValidationException::withMessages([
                'request' => __('rental.errors.extend_request_not_pending'),
            ]);
        }

        $rental = $request->rental()->firstOrFail();
        $extension = $this->apply(
            $rental,
            $request->requested_end_date->toDateString(),
            $request->notes,
        );

        $request->update([
            'status' => RentalExtensionRequest::STATUS_APPROVED,
            'staff_notes' => $staffNotes,
            'reviewed_by' => $reviewedBy,
            'reviewed_at' => now(),
        ]);

        return $extension;
    }

    public function rejectRequest(RentalExtensionRequest $request, ?int $reviewedBy = null, ?string $staffNotes = null): RentalExtensionRequest
    {
        if ($request->status !== RentalExtensionRequest::STATUS_PENDING) {
            throw ValidationException::withMessages([
                'request' => __('rental.errors.extend_request_not_pending'),
            ]);
        }

        $request->update([
            'status' => RentalExtensionRequest::STATUS_REJECTED,
            'staff_notes' => $staffNotes,
            'reviewed_by' => $reviewedBy,
            'reviewed_at' => now(),
        ]);

        return $request->fresh();
    }

    private function assertExtendable(Rental $rental, string $newEndDate): void
    {
        if ($rental->status !== Rental::STATUS_ACTIVE) {
            throw ValidationException::withMessages([
                'booking' => __('rental.public.extend_active_only'),
            ]);
        }

        if ($rental->end_date === null || $newEndDate <= $rental->end_date->toDateString()) {
            throw ValidationException::withMessages([
                'new_end_date' => __('rental.validation.extend_end_after_current'),
            ]);
        }

        $rental->loadMissing('vehicle');
        $reasons = Rental::vehicleAvailabilityReasons(
            $rental->vehicle,
            $rental->start_date->toDateString(),
            $newEndDate,
            $rental->id,
        );

        if ($reasons !== []) {
            throw ValidationException::withMessages([
                'new_end_date' => $reasons[0],
            ]);
        }
    }
}
