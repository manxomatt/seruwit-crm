<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_lists', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->nullable()->unique();
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('price_list_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('price_list_id')->constrained('price_lists')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->decimal('unit_price', 15, 2);
            $table->timestamps();

            $table->unique(['price_list_id', 'product_id']);
        });

        Schema::table('partners', function (Blueprint $table) {
            $table->foreignId('price_list_id')
                ->nullable()
                ->after('credit_limit')
                ->constrained('price_lists')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('partners', function (Blueprint $table) {
            $table->dropConstrainedForeignId('price_list_id');
        });

        Schema::dropIfExists('price_list_items');
        Schema::dropIfExists('price_lists');
    }
};
