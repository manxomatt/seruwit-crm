<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rental_insurance_packages', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->string('name');
            $table->string('period_type', 20)->default('daily');
            $table->decimal('amount', 15, 2);
            $table->decimal('deductible_amount', 15, 2)->default(0);
            $table->decimal('coverage_limit', 15, 2)->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::table('rentals', function (Blueprint $table) {
            $table->foreignId('insurance_package_id')
                ->nullable()
                ->after('one_way_fee_amount')
                ->constrained('rental_insurance_packages')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->dropConstrainedForeignId('insurance_package_id');
        });

        Schema::dropIfExists('rental_insurance_packages');
    }
};
