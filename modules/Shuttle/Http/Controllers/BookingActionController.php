<?php

namespace Modules\Shuttle\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Modules\Shuttle\Models\ShuttleBooking;
use Modules\Shuttle\Support\BookingConfirmationService;
use Throwable;

class BookingActionController extends Controller
{
    public function confirm(ShuttleBooking $booking, BookingConfirmationService $service): RedirectResponse
    {
        try {
            $service->confirm($booking);
        } catch (Throwable $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', __('shuttle.messages.booking_confirmed'));
    }

    public function cancel(ShuttleBooking $booking, BookingConfirmationService $service): RedirectResponse
    {
        try {
            $service->cancel($booking);
        } catch (Throwable $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', __('shuttle.messages.booking_cancelled'));
    }

    public function board(ShuttleBooking $booking): RedirectResponse
    {
        if ($booking->status !== ShuttleBooking::STATUS_CONFIRMED) {
            return back()->with('error', __('shuttle.messages.board_confirmed_only'));
        }

        $booking->update(['status' => ShuttleBooking::STATUS_BOARDED]);

        return back()->with('success', __('shuttle.messages.booking_boarded'));
    }
}
