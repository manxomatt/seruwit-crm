<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalDamage;

class RentalActionController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Confirm a draft rental — blocks the vehicle for the booking period.
     */
    public function confirm(Rental $rental): RedirectResponse
    {
        abort_if($rental->status !== Rental::STATUS_DRAFT, 422, 'Only draft rentals can be confirmed.');

        $rental->update([
            'status' => Rental::STATUS_CONFIRMED,
            'confirmed_by' => auth()->id(),
            'confirmed_at' => now(),
        ]);

        return back()->with('success', 'Rental confirmed.');
    }

    /**
     * Mark vehicle as checked out — rental becomes active.
     */
    public function checkout(Request $request, Rental $rental): RedirectResponse
    {
        abort_if($rental->status !== Rental::STATUS_CONFIRMED, 422, 'Only confirmed rentals can be checked out.');

        $request->validate([
            'start_odometer' => ['nullable', 'integer', 'min:0'],
        ]);

        $rental->update([
            'status' => Rental::STATUS_ACTIVE,
            'checked_out_at' => now(),
            'start_odometer' => $request->start_odometer,
        ]);

        return back()->with('success', 'Vehicle checked out. Rental is now active.');
    }

    /**
     * Record vehicle return — computes excess km and final amount.
     */
    public function return(Request $request, Rental $rental): RedirectResponse
    {
        abort_if($rental->status !== Rental::STATUS_ACTIVE, 422, 'Only active rentals can be returned.');

        $request->validate([
            'actual_return_date' => ['required', 'date'],
            'end_odometer' => ['nullable', 'integer', 'min:0'],
            'deposit_returned' => ['boolean'],
        ]);

        $excessKm = null;
        $excessAmount = 0;

        if ($request->end_odometer && $rental->start_odometer && $rental->km_limit_per_period) {
            $totalKmDriven = $request->end_odometer - $rental->start_odometer;
            $allowedKm = $rental->km_limit_per_period * $rental->total_periods;
            $excessKm = max(0, $totalKmDriven - $allowedKm);
            $excessAmount = $excessKm * (float) ($rental->excess_km_rate ?? 0);
        }

        $rental->update([
            'status' => Rental::STATUS_RETURNED,
            'actual_return_date' => $request->actual_return_date,
            'end_odometer' => $request->end_odometer,
            'excess_km' => $excessKm,
            'excess_amount' => $excessAmount,
            'deposit_returned' => $request->boolean('deposit_returned', false),
            'total_amount' => (float) $rental->base_amount + $excessAmount,
            'returned_at' => now(),
        ]);

        return back()->with('success', 'Vehicle returned. Review damages before completing.');
    }

    /**
     * Complete a returned rental.
     */
    public function complete(Rental $rental): RedirectResponse
    {
        abort_if($rental->status !== Rental::STATUS_RETURNED, 422, 'Only returned rentals can be completed.');

        $rental->update([
            'status' => Rental::STATUS_COMPLETED,
            'completed_at' => now(),
        ]);

        return back()->with('success', 'Rental completed.');
    }

    /**
     * Cancel a draft or confirmed rental.
     */
    public function cancel(Request $request, Rental $rental): RedirectResponse
    {
        abort_if(
            ! in_array($rental->status, [Rental::STATUS_DRAFT, Rental::STATUS_CONFIRMED]),
            422,
            'Only draft or confirmed rentals can be cancelled.',
        );

        $request->validate([
            'cancelled_reason' => ['required', 'string', 'max:500'],
        ]);

        $rental->update([
            'status' => Rental::STATUS_CANCELLED,
            'cancelled_reason' => $request->cancelled_reason,
        ]);

        return back()->with('success', 'Rental cancelled.');
    }

    /**
     * Extend an active rental's end date.
     */
    public function extend(Request $request, Rental $rental): RedirectResponse
    {
        abort_if($rental->status !== Rental::STATUS_ACTIVE, 422, 'Only active rentals can be extended.');

        $request->validate([
            'new_end_date' => ['required', 'date', 'after:end_date'],
            'notes' => ['nullable', 'string'],
        ]);

        $originalEnd = $rental->end_date->toDateString();
        $newEnd = $request->new_end_date;
        $extendedPeriods = Rental::computePeriods(
            $rental->end_date->addDay()->toDateString(),
            $newEnd,
            $rental->period_type,
        );
        $additionalAmount = $extendedPeriods * (float) $rental->rate_per_period;

        $rental->extensions()->create([
            'original_end_date' => $originalEnd,
            'new_end_date' => $newEnd,
            'extended_periods' => $extendedPeriods,
            'additional_amount' => $additionalAmount,
            'notes' => $request->notes,
        ]);

        $rental->update([
            'end_date' => $newEnd,
            'total_periods' => $rental->total_periods + $extendedPeriods,
            'base_amount' => (float) $rental->base_amount + $additionalAmount,
            'total_amount' => (float) $rental->total_amount + $additionalAmount,
        ]);

        return back()->with('success', 'Rental extended.');
    }

    /**
     * Record a damage item found on return.
     */
    public function storeDamage(Request $request, Rental $rental): RedirectResponse
    {
        abort_if(
            ! in_array($rental->status, [Rental::STATUS_ACTIVE, Rental::STATUS_RETURNED]),
            422,
            'Damages can only be recorded on active or returned rentals.',
        );

        $request->validate([
            'description' => ['required', 'string'],
            'amount' => ['required', 'numeric', 'min:0'],
            'photo_path' => ['nullable', 'string'],
        ]);

        $rental->damages()->create([
            'description' => $request->description,
            'amount' => $request->amount,
            'photo_path' => $request->photo_path,
            'reported_at' => now(),
        ]);

        return back()->with('success', 'Damage recorded.');
    }

    /**
     * Remove a damage record.
     */
    public function destroyDamage(Rental $rental, RentalDamage $damage): RedirectResponse
    {
        abort_if($damage->rental_id !== $rental->id, 403);

        $damage->delete();

        return back()->with('success', 'Damage record removed.');
    }
}
