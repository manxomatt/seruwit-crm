<?php

namespace App\Notifications;

use App\Models\ResellerPayout;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResellerPayoutPaidNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public ResellerPayout $payout) {}

    /**
     * @return list<string>
     */
    public function via($notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $amount = 'Rp '.number_format((float) $this->payout->net_amount, 0, ',', '.');

        return (new MailMessage)
            ->subject('[Seruwit CRM] Komisi Telah Dibayarkan')
            ->greeting('Halo,')
            ->line('Komisi reseller Anda sebesar **'.$amount.'** telah ditransfer.')
            ->line('Nomor referensi: '.$this->payout->reference)
            ->action('Lihat Riwayat Pembayaran', route('module.reseller.payouts'))
            ->line('Terima kasih atas kerja samanya.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray($notifiable): array
    {
        return [
            'type' => 'reseller_payout_paid',
            'payout_id' => $this->payout->id,
            'reference' => $this->payout->reference,
            'net_amount' => (float) $this->payout->net_amount,
            'url' => route('module.reseller.payouts'),
        ];
    }
}
