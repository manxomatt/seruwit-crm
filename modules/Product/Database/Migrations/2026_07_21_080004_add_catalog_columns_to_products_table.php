<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('brand_id')->nullable()->after('code')->constrained()->nullOnDelete();
            $table->foreignId('product_type_id')->nullable()->after('brand_id')->constrained()->nullOnDelete();
            $table->string('sku')->nullable()->unique()->after('product_type_id');
            $table->string('barcode')->nullable()->after('sku');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['brand_id']);
            $table->dropForeign(['product_type_id']);
            $table->dropColumn(['brand_id', 'product_type_id', 'sku', 'barcode']);
        });
    }
};
