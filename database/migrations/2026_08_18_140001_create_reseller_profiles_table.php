<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Business profile for a central user holding the `reseller` role.
 *
 * Kept out of `users` so a reseller can be suspended as a partner without
 * touching their login, and so payout/tax details never ride along with the
 * identity record that is synced into every tenant schema.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reseller_profiles', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->uuid('reseller_global_id')->unique();
            $table->uuid('parent_global_id')->nullable();
            $table->string('referral_code', 32)->unique();
            $table->string('company_name')->nullable();
            $table->string('status', 20)->default('active');

            $table->string('default_commission_type', 10)->nullable();
            $table->decimal('default_commission_value', 14, 2)->nullable();
            $table->decimal('renewal_commission_value', 14, 2)->nullable();

            $table->string('payout_bank_name', 100)->nullable();
            $table->string('payout_account_number', 50)->nullable();
            $table->string('payout_account_name')->nullable();
            $table->string('tax_id', 30)->nullable();
            $table->decimal('minimum_payout', 14, 2)->default(0);

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('reseller_global_id')->references('global_id')->on('users')->cascadeOnDelete();
            $table->foreign('parent_global_id')->references('global_id')->on('users')->nullOnDelete();
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reseller_profiles');
    }
};
