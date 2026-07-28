<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Modules\Invoicing\Models\Invoice;
use Modules\Rental\Http\Requests\ReceiveRentalDepositRequest;
use Modules\Rental\Http\Requests\SettleRentalDepositRequest;
use Modules\Rental\Http\Requests\StoreRentalAddonChargeRequest;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalCharge;
use Modules\Rental\Models\RentalDamage;
use Modules\Rental\Notifications\RentalLifecycleMailNotification;
use Modules\Rental\Support\RentalAccountingService;
use Modules\Rental\Support\RentalAddonCatalog;
use Modules\Rental\Support\RentalHandoverChecklist;
use Modules\Rental\Support\RentalInvoiceService;
use Modules\Rental\Support\RentalMailer;

class RentalActionController extends Controller
{
    public function __construct(
        private readonly RentalInvoiceService $invoices,
        private readonly RentalAccountingService $accounting,
        private readonly RentalMailer $mailer,
    ) {}

    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Confirm a draft rental — blocks the vehicle and raises the base invoice.
     */
    public function confirm(Request $request, Rental $rental): RedirectResponse
    {
        abort_if($rental->status !== Rental::STATUS_DRAFT, 422, __('rental.errors.confirm_draft_only'));

        $request->validate([
            'payment_method' => ['nullable', 'string', Rule::in(['cash', 'transfer', 'giro', 'card', 'other'])],
            'company_bank_account_id' => ['nullable', 'integer', 'min:1'],
        ]);

        $rental->update([
            'status' => Rental::STATUS_CONFIRMED,
            'confirmed_by' => auth()->id(),
            'confirmed_at' => now(),
        ]);

        if ((float) $rental->deposit_amount <= 0) {
            $rental->settleDeposit([
                'deposit_applied_amount' => 0,
                'deposit_refunded_amount' => 0,
            ]);
        } else {
            $this->accounting->receiveDeposit($rental->fresh(), [
                'payment_method' => $request->input('payment_method', 'cash'),
                'company_bank_account_id' => $request->input('company_bank_account_id'),
            ]);
        }

        $this->invoices->invoiceBase($rental->fresh());

        $this->mailer->notify($rental->fresh(['vehicle', 'partner']), RentalLifecycleMailNotification::EVENT_CONFIRMED);

        return back()->with('success', __('rental.messages.confirmed'));
    }

    /**
     * Mark vehicle as checked out — rental becomes active.
     */
    public function checkout(Request $request, Rental $rental): RedirectResponse
    {
        abort_if($rental->status !== Rental::STATUS_CONFIRMED, 422, __('rental.errors.checkout_confirmed_only'));

        $request->validate([
            'start_odometer' => ['nullable', 'integer', 'min:0'],
            'start_fuel_level' => ['nullable', 'string', Rule::in(RentalHandoverChecklist::fuelLevels())],
            'checkout_checklist' => ['nullable', 'array'],
            'checkout_checklist.*' => ['boolean'],
            'checkout_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $rental->update([
            'status' => Rental::STATUS_ACTIVE,
            'checked_out_at' => now(),
            'start_odometer' => $request->start_odometer,
            'start_fuel_level' => $request->start_fuel_level,
            'checkout_checklist' => RentalHandoverChecklist::normalize($request->input('checkout_checklist')),
            'checkout_notes' => $request->checkout_notes,
        ]);

        $this->mailer->notify($rental->fresh(['vehicle', 'partner']), RentalLifecycleMailNotification::EVENT_CHECKED_OUT);

        return back()->with('success', __('rental.messages.checked_out'));
    }

