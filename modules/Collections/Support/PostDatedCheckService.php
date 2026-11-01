<?php

namespace Modules\Collections\Support;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Support\AccountingBridge;
use Modules\Accounting\Support\BankBookService;
use Modules\Accounting\Support\JournalService;
use Modules\Accounting\Support\PaymentAccountResolver;
use Modules\Collections\Models\PostDatedCheck;
use Modules\Receivables\Models\Payment;
use Modules\Receivables\Support\PaymentRecorder;

class PostDatedCheckService
{
    public function __construct(
        private readonly JournalService $journals,
        private readonly BankBookService $bankBook,
        private readonly PaymentAccountResolver $accountResolver,
    ) {}

    /**
     * Mark PDC as deposited to bank for clearing.
     */
    public function deposit(PostDatedCheck $pdc): PostDatedCheck
    {
        if ($pdc->isCleared() || $pdc->status === PostDatedCheck::STATUS_CANCELLED) {
            throw ValidationException::withMessages([
                'pdc' => 'Giro yang sudah cair atau dibatalkan tidak dapat dititipkan.',
            ]);
        }

        $pdc->update([
            'status' => PostDatedCheck::STATUS_DEPOSITED,
        ]);

        return $pdc->fresh(['partner', 'invoice', 'companyBankAccount']);
    }

    /**
     * Clear the PDC, record Payment against Invoice & BankBook, and post GL.
     */
    public function clear(PostDatedCheck $pdc, ?int $companyBankAccountId = null, ?User $actor = null): PostDatedCheck
    {
        if ($pdc->isCleared()) {
            return $pdc;
        }

        if ($pdc->status === PostDatedCheck::STATUS_CANCELLED) {
            throw ValidationException::withMessages([
                'pdc' => 'Giro yang dibatalkan tidak dapat dicairkan.',
            ]);
        }

        return DB::transaction(function () use ($pdc, $companyBankAccountId, $actor): PostDatedCheck {
            $pdc->loadMissing(['partner', 'invoice']);

            $bankAccountId = $companyBankAccountId ?? $pdc->company_bank_account_id;
            $companyBankAccount = $this->accountResolver->resolveCompanyAccount('bank_transfer', $bankAccountId);
            $amount = round((float) $pdc->amount, 2);

            // 1. If invoice is attached, record via Receivables PaymentRecorder
            if ($pdc->invoice_id && class_exists(PaymentRecorder::class)) {
                PaymentRecorder::record([
                    'partner_id' => $pdc->partner_id,
                    'payment_date' => now()->toDateString(),
                    'amount' => $amount,
                    'type' => Payment::TYPE_SETTLEMENT,
                    'method' => Payment::METHOD_GIRO,
                    'reference_number' => $pdc->check_number,
                    'company_bank_account_id' => $companyBankAccount?->id ?? $bankAccountId,
                    'notes' => "Pencairan Giro {$pdc->check_number} ({$pdc->bank_name})",
                    'recorded_by' => $actor?->id,
                    'allocations' => [
                        [
                            'invoice_id' => (int) $pdc->invoice_id,
                            'amount' => $amount,
                        ],
                    ],
                ]);
            } else {
                // 2. Direct BankBook & General Ledger recording if no invoice attached
                if (BankBookService::isReady()) {
                    $this->bankBook->recordInboundFromSource(
                        source: $pdc,
                        amount: $amount,
                        date: now()->toDateString(),
                        method: 'giro',
                        companyBankAccountId: $companyBankAccount?->id ?? $bankAccountId,
                        reference: $pdc->check_number,
                        memo: "Pencairan Giro {$pdc->check_number} - {$pdc->partner?->name}",
                        eventKey: 'collections.pdc_cleared',
                    );
                }

                if (AccountingBridge::available()) {
                    $cashLedgerAccount = $companyBankAccount?->ledgerAccount
                        ?? Account::query()->where('system_role', 'bank_primary')->first()
                        ?? Account::query()->where('code', '1120')->first();

                    $arAccount = Account::query()->where('system_role', 'ar')->first()
                        ?? Account::query()->where('code', '1130')->first();

                    if ($cashLedgerAccount && $arAccount) {
                        $entry = $this->journals->createDraft([
                            'entry_date' => now()->toDateString(),
                            'type' => JournalEntry::TYPE_AUTO,
                            'memo' => "Pencairan Bilyet Giro {$pdc->check_number}: {$pdc->partner?->name}",
                            'lines' => [
                                [
                                    'account_id' => $cashLedgerAccount->id,
                                    'debit' => $amount,
                                    'credit' => 0,
                                    'partner_id' => $pdc->partner_id,
                                    'memo' => "Penerimaan Giro {$pdc->check_number}",
                                ],
                                [
                                    'account_id' => $arAccount->id,
                                    'debit' => 0,
                                    'credit' => $amount,
                                    'partner_id' => $pdc->partner_id,
                                    'memo' => "Pelunasan Piutang via Giro {$pdc->check_number}",
                                ],
                            ],
                        ], $actor?->id);

                        $entry->update([
                            'source_type' => $pdc->getMorphClass(),
                            'source_id' => (int) $pdc->id,
                            'event' => 'collections.pdc_cleared',
                        ]);

                        $this->journals->post($entry, $actor?->id);
                    }
                }
            }

            $pdc->update([
                'status' => PostDatedCheck::STATUS_CLEARED,
                'company_bank_account_id' => $companyBankAccount?->id ?? $bankAccountId,
                'cleared_at' => now(),
            ]);

            return $pdc->fresh(['partner', 'invoice', 'companyBankAccount']);
        });
    }

    /**
     * Mark PDC as bounced (tolak giro / warkat kosong).
     */
    public function bounce(PostDatedCheck $pdc, string $reason, ?User $actor = null): PostDatedCheck
    {
        if ($pdc->isCleared()) {
            throw ValidationException::withMessages([
                'pdc' => 'Giro yang sudah cair tidak dapat ditolak.',
            ]);
        }

        $pdc->update([
            'status' => PostDatedCheck::STATUS_BOUNCED,
            'bounced_reason' => $reason,
        ]);

        return $pdc->fresh(['partner', 'invoice']);
    }
}
