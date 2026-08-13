<?php

namespace App\Notifications;

use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TrialExpiringNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Tenant $tenant,
        public int $daysLeft,
    ) {}

    public function via($notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('[Seruwit CRM] Masa trial '.$this->tenant->name.' berakhir dalam '.$this->daysLeft.' hari')
            ->greeting('Halo,')
            ->line('Workspace **'.$this->tenant->name.'** Anda masih dalam masa trial gratis.')
            ->line('Trial akan berakhir pada **'.$this->tenant->trial_ends_at->format('d F Y').'**.')
            ->line('Setelah trial berakhir, workspace akan ditangguhkan sampai Anda mengaktivasi paket berlangganan bulanan.')
            ->action('Aktivasi Paket Sekarang', route('central.subscription.show', $this->tenant))
            ->line('Terima kasih telah menggunakan Seruwit CRM.');
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'trial_expiring',
            'tenant_id' => $this->tenant->id,
            'tenant_name' => $this->tenant->name,
            'days_left' => $this->daysLeft,
            'trial_ends_at' => $this->tenant->trial_ends_at,
            'url' => route('central.subscription.show', $this->tenant),
        ];
    }
}
