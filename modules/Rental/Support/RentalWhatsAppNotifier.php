<?php

namespace Modules\Rental\Support;

use App\Models\Setting;
use App\Services\WhatsApp\WhatsAppGatewayManager;
use Illuminate\Support\Facades\Log;
use Modules\Rental\Models\Rental;
use Throwable;

class RentalWhatsAppNotifier
{
    public function __construct(protected WhatsAppGatewayManager $manager) {}

    public function sendBookingConfirmed(Rental $rental): bool
    {
        if (! $this->shouldSend('booking_confirmed')) {
            return false;
        }

        $phone = $this->resolvePhone($rental);
        if (blank($phone)) {
            return false;
        }

        $rental->loadMissing(['vehicle', 'partner']);
        $companyName = (string) Setting::getValue('site.company_name', config('app.name', 'Rental Mobil'));

        $totalPaid = (float) $rental->total_amount + (float) $rental->deposit_amount;
        $formattedTotal = 'Rp '.number_format($totalPaid, 0, ',', '.');
        $formattedRent = 'Rp '.number_format((float) $rental->total_amount, 0, ',', '.');
        $formattedDeposit = 'Rp '.number_format((float) $rental->deposit_amount, 0, ',', '.');

        $startDate = $rental->start_date ? $rental->start_date->format('d/m/Y') : '-';
        $endDate = $rental->end_date ? $rental->end_date->format('d/m/Y') : '-';

        $customerName = $rental->partner?->name ?? 'Pelanggan';
        $vehicleInfo = $rental->vehicle ? "{$rental->vehicle->name} [{$rental->vehicle->plate_number}]" : 'Unit Kendaraan';

        $publicUrl = $rental->public_token ? url('/book/rental/booking/'.$rental->public_token) : '';

        $message = "🚗 *KONFIRMASI BOOKING RENTAL - {$companyName}*\n\n"
            ."Halo Bpk/Ibu *{$customerName}*,\n"
            ."Pemesanan sewa kendaraan Anda telah *TERKONFIRMASI DAN LUNAS*.\n\n"
            ."📋 *Detail Reservasi:*\n"
            ."• No. Kontrak: *{$rental->code}*\n"
            ."• Kendaraan: *{$vehicleInfo}*\n"
            ."• Periode: {$startDate} s/d {$endDate} ({$rental->total_periods} {$rental->period_type})\n"
            ."• Biaya Sewa: {$formattedRent}\n"
            ."• Jaminan Deposit: {$formattedDeposit}\n"
            ."• *Total Lunas*: *{$formattedTotal}*\n\n"
            .($rental->pickup_location ? "📍 Lokasi Ambil: {$rental->pickup_location}\n\n" : '')
            .($publicUrl ? "🔗 Akses Voucher & Detail Sewa:\n{$publicUrl}\n\n" : '')
            ."Mohon siapkan identitas asli (KTP & SIM) saat proses serah terima kendaraan.\n"
            ."Terima kasih telah mempercayakan perjalanan Anda bersama {$companyName}!";

        return $this->dispatch($phone, $message);
    }

    public function sendCheckoutHandover(Rental $rental): bool
    {
        if (! $this->shouldSend('checkout')) {
            return false;
        }

        $phone = $this->resolvePhone($rental);
        if (blank($phone)) {
            return false;
        }

        $rental->loadMissing(['vehicle', 'partner']);
        $companyName = (string) Setting::getValue('site.company_name', config('app.name', 'Rental Mobil'));

        $customerName = $rental->partner?->name ?? 'Pelanggan';
        $vehicleInfo = $rental->vehicle ? "{$rental->vehicle->name} [{$rental->vehicle->plate_number}]" : 'Unit Kendaraan';

        $odo = $rental->start_odometer ? number_format($rental->start_odometer, 0, ',', '.').' KM' : '-';
        $fuel = strtoupper((string) ($rental->start_fuel_level ?: 'FULL'));

        $agreementPdfUrl = url("/module/rental/{$rental->id}/pdf/agreement");

        $message = "🔑 *BERITA ACARA SERAH TERIMA UNIT - {$companyName}*\n\n"
            ."Halo Bpk/Ibu *{$customerName}*,\n"
            ."Kendaraan sewa Anda telah resmi diserahterimakan dan masa sewa dimulai.\n\n"
            ."📋 *Catatan Kondisi Awal:*\n"
            ."• No. Kontrak: *{$rental->code}*\n"
            ."• Kendaraan: *{$vehicleInfo}*\n"
            ."• Odometer Awal: *{$odo}*\n"
            ."• Bahan Bakar Awal: *{$fuel}*\n"
            .'• Serah Terima: '.now()->format('d/m/Y H:i')." WIB\n\n"
            ."📄 Surat Perjanjian Sewa Digital:\n{$agreementPdfUrl}\n\n"
            .'Selamat berkendara dengan aman dan nyaman! Hubungi kami jika membutuhkan bantuan selama perjalanan.';

        return $this->dispatch($phone, $message);
    }

