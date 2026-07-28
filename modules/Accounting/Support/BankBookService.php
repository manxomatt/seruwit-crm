<?php

namespace Modules\Accounting\Support;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Modules\Accounting\Models\BankTransaction;
use Modules\Accounting\Models\CompanyBankAccount;
use Modules\Payables\Models\BillPayment;
use Modules\Receivables\Models\Payment;

class BankBookService
{
    public static function isReady(): bool
    {
        return Schema::hasTable('bank_transactions')
            && Schema::hasTable('company_bank_accounts')
            && PaymentAccountResolver::tablesReady();
    }

    public function recordInboundPayment(Payment $payment): ?BankTransaction
    {
        if (! self::isReady()) {
            return null;
        }

        $existing = $this->findPostedForSource($payment);
        if ($existing !== null) {
            return $existing;
        }

        $account = app(PaymentAccountResolver::class)->resolveCompanyAccount(
            method: (string) $payment->method,
            companyBankAccountId: $payment->company_bank_account_id ? (int) $payment->company_bank_account_id : null,
        );

        if ($account === null) {
            return null;
        }

        return BankTransaction::query()->create([
            'company_bank_account_id' => $account->id,
            'type' => BankTransaction::TYPE_DEPOSIT,
            'direction' => BankTransaction::DIRECTION_IN,
            'transacted_on' => ($payment->payment_date ?? now())->toDateString(),
            'amount' => round((float) $payment->amount, 2),
            'reference' => $payment->code,
            'memo' => __('accounting.messages.source_ar_payment', ['code' => $payment->code]),
            'source_type' => $payment->getMorphClass(),
            'source_id' => (int) $payment->id,
            'status' => BankTransaction::STATUS_POSTED,
            'created_by' => Auth::id(),
        ]);
    }

    public function recordOutboundBillPayment(BillPayment $payment): ?BankTransaction
    {
        if (! self::isReady()) {
            return null;
        }

        $existing = $this->findPostedForSource($payment);
        if ($existing !== null) {
            return $existing;
        }

        $account = app(PaymentAccountResolver::class)->resolveCompanyAccount(
            method: (string) $payment->method,
            companyBankAccountId: $payment->company_bank_account_id ? (int) $payment->company_bank_account_id : null,
        );

        if ($account === null) {
            return null;
        }

        $paid = round((float) $payment->amount, 2);
        $wht = round((float) ($payment->wht_amount ?? 0), 2);
        $cashOut = round(max(0, $paid - $wht), 2);

        if ($cashOut < 0.005) {
            return null;
        }

        return BankTransaction::query()->create([
            'company_bank_account_id' => $account->id,
            'type' => BankTransaction::TYPE_WITHDRAWAL,
            'direction' => BankTransaction::DIRECTION_OUT,
            'transacted_on' => ($payment->payment_date ?? now())->toDateString(),
            'amount' => $cashOut,
            'reference' => $payment->code,
            'memo' => __('accounting.messages.source_bill_payment', ['code' => $payment->code]),
            'source_type' => $payment->getMorphClass(),
            'source_id' => (int) $payment->id,
            'status' => BankTransaction::STATUS_POSTED,
            'created_by' => Auth::id(),
        ]);
    }

    public function voidForSource(Model $source): void
    {
        if (! self::isReady()) {
            return;
        }

        BankTransaction::query()
            ->where('source_type', $source->getMorphClass())
            ->where('source_id', (int) $source->getKey())
            ->where('status', BankTransaction::STATUS_POSTED)
            ->update([
                'status' => BankTransaction::STATUS_VOIDED,
                'updated_at' => now(),
            ]);
    }

    /**
     * Record a transfer between company accounts, optionally linked to a source document.
     *
     * @return list<BankTransaction>
     */
    public function recordTransfer(
        CompanyBankAccount $from,
        CompanyBankAccount $to,
        float $amount,
        string $date,
        ?string $reference = null,
        ?string $memo = null,
        ?Model $source = null,
    ): array {
        if (! self::isReady()) {
            throw ValidationException::withMessages([
                'accounting' => __('accounting.validation.bank_book_unavailable'),
            ]);
        }

        $amount = round($amount, 2);
        if ($amount < 0.005) {
            throw ValidationException::withMessages([
                'amount' => __('accounting.validation.bank_amount_positive'),
            ]);
        }

        if ($from->id === $to->id) {
            throw ValidationException::withMessages([
                'counterparty_account_id' => __('accounting.validation.bank_transfer_accounts'),
            ]);
        }

        if ($source !== null) {
            $existing = $this->findPostedForSource($source);
            if ($existing !== null) {
                $group = $existing->transfer_group;
                if ($group) {
                    return BankTransaction::query()
                        ->where('transfer_group', $group)
                        ->where('status', BankTransaction::STATUS_POSTED)
                        ->orderBy('id')
                        ->get()
                        ->all();
                }

                return [$existing];
            }
        }

        $this->assertActiveAccount((int) $from->id);
        $this->assertActiveAccount((int) $to->id);

        return DB::transaction(function () use ($from, $to, $amount, $date, $reference, $memo, $source): array {
            $group = (string) Str::uuid();
            $sourceType = $source?->getMorphClass();
            $sourceId = $source ? (int) $source->getKey() : null;

            $out = BankTransaction::query()->create([
                'company_bank_account_id' => $from->id,
                'counterparty_account_id' => $to->id,
                'transfer_group' => $group,
                'type' => BankTransaction::TYPE_TRANSFER,
                'direction' => BankTransaction::DIRECTION_OUT,
                'transacted_on' => $date,
                'amount' => $amount,
                'reference' => $reference,
                'memo' => $memo,
                'source_type' => $sourceType,
                'source_id' => $sourceId,
                'status' => BankTransaction::STATUS_POSTED,
                'created_by' => Auth::id(),
            ]);

            $in = BankTransaction::query()->create([
                'company_bank_account_id' => $to->id,
                'counterparty_account_id' => $from->id,
                'transfer_group' => $group,
                'type' => BankTransaction::TYPE_TRANSFER,
                'direction' => BankTransaction::DIRECTION_IN,
                'transacted_on' => $date,
                'amount' => $amount,
                'reference' => $reference,
                'memo' => $memo,
                'source_type' => $sourceType,
                'source_id' => $sourceId,
                'status' => BankTransaction::STATUS_POSTED,
                'created_by' => Auth::id(),
            ]);

            return [$out, $in];
        });
    }

