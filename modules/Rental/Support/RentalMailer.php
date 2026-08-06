<?php

namespace Modules\Rental\Support;

use App\Models\Setting;
use App\Support\NotificationRecipients;
use Illuminate\Support\Facades\Notification;
use Modules\Rental\Models\Rental;
use Modules\Rental\Notifications\RentalLifecycleMailNotification;

/**
 * Sends rental lifecycle emails to staff (rental.view) and the partner email
 * when present. Silent no-op when nobody has an address or mail is disabled.
 */
class RentalMailer
{
    /**
     * @param  array{days?: int}  $context
     */
    public function notify(Rental $rental, string $event, array $context = []): void
    {
        if (Setting::getValue('email.notification_enabled', '1') !== '1') {
            return;
        }

        $rental->loadMissing(['vehicle:id,name,plate_number', 'partner:id,name,email']);

        $notification = new RentalLifecycleMailNotification($rental, $event, $context);

        $staff = NotificationRecipients::forPermission('rental', 'view')
            ->filter(fn ($user): bool => filled($user->email));

        if ($staff->isNotEmpty()) {
            Notification::send($staff, $notification);
        }

        $customerEmail = $rental->partner?->email;

        if (filled($customerEmail)) {
            Notification::route('mail', $customerEmail)->notify(
                new RentalLifecycleMailNotification($rental, $event, $context)
            );
        }
    }
}
