<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->string('badge', 100)->nullable()->after('description');
            $table->boolean('is_popular')->default(false)->after('badge');
            $table->json('limits')->nullable()->after('modules');
            $table->json('features_list')->nullable()->after('limits');
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn(['badge', 'is_popular', 'limits', 'features_list']);
        });
    }
};
