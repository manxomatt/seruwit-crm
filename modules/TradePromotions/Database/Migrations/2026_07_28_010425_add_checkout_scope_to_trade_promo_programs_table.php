<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trade_promo_programs', function (Blueprint $table) {
            $table->string('mode')->default('trade')->after('type')->index();
            $table->string('scope')->default('global')->after('mode')->index();
            $table->json('channels')->nullable()->after('scope');
        });

        Schema::create('trade_promo_program_warehouses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trade_promo_program_id')->constrained('trade_promo_programs')->cascadeOnDelete();
            $table->unsignedBigInteger('warehouse_id')->index();
            $table->timestamps();
            $table->unique(['trade_promo_program_id', 'warehouse_id'], 'promo_program_warehouse_unique');
        });

        Schema::create('promo_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trade_promo_program_id')->constrained('trade_promo_programs')->cascadeOnDelete();
            $table->string('source_type');
            $table->unsignedBigInteger('source_id');
            $table->unsignedBigInteger('product_id')->nullable()->index();
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['source_type', 'source_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promo_applications');
        Schema::dropIfExists('trade_promo_program_warehouses');

        Schema::table('trade_promo_programs', function (Blueprint $table) {
            $table->dropColumn(['mode', 'scope', 'channels']);
        });
    }
};
