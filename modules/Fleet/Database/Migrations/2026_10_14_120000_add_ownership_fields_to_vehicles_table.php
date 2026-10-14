<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->string('ownership_type', 30)->default('owned')->after('home_base_id');
            $table->foreignId('partner_id')->nullable()->after('ownership_type')->constrained('partners')->nullOnDelete();
            $table->string('contract_number', 100)->nullable()->after('partner_id');
            $table->date('contract_start_date')->nullable()->after('contract_number');
            $table->date('contract_end_date')->nullable()->after('contract_start_date');
            $table->string('settlement_scheme', 30)->nullable()->after('contract_end_date');
            $table->decimal('revenue_share_owner_pct', 5, 2)->nullable()->after('settlement_scheme');
            $table->decimal('revenue_share_tenant_pct', 5, 2)->nullable()->after('revenue_share_owner_pct');
            $table->decimal('fixed_fee_amount', 15, 2)->nullable()->after('revenue_share_tenant_pct');
            $table->string('maintenance_payer', 30)->default('tenant')->after('fixed_fee_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropForeign(['partner_id']);
            $table->dropColumn([
                'ownership_type',
                'partner_id',
                'contract_number',
                'contract_start_date',
                'contract_end_date',
                'settlement_scheme',
                'revenue_share_owner_pct',
                'revenue_share_tenant_pct',
                'fixed_fee_amount',
                'maintenance_payer',
            ]);
        });
    }
};
