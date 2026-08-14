<?php

namespace App\Notifications;

use App\Models\PaymentOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentOrderRejectedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public PaymentOrder $order) {}

    public function via($notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $url = route('module.subscription.payment', $this->order);

        return (new MailMessage)
            ->subject('[Seruwit CRM] Pembayaran Ditolak')
            ->greeting('Halo,')
            ->line('Pembayaran untuk paket **'.$this->order->plan->name.'** ditolak.')
            ->line('Alasan: '.($this->order->rejection_reason ?? 'Tidak ada alasan yang diberikan.'))
            ->action('Upload Ulang Bukti', $url)
            ->line('Silakan periksa dan upload bukti transfer yang benar.');
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'payment_order_rejected',
            'payment_order_id' => $this->order->id,
            'tenant_id' => $this->order->tenant_id,
            'plan_name' => $this->order->plan->name,
            'rejection_reason' => $this->order->rejection_reason,
            'url' => route('module.subscription.payment', $this->order),
        ];
    }
}
