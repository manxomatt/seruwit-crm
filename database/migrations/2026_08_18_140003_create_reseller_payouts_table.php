<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A batch payment of accrued commissions to one reseller.
 *
 * Created in phase 1 only so the commission ledger can carry its `payout_id`
 * foreign key; the batching workflow itself lands in a later phase.
 *
 * Bank details are snapshotted here rather than read from the profile at
 * display time: a payout must always show the account the money actually went
 * to, even after the reseller edits their profile.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reseller_payouts', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->uuid('reseller_global_id');
            $table->string('reference', 30)->unique();
            $table->date('period_start');
            $table->date('period_end');

            $table->decimal('gross_amount', 14, 2)->default(0);
            $table->decimal('tax_withheld_amount', 14, 2)->default(0);
            $table->decimal('net_amount', 14, 2)->default(0);
            $table->string('currency', 3)->default('IDR');
            $table->string('status', 20)->default('draft');

            $table->string('bank_name', 100)->nullable();
            $table->string('account_number', 50)->nullable();
            $table->string('account_name')->nullable();
            $table->string('transfer_proof_path')->nullable();

            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('paid_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['reseller_global_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reseller_payouts');
    }
};
