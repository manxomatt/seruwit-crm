<?php

namespace Modules\Collections\Support;

use App\Models\User;
use Carbon\Carbon;
use Modules\Collections\Models\CollectionDunning;
use Modules\Invoicing\Models\Invoice;

class DunningAutomationService
{
    /**
     * Determine dunning stage according to invoice due date.
     */
    public function determineStage(Invoice $invoice): string
    {
        if (! $invoice->due_date) {
            return CollectionDunning::STAGE_DUE_H0;
        }

        $dueDate = Carbon::parse($invoice->due_date)->startOfDay();
        $today = Carbon::today();

        $diffDays = (int) $today->diffInDays($dueDate, false); // negative means overdue

        if ($diffDays > 0) {
            return CollectionDunning::STAGE_REMINDER_H3;
        }

        if ($diffDays === 0) {
            return CollectionDunning::STAGE_DUE_H0;
        }

        $overdueDays = abs($diffDays);

        if ($overdueDays <= 7) {
            return CollectionDunning::STAGE_OVERDUE_H7;
        }

        if ($overdueDays <= 14) {
            return CollectionDunning::STAGE_OVERDUE_H14;
        }

        return CollectionDunning::STAGE_OVERDUE_H30;
    }

    /**
     * Build message template for reminder.
     */
    public function formatMessage(Invoice $invoice, string $stage): string
    {
        $partnerName = $invoice->partner?->name ?? 'Pelanggan';
        $remaining = number_format((float) $invoice->balanceDue(), 0, ',', '.');
        $dueDate = $invoice->due_date ? Carbon::parse($invoice->due_date)->format('d/m/Y') : '-';
        $code = $invoice->code;

        return match ($stage) {
            CollectionDunning::STAGE_REMINDER_H3 => "Halo {$partnerName},\n\nIni adalah pengingat ramah bahwa Invoice {$code} senilai Rp {$remaining} akan jatuh tempo pada {$dueDate}.\n\nMohon lakukan pembayaran tepat waktu agar operasional tetap berjalan lancar.\nTerima kasih.\nPT Seruwit Transport & Logistics",
            CollectionDunning::STAGE_DUE_H0 => "Halo {$partnerName},\n\nInvoice {$code} senilai Rp {$remaining} jatuh tempo HARI INI ({$dueDate}).\n\nSilakan konfirmasi jika pembayaran telah dilakukan. Terima kasih atas kerja samanya.\nPT Seruwit Transport & Logistics",
            CollectionDunning::STAGE_OVERDUE_H7 => "Yth. {$partnerName},\n\nKami menginformasikan bahwa Invoice {$code} senilai Rp {$remaining} telah melewati jatuh tempo ({$dueDate}) selama 7 hari.\n\nMohon kesediaan Bapak/Ibu untuk segera menyelesaikan kewajiban ini atau mengonfirmasi jadwal pembayaran.\nPT Seruwit Transport & Logistics",
            CollectionDunning::STAGE_OVERDUE_H14 => "Pemberitahuan Penagihan Penting:\n\nYth. Manajemen {$partnerName},\nInvoice {$code} senilai Rp {$remaining} telah menunggak selama 14 hari. Mohon hubungi bagian Finance kami untuk konfirmasi pembayaran hari ini guna menghindari penghentian layanan sementara.\nPT Seruwit Transport & Logistics",
            default => "SURAT TEGURAN / FINAL NOTICE:\n\nYth. {$partnerName},\nTagihan Invoice {$code} sebesar Rp {$remaining} belum diselesaikan dan telah melewati batas toleransi penagihan. Mohon segera melunasi tagihan ini sebelum proses penagihan lebih lanjut dilakukan.\nPT Seruwit Transport & Logistics",
        };
    }

    /**
     * Dispatch reminder and record dunning log.
     */
    public function sendReminder(Invoice $invoice, string $channel = 'whatsapp', ?User $actor = null): CollectionDunning
    {
        $invoice->loadMissing('partner');
        $stage = $this->determineStage($invoice);
        $message = $this->formatMessage($invoice, $stage);

        $recipient = $invoice->partner?->phone
            ?? $invoice->partner?->email
            ?? 'Finance Team';

        return CollectionDunning::query()->create([
            'invoice_id' => $invoice->id,
            'partner_id' => $invoice->partner_id,
            'stage' => $stage,
            'channel' => $channel,
            'recipient' => $recipient,
            'status' => CollectionDunning::STATUS_SENT,
            'message_body' => $message,
            'sent_at' => now(),
            'sent_by' => $actor?->id,
        ]);
    }
}
