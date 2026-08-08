<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rentals', function (Blueprint $table): void {
            $table->string('deposit_proof_path')->nullable()->after('deposit_company_bank_account_id');
            $table->timestamp('deposit_proof_uploaded_at')->nullable()->after('deposit_proof_path');
            $table->string('deposit_proof_status', 20)->nullable()->after('deposit_proof_uploaded_at');
            $table->unsignedBigInteger('deposit_proof_approved_by')->nullable()->after('deposit_proof_status');
            $table->timestamp('deposit_proof_approved_at')->nullable()->after('deposit_proof_approved_by');
            $table->string('deposit_proof_rejected_reason')->nullable()->after('deposit_proof_approved_at');
        });
    }

    public function down(): void
    {
        Schema::table('rentals', function (Blueprint $table): void {
            $table->dropColumn([
                'deposit_proof_path',
                'deposit_proof_uploaded_at',
                'deposit_proof_status',
                'deposit_proof_approved_by',
                'deposit_proof_approved_at',
                'deposit_proof_rejected_reason',
            ]);
        });
    }
};