    /**
     * @param  array{
     *     type: string,
     *     company_bank_account_id: int,
     *     counterparty_account_id?: int|null,
     *     transacted_on: string,
     *     amount: float|int|string,
     *     reference?: string|null,
     *     memo?: string|null
     * }  $data
     * @return list<BankTransaction>
     */
    public function recordManual(array $data): array
    {
        if (! self::isReady()) {
            throw ValidationException::withMessages([
                'accounting' => __('accounting.validation.bank_book_unavailable'),
            ]);
        }

        $type = (string) $data['type'];
        $amount = round((float) $data['amount'], 2);
        $fromId = (int) $data['company_bank_account_id'];
        $date = (string) $data['transacted_on'];
        $reference = $data['reference'] ?? null;
        $memo = $data['memo'] ?? null;

        if ($amount < 0.005) {
            throw ValidationException::withMessages([
                'amount' => __('accounting.validation.bank_amount_positive'),
            ]);
        }

        if ($type === BankTransaction::TYPE_TRANSFER) {
            $toId = (int) ($data['counterparty_account_id'] ?? 0);
            $from = CompanyBankAccount::query()->findOrFail($fromId);
            $to = CompanyBankAccount::query()->findOrFail($toId);

            return $this->recordTransfer($from, $to, $amount, $date, $reference, $memo);
        }

        return DB::transaction(function () use ($type, $amount, $fromId, $date, $reference, $memo): array {
            $this->assertActiveAccount($fromId);

            $direction = in_array($type, [BankTransaction::TYPE_DEPOSIT], true)
                ? BankTransaction::DIRECTION_IN
                : BankTransaction::DIRECTION_OUT;

            $txn = BankTransaction::query()->create([
                'company_bank_account_id' => $fromId,
                'type' => $type,
                'direction' => $direction,
                'transacted_on' => $date,
                'amount' => $amount,
                'reference' => $reference,
                'memo' => $memo,
                'status' => BankTransaction::STATUS_POSTED,
                'created_by' => Auth::id(),
            ]);

            return [$txn];
        });
    }

    /**
     * @param  list<int>  $ids
     */
    public function markCleared(array $ids, ?string $clearedOn = null): int
    {
        if (! self::isReady() || $ids === []) {
            return 0;
        }

        $date = $clearedOn ?? now()->toDateString();

        return BankTransaction::query()
            ->whereIn('id', $ids)
            ->where('status', BankTransaction::STATUS_POSTED)
            ->where('is_cleared', false)
            ->update([
                'is_cleared' => true,
                'cleared_on' => $date,
                'updated_at' => now(),
            ]);
    }

    /**
     * @param  list<int>  $ids
     */
    public function markUncleared(array $ids): int
    {
        if (! self::isReady() || $ids === []) {
            return 0;
        }

        return BankTransaction::query()
            ->whereIn('id', $ids)
            ->where('status', BankTransaction::STATUS_POSTED)
            ->where('is_cleared', true)
            ->update([
                'is_cleared' => false,
                'cleared_on' => null,
                'updated_at' => now(),
            ]);
    }

    public function findPostedForSource(Model $source): ?BankTransaction
    {
        return BankTransaction::query()
            ->where('source_type', $source->getMorphClass())
            ->where('source_id', (int) $source->getKey())
            ->where('status', BankTransaction::STATUS_POSTED)
            ->first();
    }

    private function assertActiveAccount(int $id): void
    {
        $exists = CompanyBankAccount::query()
            ->whereKey($id)
            ->where('is_active', true)
            ->exists();

        if (! $exists) {
            throw ValidationException::withMessages([
                'company_bank_account_id' => __('accounting.validation.bank_account_inactive'),
            ]);
        }
    }
}
