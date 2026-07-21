<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

/**
 * A single database-channel notification carrying a title, body, link and icon.
 *
 * One generic class rather than one per event: every notifier in the app —
 * document expiry, shipment status, and whatever comes next — renders the same
 * way in the bell dropdown, so a shape is all the UI needs. Delivered on the
 * database channel synchronously; the mail driver is `log` today, so a mail
 * channel is deliberately not wired here.
 */
class GenericNotification extends Notification
{
    public function __construct(
        private readonly string $title,
        private readonly string $body,
        private readonly ?string $url = null,
        private readonly string $icon = 'bell',
        private readonly string $type = 'info',
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => $this->title,
            'body' => $this->body,
            'url' => $this->url,
            'icon' => $this->icon,
            'type' => $this->type,
        ];
    }
}
