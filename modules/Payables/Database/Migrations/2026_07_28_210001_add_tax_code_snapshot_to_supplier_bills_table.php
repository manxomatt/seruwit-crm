<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('supplier_bills', function (Blueprint $table): void {
            $table->unsignedBigInteger('tax_code_id')->nullable()->after('tax_rate');
            $table->string('tax_code', 32)->nullable()->after('tax_code_id');
            $table->string('tax_calculation', 16)->nullable()->after('tax_code');
            $table->index('tax_code_id');
        });
    }

    public function down(): void
    {
        Schema::table('supplier_bills', function (Blueprint $table): void {
            $table->dropIndex(['tax_code_id']);
            $table->dropColumn(['tax_code_id', 'tax_code', 'tax_calculation']);
        });
    }
};
