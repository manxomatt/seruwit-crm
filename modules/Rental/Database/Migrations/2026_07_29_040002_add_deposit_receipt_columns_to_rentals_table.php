<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rentals', function (Blueprint $table): void {
            $table->timestamp('deposit_received_at')->nullable()->after('deposit_settled_at');
            $table->string('deposit_payment_method', 20)->nullable()->after('deposit_received_at');
            $table->unsignedBigInteger('deposit_company_bank_account_id')->nullable()->after('deposit_payment_method');
        });
    }

    public function down(): void
    {
        Schema::table('rentals', function (Blueprint $table): void {
            $table->dropColumn([
                'deposit_received_at',
                'deposit_payment_method',
                'deposit_company_bank_account_id',
            ]);
        });
    }
};
