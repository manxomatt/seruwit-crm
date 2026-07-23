<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('parent_id')->nullable()->after('id')
                ->constrained('products')->cascadeOnDelete();
            $table->decimal('cost', 15, 4)->nullable()->after('price');
            $table->decimal('weight', 15, 4)->nullable()->after('unit');
            $table->decimal('volume', 15, 4)->nullable()->after('weight');
            $table->boolean('is_favorite')->default(false)->after('status');
            $table->boolean('is_storable')->default(true)->after('is_favorite');
            $table->json('images')->nullable()->after('description');
            $table->string('tracking')->default('qty')->after('is_storable');
            $table->text('description_sale')->nullable()->after('description');
            $table->text('description_purchase')->nullable()->after('description_sale');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropConstrainedForeignId('parent_id');
            $table->dropColumn([
                'cost', 'weight', 'volume', 'is_favorite', 'is_storable',
                'images', 'tracking', 'description_sale', 'description_purchase',
            ]);
        });
    }
};
