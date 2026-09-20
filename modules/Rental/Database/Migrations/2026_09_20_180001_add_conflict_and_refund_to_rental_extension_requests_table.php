<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rental_extension_requests', function (Blueprint $table): void {
            $table->boolean('has_conflict')->default(false)->after('status');
            $table->foreignId('conflicting_rental_id')->nullable()->after('has_conflict')->constrained('rentals')->nullOnDelete();
            $table->string('refund_status', 32)->nullable()->after('conflicting_rental_id');
            $table->decimal('transfer_amount_reported', 14, 2)->nullable()->after('refund_status');
        });
    }

    public function down(): void
    {
        Schema::table('rental_extension_requests', function (Blueprint $table): void {
            $table->dropForeign(['conflicting_rental_id']);
            $table->dropColumn([
                'has_conflict',
                'conflicting_rental_id',
                'refund_status',
                'transfer_amount_reported',
            ]);
        });
    }
};
