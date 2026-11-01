<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('invoices') && ! Schema::hasColumn('invoices', 'revenue_role')) {
            Schema::table('invoices', function (Blueprint $table): void {
                $table->string('revenue_role', 64)->nullable()->after('tax_calculation');
            });
        }

        if (Schema::hasTable('invoice_lines') && ! Schema::hasColumn('invoice_lines', 'revenue_role')) {
            Schema::table('invoice_lines', function (Blueprint $table): void {
                $table->string('revenue_role', 64)->nullable()->after('source_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('invoice_lines') && Schema::hasColumn('invoice_lines', 'revenue_role')) {
            Schema::table('invoice_lines', function (Blueprint $table): void {
                $table->dropColumn('revenue_role');
            });
        }

        if (Schema::hasTable('invoices') && Schema::hasColumn('invoices', 'revenue_role')) {
            Schema::table('invoices', function (Blueprint $table): void {
                $table->dropColumn('revenue_role');
            });
        }
    }
};
