<?php

namespace App\Notifications;

use App\Models\Invitation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TenantInvitationNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly Invitation $invitation) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $tenantName = $this->invitation->tenant->name;

        return (new MailMessage)
            ->subject("Undangan bergabung ke {$tenantName}")
            ->line("Anda diundang untuk bergabung ke workspace {$tenantName}.")
            ->action('Terima Undangan', $this->invitation->acceptUrl())
            ->line('Undangan ini berlaku hingga '.$this->invitation->expires_at->translatedFormat('d F Y').'.');
    }
}