    public function sendReturnReceipt(Rental $rental): bool
    {
        if (! $this->shouldSend('return')) {
            return false;
        }

        $phone = $this->resolvePhone($rental);
        if (blank($phone)) {
            return false;
        }

        $rental->loadMissing(['vehicle', 'partner']);
        $companyName = (string) Setting::getValue('site.company_name', config('app.name', 'Rental Mobil'));

        $customerName = $rental->partner?->name ?? 'Pelanggan';
        $vehicleInfo = $rental->vehicle ? "{$rental->vehicle->name} [{$rental->vehicle->plate_number}]" : 'Unit Kendaraan';

        $kmDriven = ($rental->end_odometer && $rental->start_odometer)
            ? max(0, $rental->end_odometer - $rental->start_odometer)
            : 0;

        $refundAmount = (float) $rental->deposit_refunded_amount;
        $depositNote = $refundAmount > 0
            ? 'Uang jaminan deposit sebesar *Rp '.number_format($refundAmount, 0, ',', '.').'* telah dikembalikan.'
            : 'Uang deposit telah diselesaikan sesuai kesepakatan akhir.';

        $message = "🏁 *PENGEMBALIAN KENDARAAN SELESAI - {$companyName}*\n\n"
            ."Halo Bpk/Ibu *{$customerName}*,\n"
            ."Kendaraan *{$vehicleInfo}* telah berhasil dikembalikan dengan status *SELESAI*.\n\n"
            ."📊 *Ringkasan Pemakaian:*\n"
            ."• No. Kontrak: *{$rental->code}*\n"
            ."• Total Jarak Ditempuh: *{$kmDriven} KM*\n"
            ."• Status Deposit: {$depositNote}\n\n"
            ."Terima kasih atas kerja samanya dalam menjaga kendaraan kami dengan baik. Kami nantikan perjalanan Anda berikutnya bersama {$companyName}!";

        return $this->dispatch($phone, $message);
    }

    protected function resolvePhone(Rental $rental): ?string
    {
        $raw = $rental->booker_phone
            ?: $rental->partner?->phone
            ?: $rental->partner?->mobile;

        if (blank($raw)) {
            return null;
        }

        return WhatsAppGatewayManager::normalizePhone((string) $raw);
    }

    protected function shouldSend(string $event): bool
    {
        $isEnabled = filter_var(Setting::getValue('whatsapp.is_enabled', false), FILTER_VALIDATE_BOOLEAN);
        if (! $isEnabled) {
            return false;
        }

        $key = match ($event) {
            'booking_confirmed' => 'whatsapp.send_on_booking_confirmed',
            'checkout' => 'whatsapp.send_on_checkout',
            'return' => 'whatsapp.send_on_return',
            default => null,
        };

        if ($key === null) {
            return true;
        }

        return filter_var(Setting::getValue($key, true), FILTER_VALIDATE_BOOLEAN);
    }

    protected function dispatch(string $phone, string $message): bool
    {
        try {
            return $this->manager->driver()->sendMessage($phone, $message);
        } catch (Throwable $e) {
            Log::error('[RentalWhatsAppNotifier] Failed to dispatch message', [
                'phone' => $phone,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