    /**
     * Record vehicle return — computes excess km, invoices it, and optionally settles deposit.
     */
    public function return(Request $request, Rental $rental): RedirectResponse
    {
        abort_if($rental->status !== Rental::STATUS_ACTIVE, 422, __('rental.errors.return_active_only'));

        $request->validate([
            'actual_return_date' => ['required', 'date'],
            'end_odometer' => ['nullable', 'integer', 'min:0'],
            'end_fuel_level' => ['nullable', 'string', Rule::in(RentalHandoverChecklist::fuelLevels())],
            'return_checklist' => ['nullable', 'array'],
            'return_checklist.*' => ['boolean'],
            'return_notes' => ['nullable', 'string', 'max:1000'],
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

        $overdueDays = Rental::computeOverdueDays(
            $rental->end_date->toDateString(),
            $request->actual_return_date,
        );
        $lateFeeAmount = $overdueDays * $rental->resolveLateFeePerDay();

        $rental->update([
            'status' => Rental::STATUS_RETURNED,
            'actual_return_date' => $request->actual_return_date,
            'end_odometer' => $request->end_odometer,
            'end_fuel_level' => $request->end_fuel_level,
            'return_checklist' => RentalHandoverChecklist::normalize($request->input('return_checklist')),
            'return_notes' => $request->return_notes,
            'excess_km' => $excessKm,
            'excess_amount' => $excessAmount,
            'overdue_days' => $overdueDays,
            'late_fee_amount' => $lateFeeAmount,
            'returned_at' => now(),
        ]);

        $rental->recalculateTotalAmount();
        $rental->refresh();

        $this->invoices->invoiceExcessKm($rental);
        $this->invoices->invoiceLateFee($rental);

        if ((float) $rental->deposit_amount <= 0) {
            $rental->settleDeposit([
                'deposit_applied_amount' => 0,
                'deposit_refunded_amount' => 0,
            ]);
        } elseif ($request->boolean('deposit_returned')) {
            // Shortcut: full refund on return (legacy checkbox).
            $this->accounting->settleDeposit($rental->fresh(), [
                'deposit_applied_amount' => 0,
                'deposit_refunded_amount' => (float) $rental->deposit_amount,
            ]);
        }

        $this->mailer->notify($rental->fresh(['vehicle', 'partner']), RentalLifecycleMailNotification::EVENT_RETURNED);

        return back()->with('success', __('rental.messages.returned'));
    }

    /**
     * Record that the customer deposit cash was received (if not auto-posted on confirm).
     */
    public function receiveDeposit(ReceiveRentalDepositRequest $request, Rental $rental): RedirectResponse
    {
        abort_if(
            ! in_array($rental->status, [
                Rental::STATUS_CONFIRMED,
                Rental::STATUS_ACTIVE,
                Rental::STATUS_RETURNED,
            ], true),
            422,
            __('rental.errors.deposit_receive_status_only'),
        );

        abort_if((float) $rental->deposit_amount < 0.005, 422, __('rental.errors.deposit_none'));
        abort_if($rental->deposit_received_at !== null, 422, __('rental.errors.deposit_already_received'));
        abort_if($rental->deposit_status === Rental::DEPOSIT_SETTLED, 422, __('rental.errors.deposit_already_settled'));

        $this->accounting->receiveDeposit($rental, $request->validated());

        return back()->with('success', __('rental.messages.deposit_received'));
    }

    /**
     * Settle deposit: applied toward charges/damages + refunded to customer must equal deposit.
     */
    public function settleDeposit(SettleRentalDepositRequest $request, Rental $rental): RedirectResponse
    {
        abort_if(
            ! in_array($rental->status, [Rental::STATUS_RETURNED, Rental::STATUS_COMPLETED], true),
            422,
            __('rental.errors.settle_deposit_returned_only'),
        );

        abort_if($rental->deposit_status === Rental::DEPOSIT_SETTLED, 422, __('rental.errors.deposit_already_settled'));

        $this->accounting->settleDeposit($rental, $request->validated());

        return back()->with('success', __('rental.messages.deposit_settled'));
    }

    /**
     * Complete a returned rental — deposit must already be settled; issues remaining drafts.
     */
    public function complete(Rental $rental): RedirectResponse
    {
        abort_if($rental->status !== Rental::STATUS_RETURNED, 422, __('rental.errors.complete_returned_only'));
        abort_if(! $rental->isDepositSettled(), 422, __('rental.errors.complete_deposit_unsettled'));

        $this->accounting->issueDraftInvoices($rental);

        $rental->update([
            'status' => Rental::STATUS_COMPLETED,
            'completed_at' => now(),
        ]);

        return back()->with('success', __('rental.messages.completed'));
    }

    /**
     * Cancel a draft or confirmed rental.
     */
    public function cancel(Request $request, Rental $rental): RedirectResponse
    {
        abort_if(
            ! in_array($rental->status, [Rental::STATUS_DRAFT, Rental::STATUS_CONFIRMED]),
            422,
            __('rental.errors.cancel_draft_confirmed_only'),
        );

        $request->validate([
            'cancelled_reason' => ['required', 'string', 'max:500'],
        ]);

        if ($rental->status === Rental::STATUS_CONFIRMED) {
            $this->accounting->refundDepositOnCancel($rental->fresh());
        }

        $rental->update([
            'status' => Rental::STATUS_CANCELLED,
            'cancelled_reason' => $request->cancelled_reason,
        ]);

        return back()->with('success', __('rental.messages.cancelled'));
    }

    /**
     * Extend an active rental's end date and invoice the extension.
     */
    public function extend(Request $request, Rental $rental): RedirectResponse
    {
        abort_if($rental->status !== Rental::STATUS_ACTIVE, 422, __('rental.errors.extend_active_only'));

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

        $extension = $rental->extensions()->create([
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

        $this->invoices->invoiceExtension($rental->fresh(), $extension);

        return back()->with('success', __('rental.messages.extended'));
    }

    /**
     * Record a damage item and raise a damage invoice.
     */
    public function storeDamage(Request $request, Rental $rental): RedirectResponse
    {
        abort_if(
            ! in_array($rental->status, [Rental::STATUS_ACTIVE, Rental::STATUS_RETURNED]),
            422,
            __('rental.errors.damage_active_returned_only'),
        );

        $request->validate([
            'description' => ['required', 'string'],
            'amount' => ['required', 'numeric', 'min:0'],
            'photo_path' => ['nullable', 'string'],
        ]);

        $damage = $rental->damages()->create([
            'description' => $request->description,
            'amount' => $request->amount,
            'photo_path' => $request->photo_path,
            'reported_at' => now(),
        ]);

        $rental->recalculateTotalAmount();
        $this->invoices->invoiceDamage($rental->fresh(), $damage);

        return back()->with('success', __('rental.messages.damage_recorded'));
    }

    /**
     * Remove a damage record — blocked once its invoice has left draft.
     */
    public function destroyDamage(Rental $rental, RentalDamage $damage): RedirectResponse
    {
        abort_if($damage->rental_id !== $rental->id, 403);

        $damage->load('charge.invoiceLine.invoice');
        $charge = $damage->charge;

        if ($charge && $this->invoices->chargeHasActiveInvoice($charge)) {
            $invoice = $charge->invoiceLine?->invoice;

            if ($invoice !== null && $invoice->status !== Invoice::STATUS_DRAFT) {
                return back()->with('error', __('rental.errors.damage_already_invoiced'));
            }

            $charge->invoiceLine?->delete();

            if ($invoice !== null) {
                $invoice->recalculate();

                if ($invoice->lines()->count() === 0) {
                    $invoice->delete();
                }
            }
        }

        $charge?->delete();
        $damage->delete();
        $rental->recalculateTotalAmount();

        return back()->with('success', __('rental.messages.damage_removed'));
    }

    /**
     * Add a billable extra (insurance, baby seat, chauffeur, …) and raise a draft invoice.
     */
    public function storeAddon(StoreRentalAddonChargeRequest $request, Rental $rental): RedirectResponse
    {
        abort_if(
            ! in_array($rental->status, [
                Rental::STATUS_CONFIRMED,
                Rental::STATUS_ACTIVE,
                Rental::STATUS_RETURNED,
            ], true),
            422,
            __('rental.errors.addon_status_only'),
        );

        $code = $request->string('addon_code')->toString();
        $description = trim((string) $request->input('description', ''));

        if ($description === '') {
            $description = RentalAddonCatalog::defaultDescription($code);
        }

        $charge = RentalCharge::query()->create([
            'rental_id' => $rental->id,
            'kind' => RentalCharge::KIND_ADDON,
            'addon_code' => $code,
            'amount' => $request->input('amount'),
            'description' => $description,
        ]);

        $rental->recalculateTotalAmount();
        $this->invoices->invoiceAddon($rental->fresh(), $charge);

        return back()->with('success', __('rental.messages.addon_recorded'));
    }

    /**
     * Remove an add-on charge — blocked once its invoice has left draft.
     */
    public function destroyAddon(Rental $rental, RentalCharge $charge): RedirectResponse
    {
        abort_if($charge->rental_id !== $rental->id, 403);
        abort_if($charge->kind !== RentalCharge::KIND_ADDON, 422, __('rental.errors.addon_only'));

        $charge->load('invoiceLine.invoice');

        if ($this->invoices->chargeHasActiveInvoice($charge)) {
            $invoice = $charge->invoiceLine?->invoice;

            if ($invoice !== null && $invoice->status !== Invoice::STATUS_DRAFT) {
                return back()->with('error', __('rental.errors.addon_already_invoiced'));
            }

            $charge->invoiceLine?->delete();

            if ($invoice !== null) {
                $invoice->recalculate();

                if ($invoice->lines()->count() === 0) {
                    $invoice->delete();
                }
            }
        }

        $charge->delete();
        $rental->recalculateTotalAmount();

        return back()->with('success', __('rental.messages.addon_removed'));
    }
}
