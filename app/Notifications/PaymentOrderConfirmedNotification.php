<?php

namespace App\Notifications;

use App\Models\PaymentOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentOrderConfirmedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public PaymentOrder $order) {}

    public function via($notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $url = route('module.dashboard');

        return (new MailMessage)
            ->subject('[Seruwit CRM] Pembayaran Dikonfirmasi')
            ->greeting('Halo,')
            ->line('Pembayaran untuk paket **'.$this->order->plan->name.'** telah dikonfirmasi.')
            ->line('Langganan Anda sekarang aktif.')
            ->action('Buka Dashboard', $url)
            ->line('Terima kasih telah menggunakan Seruwit CRM.');
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'payment_order_confirmed',
            'payment_order_id' => $this->order->id,
            'tenant_id' => $this->order->tenant_id,
            'plan_name' => $this->order->plan->name,
            'url' => route('module.dashboard'),
        ];
    }
}
