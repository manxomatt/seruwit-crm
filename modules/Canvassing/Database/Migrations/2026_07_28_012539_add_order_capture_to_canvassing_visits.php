<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('canvassing_visits', function (Blueprint $table) {
            $table->unsignedBigInteger('sales_order_id')->nullable()->after('plan_id')->index();
            $table->unsignedBigInteger('warehouse_id')->nullable()->after('sales_order_id')->index();
        });

        Schema::create('canvassing_visit_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('canvassing_visit_id')->constrained('canvassing_visits')->cascadeOnDelete();
            $table->unsignedBigInteger('product_id')->index();
            $table->decimal('quantity', 10, 2);
            $table->decimal('unit_price', 15, 2)->default(0);
            $table->string('unit')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('canvassing_visit_order_items');

        Schema::table('canvassing_visits', function (Blueprint $table) {
            $table->dropColumn(['sales_order_id', 'warehouse_id']);
        });
    }
};
