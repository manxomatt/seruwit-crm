<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('rentals')) {
            return;
        }

        Schema::table('rentals', function (Blueprint $table): void {
            if (! Schema::hasColumn('rentals', 'deposit_refund_status')) {
                $table->string('deposit_refund_status', 32)->nullable()->after('deposit_status')->index();
            }
            if (! Schema::hasColumn('rentals', 'deposit_refund_bank_name')) {
                $table->string('deposit_refund_bank_name', 100)->nullable()->after('deposit_refund_status');
            }
            if (! Schema::hasColumn('rentals', 'deposit_refund_account_number')) {
                $table->string('deposit_refund_account_number', 50)->nullable()->after('deposit_refund_bank_name');
            }
            if (! Schema::hasColumn('rentals', 'deposit_refund_account_name')) {
                $table->string('deposit_refund_account_name', 150)->nullable()->after('deposit_refund_account_number');
            }
            if (! Schema::hasColumn('rentals', 'deposit_refund_bank_submitted_at')) {
                $table->timestamp('deposit_refund_bank_submitted_at')->nullable()->after('deposit_refund_account_name');
            }
            if (! Schema::hasColumn('rentals', 'deposit_refund_proof_path')) {
                $table->string('deposit_refund_proof_path')->nullable()->after('deposit_refund_bank_submitted_at');
            }
            if (! Schema::hasColumn('rentals', 'deposit_refund_notes')) {
                $table->text('deposit_refund_notes')->nullable()->after('deposit_refund_proof_path');
            }
            if (! Schema::hasColumn('rentals', 'deposit_refunded_at')) {
                $table->timestamp('deposit_refunded_at')->nullable()->after('deposit_refund_notes');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('rentals')) {
            return;
        }

        Schema::table('rentals', function (Blueprint $table): void {
            $columns = [
                'deposit_refund_status',
                'deposit_refund_bank_name',
                'deposit_refund_account_number',
                'deposit_refund_account_name',
                'deposit_refund_bank_submitted_at',
                'deposit_refund_proof_path',
                'deposit_refund_notes',
                'deposit_refunded_at',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('rentals', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
