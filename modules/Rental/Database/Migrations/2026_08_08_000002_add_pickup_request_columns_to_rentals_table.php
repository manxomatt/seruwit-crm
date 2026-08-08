<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rentals', function (Blueprint $table): void {
            $table->timestamp('pickup_requested_at')->nullable()->after('deposit_proof_rejected_reason');
            $table->string('pickup_request_status', 20)->nullable()->after('pickup_requested_at');
            $table->string('pickup_customer_signature_path')->nullable()->after('pickup_request_status');
            $table->boolean('pickup_terms_agreed')->default(false)->after('pickup_customer_signature_path');
            $table->text('pickup_notes')->nullable()->after('pickup_terms_agreed');
        });
    }

    public function down(): void
    {
        Schema::table('rentals', function (Blueprint $table): void {
            $table->dropColumn([
                'pickup_requested_at',
                'pickup_request_status',
                'pickup_customer_signature_path',
                'pickup_terms_agreed',
                'pickup_notes',
            ]);
        });
    }
};
