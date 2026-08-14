<?php

namespace App\Notifications;

use App\Models\PaymentOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentOrderCreatedNotification extends Notification implements ShouldQueue
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
            ->subject('[Seruwit CRM] Pesanan Pembayaran Baru')
            ->greeting('Halo,')
            ->line('Pesanan pembayaran untuk paket **'.$this->order->plan->name.'** telah dibuat.')
            ->line('Nominal transfer: **Rp '.number_format($this->order->total_amount, 0, ',', '.').'**')
            ->line('Kode unik: **'.$this->order->unique_code.'**')
            ->line('Berlaku hingga: **'.$this->order->expires_at->format('d F Y, H:i').'**')
            ->action('Lihat Detail Pembayaran', $url)
            ->line('Silakan transfer sesuai nominal dan upload bukti transfer pada halaman pembayaran.');
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'payment_order_created',
            'payment_order_id' => $this->order->id,
            'tenant_id' => $this->order->tenant_id,
            'plan_name' => $this->order->plan->name,
            'total_amount' => $this->order->total_amount,
            'url' => route('module.subscription.payment', $this->order),
        ];
    }
}
