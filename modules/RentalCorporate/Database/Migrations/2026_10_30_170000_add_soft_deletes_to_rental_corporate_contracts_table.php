<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('rental_corporate_contracts') && ! Schema::hasColumn('rental_corporate_contracts', 'deleted_at')) {
            Schema::table('rental_corporate_contracts', function (Blueprint $table) {
                $table->softDeletes();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('rental_corporate_contracts') && Schema::hasColumn('rental_corporate_contracts', 'deleted_at')) {
            Schema::table('rental_corporate_contracts', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
    }
};
