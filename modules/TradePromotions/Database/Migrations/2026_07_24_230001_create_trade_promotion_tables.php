<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trade_promo_programs', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('type');
            $table->string('status')->default('draft');
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->unsignedBigInteger('principal_id')->nullable()->index();
            $table->string('target_metric')->default('volume');
            $table->decimal('target_amount', 15, 2)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('trade_promo_tiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trade_promo_program_id')->constrained('trade_promo_programs')->cascadeOnDelete();
            $table->unsignedSmallInteger('sort_order')->default(1);
            $table->decimal('min_qty', 12, 2)->nullable();
            $table->decimal('min_value', 15, 2)->nullable();
            $table->decimal('discount_percent', 8, 2)->nullable();
            $table->decimal('discount_amount', 15, 2)->nullable();
            $table->unsignedBigInteger('free_product_id')->nullable()->index();
            $table->decimal('free_qty', 12, 2)->nullable();
            $table->timestamps();
        });

        Schema::create('trade_promo_rebate_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trade_promo_program_id')->constrained('trade_promo_programs')->cascadeOnDelete();
            $table->decimal('rebate_percent', 8, 2)->nullable();
            $table->decimal('rebate_per_unit', 15, 4)->nullable();
            $table->string('calc_basis')->default('qty');
            $table->timestamps();
        });

        Schema::create('trade_promo_program_partners', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trade_promo_program_id')->constrained('trade_promo_programs')->cascadeOnDelete();
            $table->unsignedBigInteger('partner_id');
            $table->timestamps();
            $table->unique(['trade_promo_program_id', 'partner_id'], 'promo_program_partner_unique');
        });

        Schema::create('trade_promo_program_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trade_promo_program_id')->constrained('trade_promo_programs')->cascadeOnDelete();
            $table->unsignedBigInteger('product_id');
            $table->timestamps();
            $table->unique(['trade_promo_program_id', 'product_id'], 'promo_program_product_unique');
        });

        Schema::create('trade_promo_realizations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trade_promo_program_id')->constrained('trade_promo_programs')->cascadeOnDelete();
            $table->unsignedBigInteger('partner_id')->index();
            $table->decimal('realized_qty', 15, 2)->default(0);
            $table->decimal('realized_value', 15, 2)->default(0);
            $table->decimal('target_qty', 15, 2)->nullable();
            $table->decimal('target_value', 15, 2)->nullable();
            $table->decimal('achievement_percent', 8, 2)->default(0);
            $table->string('status')->default('open');
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();
            $table->unique(['trade_promo_program_id', 'partner_id'], 'promo_realization_partner_unique');
        });

        Schema::create('trade_promo_awards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trade_promo_program_id')->constrained('trade_promo_programs')->cascadeOnDelete();
            $table->foreignId('trade_promo_realization_id')->nullable()->constrained('trade_promo_realizations')->nullOnDelete();
            $table->unsignedBigInteger('partner_id')->index();
            $table->string('award_type');
            $table->decimal('amount', 15, 2)->nullable();
            $table->unsignedBigInteger('free_product_id')->nullable()->index();
            $table->decimal('free_qty', 12, 2)->nullable();
            $table->string('status')->default('accrued');
            $table->timestamp('settled_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trade_promo_awards');
        Schema::dropIfExists('trade_promo_realizations');
        Schema::dropIfExists('trade_promo_program_products');
        Schema::dropIfExists('trade_promo_program_partners');
        Schema::dropIfExists('trade_promo_rebate_rules');
        Schema::dropIfExists('trade_promo_tiers');
        Schema::dropIfExists('trade_promo_programs');
    }
};
