<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Modules\Fleet\Models\Vehicle;
use Modules\Invoicing\Models\Invoice;
use Modules\Rental\Http\Requests\ReceiveRentalDepositRequest;
use Modules\Rental\Http\Requests\SettleRentalDepositRequest;
use Modules\Rental\Http\Requests\StoreRentalAddonChargeRequest;
use Modules\Rental\Http\Requests\SwapRentalVehicleRequest;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalCharge;
use Modules\Rental\Models\RentalDamage;
use Modules\Rental\Models\RentalExtensionRequest;
use Modules\Rental\Models\RentalVehicleSwap;
use Modules\Rental\Notifications\RentalLifecycleMailNotification;
use Modules\Rental\Support\RentalAccountingService;
use Modules\Rental\Support\RentalAddonCatalog;
use Modules\Rental\Support\RentalConfirmationService;
use Modules\Rental\Support\RentalExtensionService;
use Modules\Rental\Support\RentalHandoverChecklist;
use Modules\Rental\Support\RentalHandoverMedia;
use Modules\Rental\Support\RentalInvoiceService;
use Modules\Rental\Support\RentalMailer;

class RentalActionController extends Controller
{
    public function __construct(
        private readonly RentalInvoiceService $invoices,
        private readonly RentalAccountingService $accounting,
        private readonly RentalMailer $mailer,
        private readonly RentalHandoverMedia $handoverMedia,
        private readonly RentalConfirmationService $confirmation,
        private readonly RentalExtensionService $extensions,
    ) {}

    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Confirm a draft / pending rental — blocks the vehicle and raises the base invoice.
     */
    public function confirm(Request $request, Rental $rental): RedirectResponse
    {
        abort_if(
            ! in_array($rental->status, Rental::confirmableStatuses(), true),
            422,
            __('rental.errors.confirm_draft_only'),
        );

        $request->validate([
            'payment_method' => ['nullable', 'string', Rule::in(['cash', 'transfer', 'giro', 'card', 'other'])],
            'company_bank_account_id' => ['nullable', 'integer', 'min:1'],
            // When true, staff confirms cash/transfer deposit was collected at the counter.
            'deposit_collected' => ['sometimes', 'boolean'],
        ]);

        if ($this->hasPendingDepositCharge($rental)) {
            return back()->withErrors([
                'deposit' => __('rental.errors.deposit_pending_gateway'),
            ]);
        }

        try {
            $this->confirmation->confirm($rental, [
                'payment_method' => $request->input('payment_method'),
                'company_bank_account_id' => $request->input('company_bank_account_id'),
                'deposit_collected' => $request->boolean('deposit_collected'),
                'confirmed_by' => auth()->id(),
            ]);
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', __('rental.messages.confirmed'));
    }

    /**
     * Redirect to Midtrans Snap to collect the rental deposit online.
     */
    public function payDepositOnline(Rental $rental): RedirectResponse
    {
        abort_unless(
            class_exists(\Modules\Receivables\Support\GatewayCheckoutService::class),
            404,
        );

        $rental->loadMissing('partner');
        $charge = app(\Modules\Receivables\Support\GatewayCheckoutService::class)
            ->createRentalDepositCharge($rental);

        return redirect()->away($charge->redirect_url);
    }

    /**
     * Mark vehicle as checked out — rental becomes active.
     */
    public function checkout(Request $request, Rental $rental): RedirectResponse
    {
        abort_if($rental->status !== Rental::STATUS_CONFIRMED, 422, __('rental.errors.checkout_confirmed_only'));

        if ((float) $rental->deposit_amount > 0 && ! $rental->isDepositReceived()) {
            throw ValidationException::withMessages([
                'deposit' => __('rental.errors.checkout_deposit_required'),
            ]);
        }

        $hasCustomerSignature = filled($rental->pickup_customer_signature_path) || filled($rental->checkout_signature_path);

        $request->validate([
            'start_odometer' => ['nullable', 'integer', 'min:0'],
            'start_fuel_level' => ['nullable', 'string', Rule::in(RentalHandoverChecklist::fuelLevels())],
            'checkout_checklist' => ['nullable', 'array'],
            'checkout_checklist.*' => ['boolean'],
            'checkout_notes' => ['nullable', 'string', 'max:1000'],
            'checkout_photos' => ['required', 'array', 'min:1', 'max:5'],
            'checkout_photos.*' => ['string', 'starts_with:data:image/'],
            'checkout_signature' => [$hasCustomerSignature ? 'nullable' : 'required', 'string', function ($attribute, $value, $fail) use ($hasCustomerSignature): void {
                if ($value && ! str_starts_with((string) $value, 'data:image/')) {
                    if (! $hasCustomerSignature) {
                        $fail(__('rental.errors.handover_signature_required'));
                    }
                }
            }],
            'checkout_staff_signature' => ['nullable', 'string'],
        ], [
            'checkout_photos.required' => __('rental.errors.handover_photo_required'),
            'checkout_photos.min' => __('rental.errors.handover_photo_required'),
            'checkout_photos.max' => __('rental.errors.handover_photo_max', ['max' => 5]),
            'checkout_signature.required' => __('rental.errors.handover_signature_required'),
        ]);

        $photos = $this->handoverMedia->storePhotos($request->input('checkout_photos', []));
        $rawSignature = $request->input('checkout_signature');
        $signaturePath = ($rawSignature && str_starts_with($rawSignature, 'data:image/'))
            ? $this->handoverMedia->storeSignature($rawSignature)
            : null;

        $rawStaffSig = $request->input('checkout_staff_signature');
        $staffSignaturePath = ($rawStaffSig && str_starts_with($rawStaffSig, 'data:image/'))
            ? $this->handoverMedia->storeSignature($rawStaffSig)
            : null;

        $rental->update([
            'status' => Rental::STATUS_ACTIVE,
            'checked_out_at' => now(),
            'start_odometer' => $request->start_odometer,
            'start_fuel_level' => $request->start_fuel_level,
            'checkout_checklist' => RentalHandoverChecklist::normalize($request->input('checkout_checklist')),
            'checkout_notes' => $request->checkout_notes,
            'checkout_photos' => $photos,
            'checkout_signature_path' => $signaturePath ?: ($rental->pickup_customer_signature_path ?: $rental->checkout_signature_path),
            'checkout_staff_signature_path' => $staffSignaturePath,
            'checkout_signed_at' => now(),
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
            'return_photos' => ['required', 'array', 'min:1', 'max:5'],
            'return_photos.*' => ['string', 'starts_with:data:image/'],
            'return_signature' => ['required', 'string', 'starts_with:data:image/'],
        ], [
            'return_photos.required' => __('rental.errors.handover_photo_required'),
            'return_photos.min' => __('rental.errors.handover_photo_required'),
            'return_photos.max' => __('rental.errors.handover_photo_max', ['max' => 5]),
            'return_signature.required' => __('rental.errors.handover_signature_required'),
        ]);

        $photos = $this->handoverMedia->storePhotos($request->input('return_photos', []));
        $signaturePath = $this->handoverMedia->storeSignature($request->input('return_signature'));

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
            'return_photos' => $photos,
            'return_signature_path' => $signaturePath,
            'return_signed_at' => now(),
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
        $this->accounting->issueDraftInvoices($rental->fresh());

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
                Rental::STATUS_PENDING,
                Rental::STATUS_PENDING_RESERVED,
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

        if (in_array($rental->fresh()->status, [Rental::STATUS_PENDING, Rental::STATUS_PENDING_RESERVED], true)) {
            try {
                $this->confirmation->confirmAfterPaymentIfPending($rental->fresh());
            } catch (ValidationException $e) {
                return back()->withErrors($e->errors());
            }
        }

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
     * Cancel a draft / pending / confirmed rental (optionally charge cancellation fee).
     */
    public function cancel(Request $request, Rental $rental): RedirectResponse
    {
        abort_if(
            ! in_array($rental->status, Rental::cancellableStatuses(), true),
            422,
            __('rental.errors.cancel_draft_confirmed_only'),
        );

        $request->validate([
            'cancelled_reason' => ['required', 'string', 'max:500'],
            'charge_fee' => ['sometimes', 'boolean'],
        ]);

        $this->expirePendingDepositCharges($rental);

        try {
            $this->confirmation->cancel(
                $rental,
                $request->string('cancelled_reason')->toString(),
                $request->boolean('charge_fee'),
            );
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', __('rental.messages.cancelled'));
    }

    /**
     * Mark a confirmed (Open) booking as no-show, optionally charging the no-show fee.
     */
    public function markNoShow(Request $request, Rental $rental): RedirectResponse
    {
        $request->validate([
            'charge_fee' => ['sometimes', 'boolean'],
            'cancelled_reason' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $this->confirmation->markNoShow(
                $rental,
                $request->boolean('charge_fee'),
                $request->input('cancelled_reason'),
            );
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', __('rental.messages.no_show'));
    }

    /**
     * Charge cancellation / no-show fee later (cancelled → cancelled_paid, no_show → no_show_paid).
     */
    public function markFeePaid(Rental $rental): RedirectResponse
    {
        try {
            $this->confirmation->markFeePaid($rental);
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', __('rental.messages.fee_charged'));
    }

    /**
     * Extend an active rental's end date and invoice the extension.
     */
    public function extend(Request $request, Rental $rental): RedirectResponse
    {
        $request->validate([
            'new_end_date' => ['required', 'date', 'after:end_date'],
            'notes' => ['nullable', 'string'],
        ]);

        try {
            $this->extensions->apply(
                $rental,
                $request->string('new_end_date')->toString(),
                $request->input('notes'),
            );
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', __('rental.messages.extended'));
    }

    public function approveExtensionRequest(Request $request, Rental $rental, RentalExtensionRequest $extensionRequest): RedirectResponse
    {
        abort_unless((int) $extensionRequest->rental_id === (int) $rental->id, 404);

        $data = $request->validate([
            'staff_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $this->extensions->approveRequest(
                $extensionRequest,
                reviewedBy: $request->user()?->id,
                staffNotes: $data['staff_notes'] ?? null,
            );
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', __('rental.messages.extend_request_approved'));
    }

    public function rejectExtensionRequest(Request $request, Rental $rental, RentalExtensionRequest $extensionRequest): RedirectResponse
    {
        abort_unless((int) $extensionRequest->rental_id === (int) $rental->id, 404);

        $data = $request->validate([
            'staff_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $this->extensions->rejectRequest(
                $extensionRequest,
                reviewedBy: $request->user()?->id,
                staffNotes: $data['staff_notes'] ?? null,
            );
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', __('rental.messages.extend_request_rejected'));
    }

    /**
     * Mid-rental vehicle swap — keeps the booking window, switches the unit.
     */
    public function swapVehicle(SwapRentalVehicleRequest $request, Rental $rental): RedirectResponse
    {
        abort_if($rental->status !== Rental::STATUS_ACTIVE, 422, __('rental.errors.swap_active_only'));

        $toVehicle = Vehicle::query()->findOrFail($request->integer('to_vehicle_id'));
        $reasons = Rental::vehicleAvailabilityReasons(
            $toVehicle,
            $rental->start_date->toDateString(),
            $rental->end_date->toDateString(),
            $rental->id,
        );

        if ($reasons !== []) {
            return back()->withErrors(['to_vehicle_id' => $reasons[0]]);
        }

        $fromVehicleId = (int) $rental->vehicle_id;

        RentalVehicleSwap::query()->create([
            'rental_id' => $rental->id,
            'from_vehicle_id' => $fromVehicleId,
            'to_vehicle_id' => $toVehicle->id,
            'odometer_km' => $request->input('odometer_km'),
            'notes' => $request->input('notes'),
            'swapped_by' => auth()->id(),
            'swapped_at' => now(),
        ]);

        $rental->update(['vehicle_id' => $toVehicle->id]);

        return back()->with('success', __('rental.messages.vehicle_swapped'));
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
        $this->accounting->issueDraftInvoices($rental->fresh());

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
        $this->accounting->issueDraftInvoices($rental->fresh());

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

    private function hasPendingDepositCharge(Rental $rental): bool
    {
        if (! class_exists(\Modules\Receivables\Models\GatewayCharge::class)) {
            return false;
        }

        if (! \App\Modules\Facades\Modules::available('receivables') || ! Schema::hasTable('gateway_charges')) {
            return false;
        }

        return \Modules\Receivables\Models\GatewayCharge::query()
            ->where('rental_id', $rental->id)
            ->where('purpose', \Modules\Receivables\Models\GatewayCharge::PURPOSE_RENTAL_DEPOSIT)
            ->where('status', \Modules\Receivables\Models\GatewayCharge::STATUS_PENDING)
            ->exists();
    }

    private function expirePendingDepositCharges(Rental $rental): void
    {
        if (! class_exists(\Modules\Receivables\Models\GatewayCharge::class)) {
            return;
        }

        if (! \App\Modules\Facades\Modules::available('receivables') || ! Schema::hasTable('gateway_charges')) {
            return;
        }

        \Modules\Receivables\Models\GatewayCharge::query()
            ->where('rental_id', $rental->id)
            ->where('purpose', \Modules\Receivables\Models\GatewayCharge::PURPOSE_RENTAL_DEPOSIT)
            ->where('status', \Modules\Receivables\Models\GatewayCharge::STATUS_PENDING)
            ->update(['status' => \Modules\Receivables\Models\GatewayCharge::STATUS_CANCELLED]);
    }

    /**
     * Approve manual bank transfer deposit proof and receive deposit.
     */
    public function approveDepositProof(Rental $rental): RedirectResponse
    {
        abort_unless(
            $rental->deposit_proof_status === 'pending',
            422,
            'Bukti transfer deposit tidak dalam status pending.',
        );

        $rental->update([
            'deposit_proof_status' => 'approved',
            'deposit_proof_approved_at' => now(),
            'deposit_proof_approved_by' => auth()->id(),
        ]);

        $this->accounting->receiveDeposit($rental, [
            'payment_method' => $rental->deposit_payment_method ?? 'transfer',
            'company_bank_account_id' => $rental->deposit_company_bank_account_id,
        ]);

        if (in_array($rental->status, [Rental::STATUS_PENDING, Rental::STATUS_PENDING_RESERVED, Rental::STATUS_DRAFT], true)) {
            $this->confirmation->confirmAfterPaymentIfPending($rental->fresh());
        }

        return back()->with('success', 'Bukti transfer deposit disetujui. Deposit berhasil diterima & reservasi dikonfirmasi.');
    }

    /**
     * Reject manual bank transfer deposit proof.
     */
    public function rejectDepositProof(Request $request, Rental $rental): RedirectResponse
    {
        abort_unless(
            $rental->deposit_proof_status === 'pending',
            422,
            'Bukti transfer deposit tidak dalam status pending.',
        );

        $validated = $request->validate([
            'rejected_reason' => ['required', 'string', 'max:500'],
        ]);

        $rental->update([
            'deposit_proof_status' => 'rejected',
            'deposit_proof_rejected_reason' => $validated['rejected_reason'],
        ]);

        return back()->with('success', 'Bukti transfer deposit ditolak.');
    }
}
