<?php

namespace Modules\Shuttle\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Shuttle\Models\ShuttleBooking;
use Modules\Shuttle\Models\ShuttleDeparture;
use Modules\Shuttle\Models\ShuttleSetting;
use RuntimeException;

/**
 * Passenger-channel hold → pay → confirm. Soft-coupled to Accounting via
 * BookingConfirmationService (walk-in journal when partner_id is null).
 */
class PassengerBookingService
{
    public function __construct(
        private readonly BookingConfirmationService $confirmation = new BookingConfirmationService,
    ) {}

    public function channelEnabled(): bool
    {
        return ShuttleSetting::getValue(ShuttleSetting::KEY_PASSENGER_BOOKING_ENABLED, '0') === '1';
    }

    public function holdTtlMinutes(): int
    {
        return max(5, ShuttleSetting::getInt(ShuttleSetting::KEY_HOLD_TTL_MINUTES, 15));
    }

    /**
     * @param  array{
     *     departure_id: int,
     *     passenger_count: int,
     *     unit_fare: float|int|string,
     *     pickup_mode: string,
     *     dropoff_mode: string,
     *     booker_phone: string,
     *     pickup_address?: string|null,
     *     pickup_lat?: float|null,
     *     pickup_lng?: float|null,
     *     dropoff_address?: string|null,
     *     dropoff_lat?: float|null,
     *     dropoff_lng?: float|null,
     *     notes?: string|null,
     *     booker_phone_verified_at?: \DateTimeInterface|null
     * }  $data
     * @param  list<array{name: string, phone?: string|null, id_number?: string|null}>  $passengers
     */
    public function hold(array $data, array $passengers): ShuttleBooking
    {
        if (! $this->channelEnabled()) {
            throw new RuntimeException(__('shuttle.public.disabled'));
        }

        $count = (int) $data['passenger_count'];
        if ($count < 1 || count($passengers) !== $count) {
            throw new RuntimeException(__('shuttle.validation.passenger_count_mismatch'));
        }

        return DB::transaction(function () use ($data, $passengers, $count): ShuttleBooking {
            /** @var ShuttleDeparture $departure */
            $departure = ShuttleDeparture::query()
                ->whereKey($data['departure_id'])
                ->lockForUpdate()
                ->firstOrFail();

            if (! in_array($departure->status, [ShuttleDeparture::STATUS_OPEN, ShuttleDeparture::STATUS_OPTIMIZED], true)) {
                throw new RuntimeException(__('shuttle.messages.departure_not_open'));
            }

            if ($departure->seatsRemaining() < $count) {
                throw new RuntimeException(__('shuttle.messages.insufficient_seats'));
            }

            $unitFare = round((float) $data['unit_fare'], 2);

            $booking = ShuttleBooking::query()->create([
                'booking_number' => ShuttleBooking::nextNumber(),
                'departure_id' => $departure->id,
                'partner_id' => null,
                'channel' => ShuttleBooking::CHANNEL_PASSENGER,
                'booked_by' => null,
                'status' => ShuttleBooking::STATUS_DRAFT,
                'passenger_count' => $count,
                'unit_fare' => $unitFare,
                'total_fare' => round($unitFare * $count, 2),
                'pickup_mode' => $data['pickup_mode'],
                'dropoff_mode' => $data['dropoff_mode'],
                'pickup_address' => $data['pickup_address'] ?? null,
                'pickup_lat' => $data['pickup_lat'] ?? null,
                'pickup_lng' => $data['pickup_lng'] ?? null,
                'dropoff_address' => $data['dropoff_address'] ?? null,
                'dropoff_lat' => $data['dropoff_lat'] ?? null,
                'dropoff_lng' => $data['dropoff_lng'] ?? null,
                'notes' => $data['notes'] ?? null,
                'booker_phone' => $data['booker_phone'],
                'booker_phone_verified_at' => $data['booker_phone_verified_at'] ?? null,
                'hold_expires_at' => now()->addMinutes($this->holdTtlMinutes()),
                'seats_held' => true,
                'payment_status' => ShuttleBooking::PAYMENT_UNPAID,
                'public_token' => Str::random(40),
            ]);

            $departure->increment('seats_booked', $count);
            $this->confirmation->syncPassengers($booking, $passengers);

            return $booking->fresh(['passengers', 'departure.corridor']);
        });
    }

