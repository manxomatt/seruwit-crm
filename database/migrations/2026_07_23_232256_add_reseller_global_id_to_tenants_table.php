<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->uuid('reseller_global_id')->nullable()->after('status');
            $table->foreign('reseller_global_id')
                ->references('global_id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->dropForeign(['reseller_global_id']);
            $table->dropColumn('reseller_global_id');
        });
    }
};
