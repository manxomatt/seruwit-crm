<?php

namespace Modules\Rental\Support;

use App\Models\Setting;
use App\Support\NotificationRecipients;
use App\Support\SystemMode;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Modules\Rental\Models\Rental;
use Modules\Rental\Notifications\RentalLifecycleMailNotification;
use Throwable;

/**
 * Sends rental lifecycle emails to staff (rental.view) and the partner email
 * when present. Silent no-op when nobody has an address, mail is disabled,
 * or running in development mode according to system configuration.
 */
class RentalMailer
{
    /**
     * @param  array{days?: int}  $context
     */
    public function notify(Rental $rental, string $event, array $context = []): void
    {
        if (! SystemMode::shouldSendMail()) {
            return;
        }

        if (Setting::getValue('email.notification_enabled', '1') !== '1') {
            return;
        }

        $rental->loadMissing(['vehicle:id,name,plate_number', 'partner:id,name,email']);

        $notification = new RentalLifecycleMailNotification($rental, $event, $context);

        $staff = NotificationRecipients::forPermission('rental', 'view')
            ->filter(fn ($user): bool => filled($user->email));

        try {
            if ($staff->isNotEmpty()) {
                Notification::send($staff, $notification);
            }

            $customerEmail = $rental->partner?->email;

            if (filled($customerEmail)) {
                Notification::route('mail', $customerEmail)->notify(
                    new RentalLifecycleMailNotification($rental, $event, $context)
                );
            }
        } catch (Throwable $e) {
            Log::warning('Failed to send rental lifecycle email: '.$e->getMessage(), [
                'rental_id' => $rental->id,
                'event' => $event,
            ]);
        }
    }
}
