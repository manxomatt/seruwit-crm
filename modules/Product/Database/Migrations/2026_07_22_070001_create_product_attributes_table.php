<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_attributes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type'); // select, color, radio, checkbox
            $table->integer('sort')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('product_attribute_options', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('color')->nullable();
            $table->decimal('extra_price', 15, 4)->nullable();
            $table->integer('sort')->nullable();
            $table->foreignId('attribute_id')->constrained('product_attributes')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_attribute_options');
        Schema::dropIfExists('product_attributes');
    }
};
