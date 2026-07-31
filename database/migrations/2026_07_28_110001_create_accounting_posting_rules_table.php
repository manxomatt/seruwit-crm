<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounting_posting_rules', function (Blueprint $table) {
            $table->id();
            $table->string('event_key', 64)->index();
            $table->string('side', 8);
            $table->string('system_role', 64);
            $table->string('amount_key', 32);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('skip_if_zero')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        if (Schema::hasTable('accounts')) {
            DB::table('accounts')
                ->where('code', '6100')
                ->whereNull('system_role')
                ->update(['system_role' => 'opex', 'updated_at' => now()]);
        }

        if (Schema::hasTable('journal_entries')) {
            Schema::table('journal_entries', function (Blueprint $table) {
                $table->unique(['source_type', 'source_id', 'event'], 'journal_entries_source_event_unique');
            });
        }

        $this->seedRules();
    }

    public function down(): void
    {
        if (Schema::hasTable('journal_entries')) {
            Schema::table('journal_entries', function (Blueprint $table) {
                $table->dropUnique('journal_entries_source_event_unique');
            });
        }

        Schema::dropIfExists('accounting_posting_rules');
    }

    private function seedRules(): void
    {
        $now = now();
        $rows = [
            // invoice.issued
            ['event_key' => 'invoice.issued', 'side' => 'debit', 'system_role' => 'ar_control', 'amount_key' => 'total', 'sort_order' => 1],
            ['event_key' => 'invoice.issued', 'side' => 'credit', 'system_role' => 'sales_revenue', 'amount_key' => 'net', 'sort_order' => 2],
            ['event_key' => 'invoice.issued', 'side' => 'credit', 'system_role' => 'tax_output', 'amount_key' => 'tax', 'sort_order' => 3],
            // credit_note.issued
            ['event_key' => 'credit_note.issued', 'side' => 'debit', 'system_role' => 'sales_revenue', 'amount_key' => 'net', 'sort_order' => 1],
            ['event_key' => 'credit_note.issued', 'side' => 'debit', 'system_role' => 'tax_output', 'amount_key' => 'tax', 'sort_order' => 2],
            ['event_key' => 'credit_note.issued', 'side' => 'credit', 'system_role' => 'ar_control', 'amount_key' => 'total', 'sort_order' => 3],
            // ar_payment.recorded
            ['event_key' => 'ar_payment.recorded', 'side' => 'debit', 'system_role' => 'payment_cash', 'amount_key' => 'paid', 'sort_order' => 1],
            ['event_key' => 'ar_payment.recorded', 'side' => 'credit', 'system_role' => 'ar_control', 'amount_key' => 'paid', 'sort_order' => 2],
            // supplier_bill.issued
            ['event_key' => 'supplier_bill.issued', 'side' => 'debit', 'system_role' => 'purchase_clearing', 'amount_key' => 'net', 'sort_order' => 1],
            ['event_key' => 'supplier_bill.issued', 'side' => 'debit', 'system_role' => 'tax_input', 'amount_key' => 'tax', 'sort_order' => 2],
            ['event_key' => 'supplier_bill.issued', 'side' => 'credit', 'system_role' => 'ap_control', 'amount_key' => 'total', 'sort_order' => 3],
            // supplier_credit.issued
            ['event_key' => 'supplier_credit.issued', 'side' => 'debit', 'system_role' => 'ap_control', 'amount_key' => 'total', 'sort_order' => 1],
            ['event_key' => 'supplier_credit.issued', 'side' => 'credit', 'system_role' => 'purchase_clearing', 'amount_key' => 'net', 'sort_order' => 2],
            ['event_key' => 'supplier_credit.issued', 'side' => 'credit', 'system_role' => 'tax_input', 'amount_key' => 'tax', 'sort_order' => 3],
            // bill_payment.recorded
            ['event_key' => 'bill_payment.recorded', 'side' => 'debit', 'system_role' => 'ap_control', 'amount_key' => 'paid', 'sort_order' => 1],
            ['event_key' => 'bill_payment.recorded', 'side' => 'credit', 'system_role' => 'payment_cash', 'amount_key' => 'paid', 'sort_order' => 2],
        ];

        foreach ($rows as $row) {
            DB::table('accounting_posting_rules')->insert([
                ...$row,
                'skip_if_zero' => true,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
};
