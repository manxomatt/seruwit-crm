<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Commission rate rules, resolved most-specific-first.
 *
 * A null `reseller_global_id` is a platform-wide rule; a null `plan_id` covers
 * every plan. Rules are only ever read at accrual time — the rate that ends up
 * on a commission row is a snapshot, so editing a rule never rewrites history.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reseller_commission_rules', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->uuid('reseller_global_id')->nullable();
            $table->foreignId('plan_id')->nullable()->constrained()->cascadeOnDelete();

            $table->string('applies_to', 10)->default('all');
            $table->string('billing_interval', 10)->nullable();
            $table->string('type', 10);
            $table->decimal('value', 14, 2);
            $table->unsignedSmallInteger('max_occurrences')->nullable();

            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->smallInteger('priority')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('reseller_global_id')->references('global_id')->on('users')->cascadeOnDelete();
            $table->index(['reseller_global_id', 'plan_id', 'applies_to', 'is_active'], 'reseller_rules_lookup_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reseller_commission_rules');
    }
};
