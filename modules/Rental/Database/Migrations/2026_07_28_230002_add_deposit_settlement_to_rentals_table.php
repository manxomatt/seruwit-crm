<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rentals', function (Blueprint $table): void {
            $table->string('deposit_status', 20)->default('held')->after('deposit_returned');
            $table->decimal('deposit_applied_amount', 14, 2)->default(0)->after('deposit_status');
            $table->decimal('deposit_refunded_amount', 14, 2)->default(0)->after('deposit_applied_amount');
            $table->timestamp('deposit_settled_at')->nullable()->after('deposit_refunded_amount');
        });
    }

    public function down(): void
    {
        Schema::table('rentals', function (Blueprint $table): void {
            $table->dropColumn([
                'deposit_status',
                'deposit_applied_amount',
                'deposit_refunded_amount',
                'deposit_settled_at',
            ]);
        });
    }
};
