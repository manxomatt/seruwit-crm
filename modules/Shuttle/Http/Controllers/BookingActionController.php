<?php

namespace Modules\Shuttle\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

    public function cancel(Request $request, ShuttleBooking $booking, BookingConfirmationService $service): RedirectResponse
    {
        $data = $request->validate([
            'cancel_reason' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $service->cancel($booking, $data['cancel_reason'] ?? null);
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
