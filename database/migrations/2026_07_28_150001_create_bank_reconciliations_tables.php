<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('company_bank_accounts')) {
            return;
        }

        if (! Schema::hasTable('bank_reconciliations')) {
            Schema::create('bank_reconciliations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('company_bank_account_id')
                    ->constrained('company_bank_accounts')
                    ->cascadeOnDelete();
                $table->date('period_start');
                $table->date('period_end');
                $table->date('statement_date');
                $table->decimal('opening_balance', 15, 2)->default(0);
                $table->decimal('closing_balance', 15, 2)->default(0);
                $table->string('status', 24)->default('open');
                $table->string('csv_filename')->nullable();
                $table->text('notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('completed_at')->nullable();
                $table->timestamps();

                $table->index(['company_bank_account_id', 'status']);
                $table->index(['period_start', 'period_end']);
            });
        }

        if (! Schema::hasTable('bank_statement_lines')) {
            Schema::create('bank_statement_lines', function (Blueprint $table) {
                $table->id();
                $table->foreignId('bank_reconciliation_id')
                    ->constrained('bank_reconciliations')
                    ->cascadeOnDelete();
                $table->unsignedInteger('row_number')->default(0);
                $table->date('line_date');
                $table->string('description')->nullable();
                $table->string('reference')->nullable();
                $table->string('direction', 8);
                $table->decimal('amount', 15, 2);
                $table->string('match_status', 16)->default('unmatched');
                $table->foreignId('bank_transaction_id')
                    ->nullable()
                    ->constrained('bank_transactions')
                    ->nullOnDelete();
                $table->foreignId('journal_entry_id')
                    ->nullable()
                    ->constrained('journal_entries')
                    ->nullOnDelete();
                $table->timestamps();

                $table->index(['bank_reconciliation_id', 'match_status']);
                $table->index(['bank_transaction_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_statement_lines');
        Schema::dropIfExists('bank_reconciliations');
    }
};
