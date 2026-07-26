<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('supplier_bill_lines', function (Blueprint $table) {
            $table->decimal('expected_amount', 15, 2)->nullable()->after('amount');
        });
    }

    public function down(): void
    {
        Schema::table('supplier_bill_lines', function (Blueprint $table) {
            $table->dropColumn('expected_amount');
        });
    }
};
