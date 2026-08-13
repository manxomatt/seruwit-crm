<?php

namespace App\Notifications;

use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TrialSuspendedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Tenant $tenant) {}

    public function via($notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('[Seruwit CRM] Workspace '.$this->tenant->name.' ditangguhkan')
            ->greeting('Halo,')
            ->line('Workspace **'.$this->tenant->name.'** Anda telah ditangguhkan karena masa trial berakhir tanpa aktivasi paket.')
            ->line('Akses ke workspace saat ini diblokir.')
            ->action('Aktivasi Paket Sekarang', route('central.subscription.show', $this->tenant))
            ->line('Segera aktifkan paket untuk mengembalikan akses.');
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'trial_suspended',
            'tenant_id' => $this->tenant->id,
            'tenant_name' => $this->tenant->name,
            'url' => route('central.subscription.show', $this->tenant),
        ];
    }
}
