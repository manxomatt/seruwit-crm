<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('delivery_orders', function (Blueprint $table) {
            $table->unsignedBigInteger('goods_issue_note_id')->nullable()->after('partner_id');
            $table->unique('goods_issue_note_id');
        });

        Schema::table('delivery_order_items', function (Blueprint $table) {
            $table->unsignedBigInteger('goods_issue_note_item_id')->nullable()->after('product_id');
            $table->unique('goods_issue_note_item_id');
        });
    }

    public function down(): void
    {
        Schema::table('delivery_order_items', function (Blueprint $table) {
            $table->dropUnique(['goods_issue_note_item_id']);
            $table->dropColumn('goods_issue_note_item_id');
        });

        Schema::table('delivery_orders', function (Blueprint $table) {
            $table->dropUnique(['goods_issue_note_id']);
            $table->dropColumn('goods_issue_note_id');
        });
    }
};
