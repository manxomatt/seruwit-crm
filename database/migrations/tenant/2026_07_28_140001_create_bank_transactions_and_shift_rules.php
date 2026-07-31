<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('bank_transactions') && Schema::hasTable('company_bank_accounts')) {
            Schema::create('bank_transactions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('company_bank_account_id')
                    ->constrained('company_bank_accounts')
                    ->cascadeOnDelete();
                $table->foreignId('counterparty_account_id')
                    ->nullable()
                    ->constrained('company_bank_accounts')
                    ->nullOnDelete();
                $table->uuid('transfer_group')->nullable()->index();
                $table->string('type', 32);
                $table->string('direction', 8);
                $table->date('transacted_on');
                $table->decimal('amount', 15, 2);
                $table->string('reference')->nullable();
                $table->text('memo')->nullable();
                $table->nullableMorphs('source');
                $table->string('status', 16)->default('posted');
                $table->boolean('is_cleared')->default(false);
                $table->date('cleared_on')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(['company_bank_account_id', 'transacted_on']);
                $table->index(['status', 'is_cleared']);
            });
        }

        if (! Schema::hasTable('accounting_posting_rules')) {
            return;
        }

        $now = now();
        $rows = [
            ['event_key' => 'pos_shift.shortage', 'side' => 'debit', 'system_role' => 'cash_variance', 'amount_key' => 'variance', 'sort_order' => 1],
            ['event_key' => 'pos_shift.shortage', 'side' => 'credit', 'system_role' => 'payment_cash', 'amount_key' => 'variance', 'sort_order' => 2],
            ['event_key' => 'pos_shift.overage', 'side' => 'debit', 'system_role' => 'payment_cash', 'amount_key' => 'variance', 'sort_order' => 1],
            ['event_key' => 'pos_shift.overage', 'side' => 'credit', 'system_role' => 'cash_variance', 'amount_key' => 'variance', 'sort_order' => 2],
        ];

        foreach ($rows as $row) {
            $exists = DB::table('accounting_posting_rules')
                ->where('event_key', $row['event_key'])
                ->where('system_role', $row['system_role'])
                ->where('amount_key', $row['amount_key'])
                ->where('side', $row['side'])
                ->exists();

            if ($exists) {
                continue;
            }

            DB::table('accounting_posting_rules')->insert([
                ...$row,
                'skip_if_zero' => true,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_transactions');

        if (Schema::hasTable('accounting_posting_rules')) {
            DB::table('accounting_posting_rules')
                ->whereIn('event_key', ['pos_shift.shortage', 'pos_shift.overage'])
                ->delete();
        }
    }
};
