<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('rentals')) {
            return;
        }

        if (! Schema::hasTable('rental_corporate_contracts')) {
            Schema::create('rental_corporate_contracts', function (Blueprint $table) {
                $table->id();
                $table->string('code', 50)->unique();
                $table->foreignId('partner_id')->constrained('partners')->cascadeOnDelete();
                $table->string('title', 180);
                $table->string('po_number', 100)->nullable();
                $table->string('pic_name', 120)->nullable();
                $table->string('pic_phone', 50)->nullable();
                $table->string('pic_email', 120)->nullable();
                $table->date('start_date');
                $table->date('end_date');
                $table->string('billing_cycle', 30)->default('monthly');
                $table->integer('payment_term_days')->default(30);
                $table->decimal('credit_limit', 15, 2)->default(0);
                $table->decimal('discount_pct', 5, 2)->default(0);
                $table->boolean('tax_included')->default(false);
                $table->decimal('withholding_tax_pct', 5, 2)->default(2.00);
                $table->integer('sla_replacement_hours')->default(4);
                $table->boolean('includes_maintenance')->default(true);
                $table->boolean('includes_insurance')->default(true);
                $table->boolean('includes_driver')->default(false);
                $table->string('status', 30)->default('active')->index();
                $table->text('notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(['partner_id', 'status']);
            });
        }

        Schema::table('rentals', function (Blueprint $table) {
            if (! Schema::hasColumn('rentals', 'corporate_contract_id')) {
                $table->foreignId('corporate_contract_id')
                    ->nullable()
                    ->after('partner_id')
                    ->constrained('rental_corporate_contracts')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('rentals', 'client_po_number')) {
                $table->string('client_po_number', 100)
                    ->nullable()
                    ->after('corporate_contract_id');
            }
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('rentals')) {
            Schema::table('rentals', function (Blueprint $table) {
                if (Schema::hasColumn('rentals', 'corporate_contract_id')) {
                    $table->dropConstrainedForeignId('corporate_contract_id');
                }
                if (Schema::hasColumn('rentals', 'client_po_number')) {
                    $table->dropColumn('client_po_number');
                }
            });
        }

        Schema::dropIfExists('rental_corporate_contracts');
    }
};
