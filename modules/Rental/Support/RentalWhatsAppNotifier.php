<?php

namespace Modules\Rental\Support;

use App\Models\Setting;
use App\Services\WhatsApp\WhatsAppGatewayManager;
use Illuminate\Support\Facades\Log;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalDispatch;
use Modules\Rental\Models\RentalDutyOrder;
use Modules\Rental\Models\RentalExtensionRequest;
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

        $rental->loadMissing(['vehicle', 'partner', 'driver']);
        $companyName = (string) Setting::getValue('site.company_name', config('app.name', 'Rental Mobil'));

        $totalPaid = (float) $rental->total_amount + (float) $rental->deposit_amount;
        $formattedTotal = 'Rp '.number_format($totalPaid, 0, ',', '.');
        $formattedRent = 'Rp '.number_format((float) $rental->total_amount, 0, ',', '.');
        $formattedDeposit = 'Rp '.number_format((float) $rental->deposit_amount, 0, ',', '.');

        $startDate = $rental->start_date ? $rental->start_date->format('d/m/Y') : '-';
        $endDate = $rental->end_date ? $rental->end_date->format('d/m/Y') : '-';

        $customerName = $rental->partner?->name ?? 'Pelanggan';
        $vehicleInfo = $rental->vehicle ? "{$rental->vehicle->name} [{$rental->vehicle->plate_number}]" : 'Unit Kendaraan';
        $serviceLabel = $rental->isWithDriver() ? 'Dengan Sopir (Driver)' : 'Lepas Kunci (Self-Drive)';

        $deliveryLoc = $rental->delivery_address ?: $rental->delivery_landmark;
        $pickupText = match ($rental->delivery_type) {
            Rental::DELIVERY_AIRPORT => 'Bandara'.($deliveryLoc ? " ({$deliveryLoc})" : ''),
            Rental::DELIVERY_HOTEL, Rental::DELIVERY_CUSTOM, Rental::DELIVERY_HOTEL_CUSTOM => ($deliveryLoc ?: 'Alamat/Hotel Pengantaran'),
            default => ($rental->pickup_location ? "Pool Garasi ({$rental->pickup_location})" : 'Pool Garasi'),
        };

        $returnLoc = $rental->return_delivery_address;
        $returnText = match ($rental->return_delivery_type ?? $rental->return_type) {
            Rental::DELIVERY_AIRPORT => 'Bandara'.($returnLoc ? " ({$returnLoc})" : ''),
            Rental::DELIVERY_HOTEL, Rental::DELIVERY_CUSTOM, Rental::DELIVERY_HOTEL_CUSTOM => ($returnLoc ?: 'Alamat/Hotel Pengembalian'),
            default => ($rental->return_location ? "Pool Garasi ({$rental->return_location})" : null),
        };

        $driverNotice = '';
        if ($rental->isWithDriver() && $rental->driver) {
            $driverNotice = "• Pengemudi: *{$rental->driver->name}* ({$rental->driver->phone})\n";
        }

        $guarantorNotice = '';
        if ($rental->isSelfDrive() && empty($rental->passenger_guarantor_doc_path)) {
            $guarantorNotice = "\n⚠️ *Syarat Dokumen Penjamin (Lepas Kunci):*\n"
                ."Mohon unggah dokumen penjamin (Tiket Pesawat PP / Voucher Hotel / ID Karyawan / Kartu Keluarga) melalui tautan voucher di atas sebelum jadwal pengambilan unit.\n";
        }

        $publicUrl = $rental->public_token ? url('/book/rental/booking/'.$rental->public_token) : '';

        $message = "🚗 *KONFIRMASI BOOKING RENTAL - {$companyName}*\n\n"
            ."Halo Bpk/Ibu *{$customerName}*,\n"
            ."Pemesanan sewa kendaraan Anda telah *TERKONFIRMASI DAN LUNAS*.\n\n"
            ."📋 *Detail Reservasi:*\n"
            ."• No. Kontrak: *{$rental->code}*\n"
            ."• Kendaraan: *{$vehicleInfo}*\n"
            ."• Layanan: *{$serviceLabel}*\n"
            ."• Periode: {$startDate} s/d {$endDate} ({$rental->total_periods} {$rental->period_type})\n"
            ."• Biaya Sewa: {$formattedRent}\n"
            ."• Jaminan Deposit: {$formattedDeposit}\n"
            ."• *Total Lunas*: *{$formattedTotal}*\n"
            .$driverNotice."\n"
            ."📍 *Titik Serah Terima*: {$pickupText}\n"
            .($returnText ? "📍 *Titik Pengembalian*: {$returnText}\n" : '')
            .($publicUrl ? "\n🔗 Akses Voucher & Detail Sewa:\n{$publicUrl}\n" : '')
            .$guarantorNotice."\n"
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

    public function sendDriverAssignedToCustomer(RentalDutyOrder $dutyOrder): bool
    {
        if (! $this->shouldSend('driver_assigned')) {
            return false;
        }

        $dutyOrder->loadMissing(['driver', 'vehicle', 'rental.partner']);
        $phone = $dutyOrder->passenger_phone ?: ($dutyOrder->rental ? $this->resolvePhone($dutyOrder->rental) : null);
        if (blank($phone) || ! $dutyOrder->driver) {
            return false;
        }

        $companyName = (string) Setting::getValue('site.company_name', config('app.name', 'Rental Mobil'));
        $customerName = $dutyOrder->passenger_name ?: ($dutyOrder->rental?->partner?->name ?? 'Pelanggan');
        $rentalCode = $dutyOrder->rental?->code ?? $dutyOrder->duty_order_number;
        $driverName = $dutyOrder->driver->name;
        $driverPhone = $dutyOrder->driver->phone ?: '-';
        $vehicleInfo = $dutyOrder->vehicle ? "{$dutyOrder->vehicle->name} [{$dutyOrder->vehicle->plate_number}]" : 'Unit Kendaraan';
        $departure = $dutyOrder->departure_date ? $dutyOrder->departure_date->format('d/m/Y') : '-';
        if ($dutyOrder->departure_time) {
            $departure .= ' jam '.$dutyOrder->departure_time;
        }

        $message = "🚗 *INFORMASI PENGEMUDI RENTAL - {$companyName}*\n\n"
            ."Halo Bpk/Ibu *{$customerName}*,\n"
            ."Pengemudi untuk pesanan rental Anda (*{$rentalCode}*) telah resmi ditugaskan:\n\n"
            ."👤 *Data Pengemudi:*\n"
            ."• Nama Sopir: *{$driverName}*\n"
            ."• No. WhatsApp/HP: *{$driverPhone}*\n"
            ."• Kendaraan: *{$vehicleInfo}*\n\n"
            ."📍 *Rincian Penjemputan:*\n"
            ."• Jadwal Berangkat: {$departure}\n"
            ."• Titik Jemput: {$dutyOrder->origin}\n"
            ."• Tujuan: {$dutyOrder->destination}\n\n"
            ."Pengemudi kami akan menghubungi Anda sebelum waktu penjemputan. Anda juga dapat langsung menghubungi driver melalui nomor di atas.\n\n"
            ."Selamat menikmati perjalanan bersama {$companyName}!";

        return $this->dispatch($phone, $message);
    }

    public function sendDutyOrderToDriver(RentalDutyOrder $dutyOrder): bool
    {
        if (! $this->shouldSend('driver_on_duty')) {
            return false;
        }

        $dutyOrder->loadMissing(['driver', 'vehicle', 'rental']);
        if (! $dutyOrder->driver || blank($dutyOrder->driver->phone)) {
            return false;
        }

        $phone = WhatsAppGatewayManager::normalizePhone($dutyOrder->driver->phone);
        $companyName = (string) Setting::getValue('site.company_name', config('app.name', 'Rental Mobil'));

        $driverName = $dutyOrder->driver->name;
        $vehicleInfo = $dutyOrder->vehicle ? "{$dutyOrder->vehicle->name} [{$dutyOrder->vehicle->plate_number}]" : 'Armada Operasional';
        $departure = $dutyOrder->departure_date ? $dutyOrder->departure_date->format('d/m/Y') : '-';
        if ($dutyOrder->departure_time) {
            $departure .= ' jam '.$dutyOrder->departure_time;
        }
        $return = $dutyOrder->return_date ? $dutyOrder->return_date->format('d/m/Y') : '-';
        if ($dutyOrder->return_time) {
            $return .= ' jam '.$dutyOrder->return_time;
        }
        $passengerName = $dutyOrder->passenger_name ?: 'Tamu/Pelanggan';
        $passengerPhone = $dutyOrder->passenger_phone ?: '-';
        $cashAdvance = 'Rp '.number_format((float) $dutyOrder->cash_advance_amount, 0, ',', '.');

        $message = "📋 *SURAT TUGAS PENGEMUDI (SPPD) - {$companyName}*\n\n"
            ."Halo *{$driverName}*,\n"
            ."Anda menerima tugas dinas pengemudi dengan rincian berikut:\n\n"
            ."• No. SPPD: *{$dutyOrder->duty_order_number}*\n"
            ."• Armada: *{$vehicleInfo}*\n"
            ."• Tamu/Penumpang: *{$passengerName}* ({$passengerPhone})\n"
            ."• Titik Jemput (Asal): {$dutyOrder->origin}\n"
            ."• Tujuan: {$dutyOrder->destination}\n"
            ."• Waktu Berangkat: {$departure}\n"
            ."• Perkiraan Selesai: {$return}\n"
            ."• Uang Jalan (Kasbon): *{$cashAdvance}*\n\n"
            .'Mohon periksa kesiapan unit armada, tiba 15 menit sebelum jadwal penjemputan, dan utamakan keselamatan berkendara.';

        return $this->dispatch($phone, $message);
    }

    public function sendDispatchToRunner(RentalDispatch $dispatch): bool
    {
        if (! $this->shouldSend('driver_on_duty')) {
            return false;
        }

        $dispatch->loadMissing(['driver', 'rental.vehicle']);
        if (! $dispatch->driver || blank($dispatch->driver->phone)) {
            return false;
        }

        $phone = WhatsAppGatewayManager::normalizePhone($dispatch->driver->phone);
        $companyName = (string) Setting::getValue('site.company_name', config('app.name', 'Rental Mobil'));

        $typeLabel = $dispatch->type === RentalDispatch::TYPE_DELIVERY ? 'PENGANTARAN UNIT (DELIVERY)' : 'PENJEMPUTAN UNIT (PICKUP)';
        $vehicleInfo = $dispatch->rental?->vehicle ? "{$dispatch->rental->vehicle->name} [{$dispatch->rental->vehicle->plate_number}]" : 'Unit Armada';
        $scheduledAt = $dispatch->scheduled_at ? $dispatch->scheduled_at->format('d/m/Y H:i') : '-';

        $message = "🚚 *TUGAS OPERASIONAL RUNNER - {$typeLabel}*\n"
            ."*{$companyName}*\n\n"
            ."Halo *{$dispatch->driver->name}*,\n"
            ."Anda ditugaskan untuk operasional runner armada:\n\n"
            ."• Tugas: *{$typeLabel}*\n"
            ."• Kendaraan: *{$vehicleInfo}*\n"
            ."• Waktu Jadwal: *{$scheduledAt} WIB*\n"
            ."• Lokasi: *{$dispatch->location_name}*\n"
            .($dispatch->location_address ? "• Alamat: {$dispatch->location_address}\n" : '')
            ."• Kontak Tamu: *{$dispatch->contact_name}* ({$dispatch->contact_phone})\n\n"
            .'Harap segera bersiap dan konfirmasi status melalui sistem saat mulai berangkat.';

        return $this->dispatch($phone, $message);
    }

    public function sendDepositRefundBankSubmitted(Rental $rental): bool
    {
        $phone = $this->resolvePhone($rental);
        if (blank($phone)) {
            return false;
        }

        $rental->loadMissing(['vehicle', 'partner']);
        $companyName = (string) Setting::getValue('site.company_name', config('app.name', 'Rental Mobil'));
        $customerName = $rental->partner?->name ?? 'Pelanggan';
        $portalUrl = $rental->public_token ? url('/book/rental/booking/'.$rental->public_token) : '';

        $bankInfo = "{$rental->deposit_refund_bank_name} - {$rental->deposit_refund_account_number} a/n {$rental->deposit_refund_account_name}";

        $message = "💳 *REKENING PENGEMBALIAN DEPOSIT DITERIMA - {$companyName}*\n\n"
            ."Halo Bpk/Ibu *{$customerName}*,\n"
            ."Data rekening tujuan pengembalian dana deposit untuk sewa *{$rental->code}* telah berhasil kami simpan:\n\n"
            ."📋 *Rincian Rekening:*\n"
            ."• Bank/E-Wallet: *{$bankInfo}*\n"
            .'• Total Deposit: *Rp '.number_format((float) $rental->deposit_amount, 0, ',', '.')."*\n\n"
            ."Tim Finance kami akan memproses verifikasi dan pencairan dana pengembalian deposit ke rekening tersebut sesuai prosedur (1-3 hari kerja setelah unit kembali).\n\n"
            .($portalUrl ? "Pantau status pengembalian deposit secara live:\n{$portalUrl}\n\n" : '')
            .'Terima kasih atas kerja sama Anda!';

        return $this->dispatch($phone, $message);
    }

    public function sendDepositRefundTransferred(Rental $rental): bool
    {
        $phone = $this->resolvePhone($rental);
        if (blank($phone)) {
            return false;
        }

        $rental->loadMissing(['vehicle', 'partner']);
        $companyName = (string) Setting::getValue('site.company_name', config('app.name', 'Rental Mobil'));
        $customerName = $rental->partner?->name ?? 'Pelanggan';
        $portalUrl = $rental->public_token ? url('/book/rental/booking/'.$rental->public_token) : '';

        $refundAmount = (float) $rental->deposit_refunded_amount;
        $formattedRefund = 'Rp '.number_format($refundAmount, 0, ',', '.');
        $bankInfo = "{$rental->deposit_refund_bank_name} - {$rental->deposit_refund_account_number} a/n {$rental->deposit_refund_account_name}";

        $message = "💸 *DANA DEPOSIT BERHASIL DITRANSFER - {$companyName}*\n\n"
            ."Halo Bpk/Ibu *{$customerName}*,\n"
            ."Kabar baik! Dana pengembalian jaminan deposit untuk pesanan rental *{$rental->code}* sebesar *{$formattedRefund}* telah *SELESAI DITRANSFER* ke rekening Anda:\n\n"
            ."🏦 *Tujuan Transfer:*\n"
            ."• {$bankInfo}\n"
            ."• Jumlah Dana: *{$formattedRefund}*\n\n"
            .($rental->deposit_refund_notes ? "📝 *Catatan Finance:*\n{$rental->deposit_refund_notes}\n\n" : '')
            .($portalUrl ? "Lihat tanda terima & bukti transfer melalui portal resmi:\n{$portalUrl}\n\n" : '')
            ."Terima kasih banyak telah mempercayakan rental kendaraan kepada {$companyName}. Sampai jumpa pada perjalanan berikutnya!";

        return $this->dispatch($phone, $message);
    }

    public function sendExtensionRequested(Rental $rental, RentalExtensionRequest $request): bool
    {
        $phone = $this->resolvePhone($rental);
        if (blank($phone)) {
            return false;
        }

        $rental->loadMissing(['vehicle', 'partner']);
        $companyName = (string) Setting::getValue('site.company_name', config('app.name', 'Rental Mobil'));
        $customerName = $rental->partner?->name ?? 'Pelanggan';
        $vehicleInfo = $rental->vehicle ? "{$rental->vehicle->name} [{$rental->vehicle->plate_number}]" : 'Unit Kendaraan';
        $portalUrl = $rental->public_token ? url('/book/rental/booking/'.$rental->public_token) : '';

        $newEndDate = $request->requested_end_date ? $request->requested_end_date->format('d/m/Y') : '-';
        $formattedAmount = 'Rp '.number_format((float) $request->estimated_amount, 0, ',', '.');
        $periods = (int) $request->estimated_periods;

        $conflictNotice = $request->has_conflict
            ? '⚠️ *Catatan Jadwal:* Tanggal yang Anda pilih beririsan dengan jadwal pemesanan pelanggan lain. Tim operasional kami sedang memeriksa opsi alokasi unit armada pengganti. *Mohon TIDAK melakukan pembayaran atau transfer sebelum pengajuan ini disetujui staf.*'
            : '✅ *Ketersediaan:* Unit tersedia bebas bentrok. Pengajuan sedang diproses untuk verifikasi operasional.';

        $message = "⏱️ *PENGAJUAN PERPANJANGAN SEWA - {$companyName}*\n\n"
            ."Halo Bpk/Ibu *{$customerName}*,\n"
            ."Permohonan perpanjangan durasi sewa untuk pesanan *{$rental->code}* telah berhasil kami terima:\n\n"
            ."📋 *Rincian Pengajuan:*\n"
            ."• Kendaraan: *{$vehicleInfo}*\n"
            ."• Jadwal Selesai Baru: *{$newEndDate}* (+{$periods} hari)\n"
            ."• Estimasi Tagihan Tambahan: *{$formattedAmount}*\n\n"
            ."{$conflictNotice}\n\n"
            .($portalUrl ? "Pantau status pengajuan perpanjangan Anda melalui portal:\n{$portalUrl}\n\n" : '')
            .'Terima kasih atas kepercayaan Anda!';

        return $this->dispatch($phone, $message);
    }

    public function sendExtensionApproved(Rental $rental, RentalExtensionRequest $request): bool
    {
        $phone = $this->resolvePhone($rental);
        if (blank($phone)) {
            return false;
        }

        $rental->loadMissing(['vehicle', 'partner']);
        $companyName = (string) Setting::getValue('site.company_name', config('app.name', 'Rental Mobil'));
        $customerName = $rental->partner?->name ?? 'Pelanggan';
        $vehicleInfo = $rental->vehicle ? "{$rental->vehicle->name} [{$rental->vehicle->plate_number}]" : 'Unit Kendaraan';
        $portalUrl = $rental->public_token ? url('/book/rental/booking/'.$rental->public_token) : '';

        $newEndDate = $request->requested_end_date ? $request->requested_end_date->format('d/m/Y') : '-';
        $formattedAmount = 'Rp '.number_format((float) $request->estimated_amount, 0, ',', '.');

        $message = "🎉 *PERPANJANGAN SEWA DISETUJUI - {$companyName}*\n\n"
            ."Halo Bpk/Ibu *{$customerName}*,\n"
            ."Kabar gembira! Pengajuan perpanjangan sewa untuk pesanan *{$rental->code}* telah *DISETUJUI* oleh staf operasional kami.\n\n"
            ."📋 *Status Sewa Terkini:*\n"
            ."• Kendaraan: *{$vehicleInfo}*\n"
            ."• Jadwal Selesai Baru: *{$newEndDate}*\n"
            ."• Total Tagihan Tambahan: *{$formattedAmount}*\n\n"
            .($request->staff_notes ? "📝 *Catatan Staf:*\n{$request->staff_notes}\n\n" : '')
            ."💳 Invoice perpanjangan telah diterbitkan. Silakan lakukan pembayaran tagihan secara online melalui portal resmi:\n"
            ."{$portalUrl}\n\n"
            ."Terima kasih dan selamat menikmati perjalanan Anda bersama {$companyName}!";

        return $this->dispatch($phone, $message);
    }

    public function sendExtensionRejected(Rental $rental, RentalExtensionRequest $request): bool
    {
        $phone = $this->resolvePhone($rental);
        if (blank($phone)) {
            return false;
        }

        $rental->loadMissing(['vehicle', 'partner']);
        $companyName = (string) Setting::getValue('site.company_name', config('app.name', 'Rental Mobil'));
        $customerName = $rental->partner?->name ?? 'Pelanggan';
        $vehicleInfo = $rental->vehicle ? "{$rental->vehicle->name} [{$rental->vehicle->plate_number}]" : 'Unit Kendaraan';
        $portalUrl = $rental->public_token ? url('/book/rental/booking/'.$rental->public_token) : '';

        $currentEndDate = $rental->end_date ? $rental->end_date->format('d/m/Y') : '-';
        $returnLoc = $rental->return_delivery_address ?: ($rental->return_location ?: 'Pool Garasi');

        $message = "⚠️ *PEMBERITAHUAN PERPANJANGAN SEWA - {$companyName}*\n\n"
            ."Halo Bpk/Ibu *{$customerName}*,\n"
            ."Mohon maaf, pengajuan perpanjangan sewa untuk pesanan *{$rental->code}* ({$vehicleInfo}) *BELUM DAPAT KAMI SETUJUI*.\n\n"
            .($request->staff_notes ? "📝 *Alasan / Catatan Staf:*\n{$request->staff_notes}\n\n" : '')
            ."Mohon untuk tetap mengembalikan kendaraan tepat waktu sesuai jadwal awal:\n"
            ."• Batas Pengembalian: *{$currentEndDate}*\n"
            ."• Lokasi Pengembalian: *{$returnLoc}*\n\n"
            .($portalUrl ? "Lihat rincian pemesanan Anda melalui portal:\n{$portalUrl}\n\n" : '')
            .'Terima kasih atas pengertian dan kerja sama Anda.';

        return $this->dispatch($phone, $message);
    }

    /**
     * @param  list<\Modules\Rental\Models\RentalCharge>  $charges
     */
    public function sendAddonPurchased(Rental $rental, array $charges): bool
    {
        $phone = $this->resolvePhone($rental);
        if (blank($phone) || empty($charges)) {
            return false;
        }

        $rental->loadMissing(['vehicle', 'partner']);
        $companyName = (string) Setting::getValue('site.company_name', config('app.name', 'Rental Mobil'));
        $customerName = $rental->partner?->name ?? 'Pelanggan';
        $vehicleInfo = $rental->vehicle ? "{$rental->vehicle->name} [{$rental->vehicle->plate_number}]" : 'Unit Kendaraan';
        $portalUrl = $rental->public_token ? url('/book/rental/booking/'.$rental->public_token) : '';

        $totalAdditional = 0.0;
        $itemsText = '';
        foreach ($charges as $charge) {
            $amt = (float) $charge->amount;
            $totalAdditional += $amt;
            $itemsText .= "• {$charge->description}: *Rp ".number_format($amt, 0, ',', '.')."*\n";
        }

        $formattedTotal = 'Rp '.number_format($totalAdditional, 0, ',', '.');

        $message = "📦 *LAYANAN & AKSESORIS TAMBAHAN DITERIMA - {$companyName}*\n\n"
            ."Halo Bpk/Ibu *{$customerName}*,\n"
            ."Pesanan layanan dan aksesoris tambahan untuk booking *{$rental->code}* ({$vehicleInfo}) telah berhasil dicatat.\n\n"
            ."📋 *Rincian Add-ons yang Dipesan:*\n"
            .$itemsText."\n"
            ."💵 *Total Biaya Tambahan: {$formattedTotal}*\n\n"
            ."Tagihan invoice telah diterbitkan secara otomatis. Anda dapat melakukan pembayaran dan memeriksa status pemesanan melalui portal:\n"
            ."{$portalUrl}\n\n"
            ."Terima kasih telah mempercayakan perjalanan Anda bersama {$companyName}!";

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
            'driver_assigned' => 'whatsapp.send_on_driver_assigned',
            'driver_on_duty' => 'whatsapp.send_to_driver_on_duty',
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
