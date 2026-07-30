<?php

namespace Modules\Rental\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Modules\Rental\Models\Rental;

/**
 * Mail-only rental lifecycle notice for staff and customers.
 * Keeps GenericNotification on the database channel for the bell.
 */
class RentalLifecycleMailNotification extends Notification
{
    use Queueable;

    public const EVENT_CONFIRMED = 'confirmed';

    public const EVENT_CHECKED_OUT = 'checked_out';

    public const EVENT_RETURNED = 'returned';

    public const EVENT_ENDING = 'ending';

    public const EVENT_OVERDUE = 'overdue';

    public const EVENT_INVOICE_ISSUED = 'invoice_issued';

    public const EVENT_DEPOSIT_SETTLED = 'deposit_settled';

    /**
     * @param  array{days?: int, invoice_count?: int, applied?: float, refunded?: float}  $context
     */
    public function __construct(
        public readonly Rental $rental,
        public readonly string $event,
        public readonly array $context = [],
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $rental = $this->rental->loadMissing(['vehicle', 'partner']);
        $vehicle = $rental->vehicle
            ? $rental->vehicle->name.' ('.$rental->vehicle->plate_number.')'
            : '—';
        $partner = $rental->partner?->name ?? '—';
        $url = url(route('module.rental.show', $rental, absolute: false));

        $subject = match ($this->event) {
            self::EVENT_CONFIRMED => __('rental.mail.confirmed_subject', ['code' => $rental->code]),
            self::EVENT_CHECKED_OUT => __('rental.mail.checked_out_subject', ['code' => $rental->code]),
            self::EVENT_RETURNED => __('rental.mail.returned_subject', ['code' => $rental->code]),
            self::EVENT_ENDING => __('rental.mail.ending_subject', [
                'code' => $rental->code,
                'days' => (int) ($this->context['days'] ?? 0),
            ]),
            self::EVENT_OVERDUE => __('rental.mail.overdue_subject', ['code' => $rental->code]),
            self::EVENT_INVOICE_ISSUED => __('rental.mail.invoice_issued_subject', ['code' => $rental->code]),
            self::EVENT_DEPOSIT_SETTLED => __('rental.mail.deposit_settled_subject', ['code' => $rental->code]),
            default => __('rental.mail.default_subject', ['code' => $rental->code]),
        };

        $line = match ($this->event) {
            self::EVENT_CONFIRMED => __('rental.mail.confirmed_body', [
                'code' => $rental->code,
                'vehicle' => $vehicle,
                'partner' => $partner,
                'start' => $rental->start_date?->toDateString(),
                'end' => $rental->end_date?->toDateString(),
            ]),
            self::EVENT_CHECKED_OUT => __('rental.mail.checked_out_body', [
                'code' => $rental->code,
                'vehicle' => $vehicle,
                'partner' => $partner,
                'end' => $rental->end_date?->toDateString(),
            ]),
            self::EVENT_RETURNED => __('rental.mail.returned_body', [
                'code' => $rental->code,
                'vehicle' => $vehicle,
                'partner' => $partner,
                'total' => number_format((float) $rental->total_amount, 0, ',', '.'),
            ]),
            self::EVENT_ENDING => __('rental.mail.ending_body', [
                'code' => $rental->code,
                'vehicle' => $vehicle,
                'partner' => $partner,
                'date' => $rental->end_date?->toDateString(),
                'days' => (int) ($this->context['days'] ?? 0),
            ]),
            self::EVENT_OVERDUE => __('rental.mail.overdue_body', [
                'code' => $rental->code,
                'vehicle' => $vehicle,
                'partner' => $partner,
                'date' => $rental->end_date?->toDateString(),
            ]),
            self::EVENT_INVOICE_ISSUED => __('rental.mail.invoice_issued_body', [
                'code' => $rental->code,
                'vehicle' => $vehicle,
                'partner' => $partner,
                'count' => (int) ($this->context['invoice_count'] ?? 1),
            ]),
            self::EVENT_DEPOSIT_SETTLED => __('rental.mail.deposit_settled_body', [
                'code' => $rental->code,
                'vehicle' => $vehicle,
                'partner' => $partner,
                'applied' => number_format((float) ($this->context['applied'] ?? 0), 0, ',', '.'),
                'refunded' => number_format((float) ($this->context['refunded'] ?? 0), 0, ',', '.'),
            ]),
            default => __('rental.mail.default_body', ['code' => $rental->code]),
        };

        return (new MailMessage)
            ->subject($subject)
            ->line($line)
            ->action(__('rental.mail.view_rental'), $url)
            ->line(__('rental.mail.footer'));
    }
}
