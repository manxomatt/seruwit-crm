<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('good_receipt_notes', function (Blueprint $table) {
            $table->decimal('freight_amount', 15, 2)->default(0)->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('good_receipt_notes', function (Blueprint $table) {
            $table->dropColumn('freight_amount');
        });
    }
};
