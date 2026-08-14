<?php

namespace App\Notifications;

use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TrialExpiredNotification extends Notification implements ShouldQueue
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
            ->subject('[Seruwit CRM] Masa trial '.$this->tenant->name.' telah berakhir')
            ->greeting('Halo,')
            ->line('Masa trial workspace **'.$this->tenant->name.'** Anda telah berakhir pada **'.$this->tenant->trial_ends_at->format('d F Y').'**.')
            ->line('Workspace telah ditangguhkan. Untuk melanjutkan menggunakan aplikasi, aktifkan paket berlangganan bulanan.')
            ->action('Aktivasi Paket Sekarang', 'https://'.($this->tenant->domains()->first()?->domain ?? '').'/module/subscription')
            ->line('Hubungi kami jika ada pertanyaan.');
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'trial_expired',
            'tenant_id' => $this->tenant->id,
            'tenant_name' => $this->tenant->name,
            'trial_ends_at' => $this->tenant->trial_ends_at,
            'url' => 'https://'.($this->tenant->domains()->first()?->domain ?? '').'/module/subscription',
        ];
    }
}
