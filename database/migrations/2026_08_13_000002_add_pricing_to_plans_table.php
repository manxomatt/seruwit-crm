<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->decimal('price', 12, 2)->nullable()->after('sort_order');
            $table->string('currency', 3)->default('IDR')->after('price');
            $table->string('interval', 20)->default('month')->after('currency');
            $table->integer('trial_days')->default(7)->after('interval');
            $table->boolean('is_trial')->default(false)->after('trial_days');
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn(['is_trial', 'trial_days', 'interval', 'currency', 'price']);
        });
    }
};
