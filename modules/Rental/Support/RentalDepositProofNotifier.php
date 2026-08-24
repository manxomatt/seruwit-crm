<?php

namespace Modules\Rental\Support;

use App\Notifications\GenericNotification;
use App\Support\NotificationRecipients;
use Illuminate\Support\Facades\Notification;
use Modules\Rental\Models\Rental;

/**
 * Alerts the rental desk when a customer uploads a manual transfer proof that
 * still needs a human to approve or reject it. Without this the pending proof
 * only surfaces if staff happen to open the booking, so a web order can sit
 * unconfirmed with money already sent.
 */
class RentalDepositProofNotifier
{
    /**
     * Notify staff who can validate deposit proofs that one is awaiting review.
     */
    public static function notifyPendingReview(Rental $rental): void
    {
        $recipients = NotificationRecipients::forPermission('rental', 'approve');

        if ($recipients->isEmpty()) {
            return;
        }

        Notification::send($recipients, new GenericNotification(
            title: __('rental.notifications.deposit_proof_title'),
            body: __('rental.notifications.deposit_proof_body', [
                'code' => $rental->code,
                'customer' => $rental->partner?->name ?? $rental->booker_phone ?? '—',
            ]),
            url: route('module.rental.show', $rental, absolute: false),
            icon: 'payment',
            type: 'warning',
        ));
    }
}
