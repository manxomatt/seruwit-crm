<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('invoices', 'amount_paid')) {
            return;
        }

        Schema::table('invoices', function (Blueprint $table) {
            $table->decimal('amount_paid', 15, 2)->default(0)->after('total');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('invoices', 'amount_paid')) {
            return;
        }

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn('amount_paid');
        });
    }
};
