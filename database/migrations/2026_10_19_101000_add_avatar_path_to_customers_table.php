<?php

use App\Models\Tenant;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function addColumnIfMissing(): void
    {
        if (Schema::hasTable('customers') && ! Schema::hasColumn('customers', 'avatar_path')) {
            Schema::table('customers', function (Blueprint $table): void {
                $table->string('avatar_path', 2048)->nullable()->after('email');
            });
        }
    }

    public function up(): void
    {
        $this->addColumnIfMissing();

        if (class_exists(Tenant::class) && Schema::hasTable('tenants')) {
            Tenant::all()->each(function (Tenant $tenant): void {
                $tenant->run(function (): void {
                    $this->addColumnIfMissing();
                });
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
