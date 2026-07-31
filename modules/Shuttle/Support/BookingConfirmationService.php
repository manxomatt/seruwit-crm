<?php

namespace Modules\Shuttle\Support;

use Illuminate\Support\Facades\DB;
use Modules\Shuttle\Models\ShuttleBooking;
use Modules\Shuttle\Models\ShuttleDeparture;
use Modules\Shuttle\Models\ShuttlePassenger;
use RuntimeException;

class BookingConfirmationService
{
    public function __construct(
        private readonly ShuttleInvoiceService $invoices = new ShuttleInvoiceService,
        private readonly SeatLabelAssigner $seats = new SeatLabelAssigner,
        private readonly ShuttleAccountingService $accounting = new ShuttleAccountingService,
    ) {}

    public function confirm(ShuttleBooking $booking): ShuttleBooking
    {
        if ($booking->status !== ShuttleBooking::STATUS_DRAFT) {
            throw new RuntimeException(__('shuttle.messages.confirm_draft_only'));
        }

        return DB::transaction(function () use ($booking): ShuttleBooking {
            /** @var ShuttleDeparture $departure */
            $departure = ShuttleDeparture::query()
                ->whereKey($booking->departure_id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! in_array($departure->status, [ShuttleDeparture::STATUS_OPEN, ShuttleDeparture::STATUS_OPTIMIZED], true)) {
                throw new RuntimeException(__('shuttle.messages.departure_not_open'));
            }

            if ($departure->seatsRemaining() < $booking->passenger_count) {
                throw new RuntimeException(__('shuttle.messages.insufficient_seats'));
            }

            $seatOffset = (int) $departure->seats_booked;
            $departure->increment('seats_booked', $booking->passenger_count);

            $booking->update(['status' => ShuttleBooking::STATUS_CONFIRMED]);

            $this->seats->assign($booking->fresh(['passengers']), $seatOffset);

            $invoice = $this->invoices->createFromBooking($booking->fresh(['partner', 'departure.corridor', 'passengers']));
            if ($invoice) {
                $booking->update(['invoice_id' => $invoice->id]);
            } else {
                // Walk-in: no AR invoice — post cash travel revenue when Accounting is ready.
                $this->accounting->postWalkInSale($booking->fresh());
            }

            return $booking->fresh(['passengers', 'departure', 'partner', 'invoice']);
        });
    }

    public function cancel(ShuttleBooking $booking, ?string $reason = null): ShuttleBooking
    {
        if (! in_array($booking->status, [ShuttleBooking::STATUS_DRAFT, ShuttleBooking::STATUS_CONFIRMED], true)) {
            throw new RuntimeException(__('shuttle.messages.cancel_invalid_status'));
        }

        return DB::transaction(function () use ($booking, $reason): ShuttleBooking {
            $refundStatus = ShuttleInvoiceService::REFUND_NONE;
            $creditInvoiceId = null;

            if ($booking->status === ShuttleBooking::STATUS_CONFIRMED) {
                /** @var ShuttleDeparture $departure */
                $departure = ShuttleDeparture::query()
                    ->whereKey($booking->departure_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if (in_array($departure->status, [
                    ShuttleDeparture::STATUS_DISPATCHED,
                    ShuttleDeparture::STATUS_IN_TRANSIT,
                    ShuttleDeparture::STATUS_COMPLETED,
                ], true)) {
                    throw new RuntimeException(__('shuttle.messages.cancel_after_dispatch'));
                }

                $departure->update([
                    'seats_booked' => max(0, $departure->seats_booked - $booking->passenger_count),
                ]);

                if ($booking->invoice_id) {
                    $settlement = $this->invoices->settleCancellation($booking);
                    $refundStatus = $settlement['status'];
                    $creditInvoiceId = $settlement['credit_invoice_id'];
                } else {
                    $this->accounting->reverseWalkInSale($booking);
                }
            }

            $booking->update([
                'status' => ShuttleBooking::STATUS_CANCELLED,
                'cancelled_at' => now(),
                'cancel_reason' => $reason,
                'refund_status' => $refundStatus,
                'credit_invoice_id' => $creditInvoiceId,
            ]);

            return $booking->fresh(['invoice', 'passengers']);
        });
    }

    /**
     * @param  list<array{name: string, phone?: string|null, id_number?: string|null}>  $passengers
     */
    public function syncPassengers(ShuttleBooking $booking, array $passengers): void
    {
        $booking->passengers()->delete();

        foreach ($passengers as $passenger) {
            ShuttlePassenger::query()->create([
                'booking_id' => $booking->id,
                'name' => $passenger['name'],
                'phone' => $passenger['phone'] ?? null,
                'id_number' => $passenger['id_number'] ?? null,
            ]);
        }
    }
}
