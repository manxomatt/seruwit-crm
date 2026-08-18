<?php

namespace App\Services;

use App\Models\ResellerCommission;
use App\Models\ResellerPayout;
use App\Models\ResellerProfile;
use App\Models\User;
use App\Notifications\ResellerPayoutPaidNotification;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Turns approved commissions into a batch payment, and records what actually
 * left the bank.
 *
 * A payout owns its commissions by stamping `payout_id` on them; that column is
 * the lock. Once a batch is paid, its rows are settled and can only be corrected
 * by a new negative entry, never by editing the batch.
 */
class ResellerPayoutService
{
    private function centralConnection(): string
    {
        return Config::get('tenancy.database.central_connection');
    }

    /**
     * Gather everything a reseller has earned in a period into a draft batch.
     *
     * Returns null when there is nothing to pay yet — no approved commissions,
     * or a total still under the minimum. Neither is an error: the commissions
     * stay unassigned and roll into the next period untouched.
     *
     * The period is measured on when a commission was *earned* (`created_at`),
     * not when it cleared its hold, so a statement covers the months the
     * reseller actually sold in.
     */
    public function buildDraft(string $resellerGlobalId, Carbon $periodStart, Carbon $periodEnd): ?ResellerPayout
    {
        $central = $this->centralConnection();
        $profile = ResellerProfile::ensureFor($resellerGlobalId);

        if (! $profile->canBePaid()) {
            throw new RuntimeException('Reseller is not eligible for payout: '.$profile->status);
        }

        return DB::connection($central)->transaction(function () use ($central, $resellerGlobalId, $periodStart, $periodEnd, $profile): ?ResellerPayout {
            // Locked for the length of the transaction so two admins building
            // batches at once cannot both claim the same commissions.
            $commissions = ResellerCommission::on($central)
                ->where('reseller_global_id', $resellerGlobalId)
                ->where('status', ResellerCommission::STATUS_APPROVED)
                ->whereNull('payout_id')
                ->whereBetween('created_at', [$periodStart->copy()->startOfDay(), $periodEnd->copy()->endOfDay()])
                ->lockForUpdate()
                ->get();

            if ($commissions->isEmpty()) {
                return null;
            }

            $gross = round((float) $commissions->sum('commission_amount'), 2);
            $tax = round((float) $commissions->sum('tax_withheld_amount'), 2);
            $net = round((float) $commissions->sum('net_amount'), 2);

            if ($net < $this->threshold($profile)) {
                return null;
            }

            $payout = ResellerPayout::on($central)->create([
                'reseller_global_id' => $resellerGlobalId,
                'reference' => $this->nextReference(),
                'period_start' => $periodStart->toDateString(),
                'period_end' => $periodEnd->toDateString(),
                'gross_amount' => $gross,
                'tax_withheld_amount' => $tax,
                'net_amount' => $net,
                'currency' => $commissions->first()->currency ?? 'IDR',
                'status' => ResellerPayout::STATUS_DRAFT,
                // Snapshotted: a payout must always show the account the money
                // went to, even after the reseller edits their profile.
                'bank_name' => $profile->payout_bank_name,
                'account_number' => $profile->payout_account_number,
                'account_name' => $profile->payout_account_name,
            ]);

            ResellerCommission::on($central)
                ->whereIn('id', $commissions->pluck('id'))
                ->update(['payout_id' => $payout->id]);

            return $payout->fresh();
        });
    }

    /**
     * The floor this reseller's batch has to clear. A per-reseller value wins;
     * zero means "use the platform default", not "no minimum".
     */
    private function threshold(ResellerProfile $profile): float
    {
        $own = (float) $profile->minimum_payout;

        return $own > 0 ? $own : (float) Config::get('reseller.minimum_payout', 0);
    }

    public function approve(ResellerPayout $payout, User $admin): void
    {
        if ($payout->status !== ResellerPayout::STATUS_DRAFT) {
            throw new RuntimeException('Cannot approve a payout in status: '.$payout->status);
        }

        $payout->setConnection($this->centralConnection());
        $payout->update([
            'status' => ResellerPayout::STATUS_APPROVED,
            'approved_by' => $admin->id,
            'approved_at' => now(),
        ]);
    }

    /**
     * Record the transfer: the batch is settled and every commission in it is
     * marked paid in the same breath, so the ledger and the batch can never
     * disagree about whether the money went out.
     */
    public function markPaid(ResellerPayout $payout, User $admin, ?UploadedFile $proof = null, ?string $notes = null): void
    {
        if ($payout->status !== ResellerPayout::STATUS_APPROVED) {
            throw new RuntimeException('Cannot pay a payout in status: '.$payout->status);
        }

        $central = $this->centralConnection();
        $path = $proof?->store('payout-proofs', 'payout_proofs');

        DB::connection($central)->transaction(function () use ($central, $payout, $admin, $path, $notes): void {
            $payout->setConnection($central);
            $payout->update([
                'status' => ResellerPayout::STATUS_PAID,
                'paid_by' => $admin->id,
                'paid_at' => now(),
                'transfer_proof_path' => $path ?? $payout->transfer_proof_path,
                'notes' => $notes ?? $payout->notes,
            ]);

            ResellerCommission::on($central)
                ->where('payout_id', $payout->id)
                ->update([
                    'status' => ResellerCommission::STATUS_PAID,
                    'paid_at' => now(),
                ]);
        });

        $reseller = User::on($central)->where('global_id', $payout->reseller_global_id)->first();
        $reseller?->notify(new ResellerPayoutPaidNotification($payout->fresh()));
    }

    /**
     * Abandon a batch that has not been paid, releasing its commissions back
     * into the pool so a later batch can pick them up.
     */
    public function cancel(ResellerPayout $payout): void
    {
        if ($payout->status === ResellerPayout::STATUS_PAID) {
            throw new RuntimeException('A paid payout cannot be cancelled.');
        }

        $central = $this->centralConnection();

        DB::connection($central)->transaction(function () use ($central, $payout): void {
            ResellerCommission::on($central)
                ->where('payout_id', $payout->id)
                ->update(['payout_id' => null]);

            $payout->setConnection($central);
            $payout->update(['status' => ResellerPayout::STATUS_CANCELLED]);
        });
    }

    /**
     * PAY-2026-08-0001 — sequential within the month it is created.
     */
    private function nextReference(): string
    {
        $prefix = 'PAY-'.now()->format('Y-m').'-';

        do {
            $sequence = ResellerPayout::on($this->centralConnection())
                ->where('reference', 'like', $prefix.'%')
                ->count() + 1;

            $reference = $prefix.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
            $taken = ResellerPayout::on($this->centralConnection())->where('reference', $reference)->exists();
        } while ($taken);

        return $reference;
    }
}
