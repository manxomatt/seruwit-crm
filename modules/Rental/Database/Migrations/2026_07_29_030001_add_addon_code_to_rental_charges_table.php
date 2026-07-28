<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rental_charges', function (Blueprint $table): void {
            $table->string('addon_code', 32)->nullable()->after('kind');
        });
    }

    public function down(): void
    {
        Schema::table('rental_charges', function (Blueprint $table): void {
            $table->dropColumn('addon_code');
        });
    }
};
