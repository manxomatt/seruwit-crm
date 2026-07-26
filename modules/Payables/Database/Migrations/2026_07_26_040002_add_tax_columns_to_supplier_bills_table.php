<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('supplier_bills', function (Blueprint $table) {
            $table->boolean('tax_enabled')->default(false)->after('due_date');
            $table->decimal('tax_rate', 8, 2)->default(0)->after('tax_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('supplier_bills', function (Blueprint $table) {
            $table->dropColumn(['tax_enabled', 'tax_rate']);
        });
    }
};