    public function releaseHold(ShuttleBooking $booking, ?string $reason = null, string $asStatus = ShuttleBooking::STATUS_EXPIRED): ShuttleBooking
    {
        return DB::transaction(function () use ($booking, $reason, $asStatus): ShuttleBooking {
            $booking = ShuttleBooking::query()->whereKey($booking->id)->lockForUpdate()->firstOrFail();

            if ($booking->status !== ShuttleBooking::STATUS_DRAFT || ! $booking->seats_held) {
                return $booking;
            }

            /** @var ShuttleDeparture $departure */
            $departure = ShuttleDeparture::query()
                ->whereKey($booking->departure_id)
                ->lockForUpdate()
                ->firstOrFail();

            $departure->update([
                'seats_booked' => max(0, $departure->seats_booked - $booking->passenger_count),
            ]);

            $booking->update([
                'status' => $asStatus,
                'seats_held' => false,
                'hold_expires_at' => null,
                'cancelled_at' => now(),
                'cancel_reason' => $reason ?? __('shuttle.public.hold_expired'),
                'payment_status' => ShuttleBooking::PAYMENT_UNPAID,
            ]);

            return $booking->fresh();
        });
    }

    public function releaseExpiredHolds(): int
    {
        $ids = ShuttleBooking::query()
            ->where('status', ShuttleBooking::STATUS_DRAFT)
            ->where('seats_held', true)
            ->whereNotNull('hold_expires_at')
            ->where('hold_expires_at', '<', now())
            ->pluck('id');

        $count = 0;
        foreach ($ids as $id) {
            $booking = ShuttleBooking::query()->find($id);
            if ($booking) {
                $this->releaseHold($booking);
                $count++;
            }
        }

        return $count;
    }

    /**
     * CS / gateway: mark paid and confirm (posts walk-in accounting).
     *
     * @param  array{payment_method?: string|null}  $options
     */
    public function markPaidAndConfirm(ShuttleBooking $booking, array $options = []): ShuttleBooking
    {
        if ($booking->channel !== ShuttleBooking::CHANNEL_PASSENGER) {
            throw new RuntimeException(__('shuttle.public.not_passenger_channel'));
        }

        if ($booking->status === ShuttleBooking::STATUS_EXPIRED) {
            throw new RuntimeException(__('shuttle.public.hold_expired'));
        }

        if ($booking->isHoldExpired()) {
            $this->releaseHold($booking);

            throw new RuntimeException(__('shuttle.public.hold_expired'));
        }

        return DB::transaction(function () use ($booking, $options): ShuttleBooking {
            $booking->update([
                'payment_status' => ShuttleBooking::PAYMENT_PAID,
                'hold_expires_at' => null,
            ]);

            // Confirm will skip seat increment when seats_held — then clear flag.
            return $this->confirmation->confirm($booking->fresh(), [
                'payment_method' => $options['payment_method'] ?? 'cash',
                'already_held' => true,
            ]);
        });
    }

    public function cancelPassenger(ShuttleBooking $booking, ?string $reason = null): ShuttleBooking
    {
        if ($booking->channel !== ShuttleBooking::CHANNEL_PASSENGER) {
            throw new RuntimeException(__('shuttle.public.not_passenger_channel'));
        }

        if ($booking->status === ShuttleBooking::STATUS_DRAFT && $booking->seats_held) {
            return $this->releaseHold(
                $booking,
                $reason ?? __('shuttle.public.cancelled_by_passenger'),
                ShuttleBooking::STATUS_CANCELLED,
            );
        }

        return $this->confirmation->cancel($booking, $reason);
    }
}
