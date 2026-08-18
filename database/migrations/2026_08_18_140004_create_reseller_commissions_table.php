<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The commission ledger: one immutable row per confirmed payment order.
 *
 * `payment_order_id` is unique — that single constraint is what makes the whole
 * accrual pipeline idempotent under job retries and double confirmations.
 *
 * `reseller_global_id` deliberately carries no foreign key. It is a snapshot of
 * who earned the money, and deleting a reseller account must not erase or
 * detach financial history.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reseller_commissions', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->uuid('reseller_global_id');
            $table->string('tenant_id');
            $table->unsignedBigInteger('payment_order_id')->unique();
            $table->foreignId('subscription_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('plan_id')->nullable()->constrained()->nullOnDelete();

            $table->string('event', 10);
            $table->decimal('base_amount', 14, 2);
            $table->unsignedBigInteger('rule_id')->nullable();
            $table->string('rate_type', 10);
            $table->decimal('rate_value', 14, 2);
            $table->decimal('commission_amount', 14, 2);
            $table->decimal('tax_withheld_amount', 14, 2)->default(0);
            $table->decimal('net_amount', 14, 2);
            $table->string('currency', 3)->default('IDR');
            $table->unsignedSmallInteger('occurrence')->default(1);

            $table->string('status', 20)->default('pending');
            $table->timestamp('hold_until')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->unsignedBigInteger('payout_id')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('voided_at')->nullable();
            $table->text('void_reason')->nullable();
            $table->timestamps();

            $table->foreign('payment_order_id')->references('id')->on('payment_orders')->cascadeOnDelete();
            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->foreign('rule_id')->references('id')->on('reseller_commission_rules')->nullOnDelete();
            $table->foreign('payout_id')->references('id')->on('reseller_payouts')->nullOnDelete();

            $table->index(['reseller_global_id', 'status']);
            $table->index('tenant_id');
            $table->index('payout_id');
            $table->index('hold_until');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reseller_commissions');
    }
};
