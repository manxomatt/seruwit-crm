<?php

use App\Models\Tenant;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function addColumnIfMissing(): void
    {
        if (Schema::hasTable('partners') && ! Schema::hasColumn('partners', 'kyc_extracted_name')) {
            Schema::table('partners', function (Blueprint $table): void {
                $table->string('kyc_extracted_name')->nullable()->after('kyc_status');
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
        if (Schema::hasTable('partners') && Schema::hasColumn('partners', 'kyc_extracted_name')) {
            Schema::table('partners', function (Blueprint $table): void {
                $table->dropColumn('kyc_extracted_name');
            });
        }
    }
};
