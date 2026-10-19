<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('customers') && ! Schema::hasColumn('customers', 'avatar_path')) {
            Schema::table('customers', function (Blueprint $table): void {
                $table->string('avatar_path', 2048)->nullable()->after('email');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('customers') && Schema::hasColumn('customers', 'avatar_path')) {
            Schema::table('customers', function (Blueprint $table): void {
                $table->dropColumn('avatar_path');
            });
        }
    }
};
