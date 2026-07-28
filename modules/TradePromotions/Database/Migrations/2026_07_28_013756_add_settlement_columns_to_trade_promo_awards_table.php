<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trade_promo_awards', function (Blueprint $table) {
            $table->string('settlement_type')->nullable()->after('settled_at');
            $table->unsignedBigInteger('settlement_id')->nullable()->after('settlement_type')->index();
        });
    }

    public function down(): void
    {
        Schema::table('trade_promo_awards', function (Blueprint $table) {
            $table->dropColumn(['settlement_type', 'settlement_id']);
        });
    }
};
