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
            $table->date('stnk_five_year_expires_at')->nullable()->after('stnk_expires_at');
            $table->string('insurance_provider', 100)->nullable()->after('stnk_five_year_expires_at');
            $table->string('insurance_policy_number', 100)->nullable()->after('insurance_provider');
            $table->string('insurance_type', 30)->nullable()->after('insurance_policy_number'); // all_risk, tlo, comprehensive
            $table->date('insurance_expires_at')->nullable()->after('insurance_type');
        });

        Schema::create('vehicle_compliance_renewals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained('vehicles')->cascadeOnDelete();
            $table->string('document_type', 30); // stnk_annual, stnk_five_year, insurance, kir
            $table->date('previous_expires_at')->nullable();
            $table->date('new_expires_at');
            $table->date('renewal_date');
            $table->decimal('cost', 15, 2)->default(0);
            $table->string('payer', 30)->default('tenant'); // tenant, owner, shared
            $table->foreignId('partner_id')->nullable()->constrained('partners')->nullOnDelete();
            $table->string('reference_number', 100)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['vehicle_id', 'document_type']);
            $table->index('renewal_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicle_compliance_renewals');

        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropColumn([
                'stnk_five_year_expires_at',
                'insurance_provider',
                'insurance_policy_number',
                'insurance_type',
                'insurance_expires_at',
            ]);
        });
    }
};
