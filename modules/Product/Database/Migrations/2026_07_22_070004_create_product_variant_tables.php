<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_product_attributes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('attribute_id')->constrained('product_attributes')->cascadeOnDelete();
            $table->integer('sort')->nullable();
            $table->timestamps();

            $table->unique(['product_id', 'attribute_id']);
        });

        Schema::create('product_attribute_values', function (Blueprint $table) {
            $table->id();
            $table->decimal('extra_price', 15, 4)->nullable();
            $table->foreignId('product_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('attribute_id')->nullable()->constrained('product_attributes')->cascadeOnDelete();
            $table->foreignId('product_attribute_id')->constrained('product_product_attributes')->cascadeOnDelete();
            $table->foreignId('attribute_option_id')->constrained('product_attribute_options')->cascadeOnDelete();
        });

        Schema::create('product_combinations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_attribute_value_id')->constrained('product_attribute_values')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_combinations');
        Schema::dropIfExists('product_attribute_values');
        Schema::dropIfExists('product_product_attributes');
    }
};
