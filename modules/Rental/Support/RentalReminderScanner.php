<?php

namespace Modules\Rental\Support;

use App\Notifications\GenericNotification;
use App\Support\NotificationRecipients;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Notification;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalReminder;
use Modules\Rental\Notifications\RentalLifecycleMailNotification;

/**
 * Raises in-app alerts for rentals ending soon or already overdue.
 * Idempotent per (rental, kind, days_before). Also emails staff + customer.
 */
class RentalReminderScanner
{
    /** @var list<int> */
    private array $endingThresholds = [3, 1, 0];

    public function __construct(private readonly RentalMailer $mailer) {}

    public function scan(): int
    {
        $recipients = NotificationRecipients::forPermission('rental', 'view');

        return $this->scanEnding($recipients) + $this->scanOverdue($recipients);
    }

    /**
     * @param  Collection<int, \App\Models\User>  $recipients
     */
    private function scanEnding(Collection $recipients): int
    {
        $raised = 0;
        $today = now()->startOfDay();

        $rentals = Rental::query()
            ->checkedOut()
            ->with(['vehicle:id,name,plate_number', 'partner:id,name,email'])
            ->whereDate('end_date', '>=', $today->toDateString())
            ->whereDate('end_date', '<=', $today->copy()->addDays(max($this->endingThresholds))->toDateString())
            ->get();

        foreach ($rentals as $rental) {
            $daysLeft = (int) $today->diffInDays($rental->end_date->copy()->startOfDay());

            foreach ($this->endingThresholds as $threshold) {
                if ($daysLeft > $threshold) {
                    continue;
                }

                if ($this->alreadySent($rental, RentalReminder::KIND_ENDING, $threshold)) {
                    continue;
                }

                $this->record($rental, RentalReminder::KIND_ENDING, $threshold);

                if ($recipients->isNotEmpty()) {
                    Notification::send($recipients, new GenericNotification(
                        title: __('rental.reminders.ending_title', ['days' => $threshold]),
                        body: __('rental.reminders.ending_body', [
                            'code' => $rental->code,
                            'vehicle' => $rental->vehicle
                                ? $rental->vehicle->name.' ('.$rental->vehicle->plate_number.')'
                                : '—',
                            'partner' => $rental->partner?->name ?? '—',
                            'date' => $rental->end_date->toDateString(),
                        ]),
                        url: route('module.rental.show', $rental, absolute: false),
                        icon: 'key',
                        type: $threshold === 0 ? 'danger' : 'warning',
                    ));
                }

                $this->mailer->notify($rental, RentalLifecycleMailNotification::EVENT_ENDING, [
                    'days' => $threshold,
                ]);

                $raised++;
            }
        }

        return $raised;
    }

    /**
     * @param  Collection<int, \App\Models\User>  $recipients
     */
    private function scanOverdue(Collection $recipients): int
    {
        $raised = 0;

        $rentals = Rental::query()
            ->overdue()
            ->with(['vehicle:id,name,plate_number', 'partner:id,name,email'])
            ->get();

        foreach ($rentals as $rental) {
            if ($this->alreadySent($rental, RentalReminder::KIND_OVERDUE, 0)) {
                continue;
            }

            $this->record($rental, RentalReminder::KIND_OVERDUE, 0);

            if ($recipients->isNotEmpty()) {
                Notification::send($recipients, new GenericNotification(
                    title: __('rental.reminders.overdue_title'),
                    body: __('rental.reminders.overdue_body', [
                        'code' => $rental->code,
                        'vehicle' => $rental->vehicle
                            ? $rental->vehicle->name.' ('.$rental->vehicle->plate_number.')'
                            : '—',
                        'partner' => $rental->partner?->name ?? '—',
                        'date' => $rental->end_date->toDateString(),
                    ]),
                    url: route('module.rental.show', $rental, absolute: false),
                    icon: 'key',
                    type: 'danger',
                ));
            }

            $this->mailer->notify($rental, RentalLifecycleMailNotification::EVENT_OVERDUE);

            $raised++;
        }

        return $raised;
    }

    private function alreadySent(Rental $rental, string $kind, int $daysBefore): bool
    {
        return RentalReminder::query()
            ->where('rental_id', $rental->id)
            ->where('kind', $kind)
            ->where('days_before', $daysBefore)
            ->exists();
    }

    private function record(Rental $rental, string $kind, int $daysBefore): void
    {
        RentalReminder::query()->create([
            'rental_id' => $rental->id,
            'kind' => $kind,
            'days_before' => $daysBefore,
            'sent_at' => now(),
        ]);
    }
}
