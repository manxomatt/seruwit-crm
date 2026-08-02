<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->string('channel', 20)->default('staff')->after('code')->index();
            $table->string('booker_phone', 30)->nullable()->after('partner_id')->index();
            $table->string('public_token', 64)->nullable()->unique()->after('booker_phone');
        });
    }

    public function down(): void
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->dropColumn(['channel', 'booker_phone', 'public_token']);
        });
    }
};
