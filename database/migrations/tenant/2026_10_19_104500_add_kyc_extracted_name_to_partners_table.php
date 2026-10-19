<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('partners') && ! Schema::hasColumn('partners', 'kyc_extracted_name')) {
            Schema::table('partners', function (Blueprint $table): void {
                $table->string('kyc_extracted_name')->nullable()->after('kyc_status');
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
