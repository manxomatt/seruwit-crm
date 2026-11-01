<?php

declare(strict_types=1);

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

        Schema::table('rentals', function (Blueprint $table): void {
            if (! Schema::hasColumn('rentals', 'deposit_refund_status')) {
                $table->string('deposit_refund_status', 32)->nullable()->index();
            }
            if (! Schema::hasColumn('rentals', 'deposit_refund_bank_name')) {
                $table->string('deposit_refund_bank_name', 100)->nullable();
            }
            if (! Schema::hasColumn('rentals', 'deposit_refund_account_number')) {
                $table->string('deposit_refund_account_number', 50)->nullable();
            }
            if (! Schema::hasColumn('rentals', 'deposit_refund_account_name')) {
                $table->string('deposit_refund_account_name', 150)->nullable();
            }
            if (! Schema::hasColumn('rentals', 'deposit_refund_bank_submitted_at')) {
                $table->timestamp('deposit_refund_bank_submitted_at')->nullable();
            }
            if (! Schema::hasColumn('rentals', 'deposit_refund_proof_path')) {
                $table->string('deposit_refund_proof_path')->nullable();
            }
            if (! Schema::hasColumn('rentals', 'deposit_refund_notes')) {
                $table->text('deposit_refund_notes')->nullable();
            }
            if (! Schema::hasColumn('rentals', 'deposit_refunded_at')) {
                $table->timestamp('deposit_refunded_at')->nullable();
            }

            // Self-service enhancements columns if missing
            if (! Schema::hasColumn('rentals', 'service_type')) {
                $table->string('service_type', 32)->default('self_drive')->index();
            }
            if (! Schema::hasColumn('rentals', 'driver_fee_amount')) {
                $table->decimal('driver_fee_amount', 14, 2)->default(0);
            }
            if (! Schema::hasColumn('rentals', 'delivery_type')) {
                $table->string('delivery_type', 32)->default('depot');
            }
            if (! Schema::hasColumn('rentals', 'delivery_address')) {
                $table->text('delivery_address')->nullable();
            }
            if (! Schema::hasColumn('rentals', 'delivery_landmark')) {
                $table->string('delivery_landmark')->nullable();
            }
            if (! Schema::hasColumn('rentals', 'delivery_fee')) {
                $table->decimal('delivery_fee', 14, 2)->default(0);
            }
            if (! Schema::hasColumn('rentals', 'return_delivery_type')) {
                $table->string('return_delivery_type', 32)->default('depot');
            }
            if (! Schema::hasColumn('rentals', 'return_delivery_address')) {
                $table->text('return_delivery_address')->nullable();
            }
            if (! Schema::hasColumn('rentals', 'return_delivery_fee')) {
                $table->decimal('return_delivery_fee', 14, 2)->default(0);
            }
            if (! Schema::hasColumn('rentals', 'passenger_guarantor_doc_type')) {
                $table->string('passenger_guarantor_doc_type', 64)->nullable();
            }
            if (! Schema::hasColumn('rentals', 'passenger_guarantor_doc_path')) {
                $table->string('passenger_guarantor_doc_path')->nullable();
            }
            if (! Schema::hasColumn('rentals', 'emergency_contact_name')) {
                $table->string('emergency_contact_name', 120)->nullable();
            }
            if (! Schema::hasColumn('rentals', 'emergency_contact_phone')) {
                $table->string('emergency_contact_phone', 32)->nullable();
            }
            if (! Schema::hasColumn('rentals', 'emergency_contact_relation')) {
                $table->string('emergency_contact_relation', 64)->nullable();
            }
            if (! Schema::hasColumn('rentals', 'social_media_account')) {
                $table->string('social_media_account', 120)->nullable();
            }
            if (! Schema::hasColumn('rentals', 'contract_signed_at')) {
                $table->dateTime('contract_signed_at')->nullable();
            }
            if (! Schema::hasColumn('rentals', 'contract_signature_path')) {
                $table->string('contract_signature_path')->nullable();
            }
            if (! Schema::hasColumn('rentals', 'contract_signed_ip')) {
                $table->string('contract_signed_ip', 45)->nullable();
            }

            // Corporate contract columns if missing
            if (! Schema::hasColumn('rentals', 'corporate_contract_id')) {
                $table->unsignedBigInteger('corporate_contract_id')->nullable()->index();
            }
            if (! Schema::hasColumn('rentals', 'client_po_number')) {
                $table->string('client_po_number', 64)->nullable();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('rentals')) {
            return;
        }

        Schema::table('rentals', function (Blueprint $table): void {
            $columns = [
                'deposit_refund_status',
                'deposit_refund_bank_name',
                'deposit_refund_account_number',
                'deposit_refund_account_name',
                'deposit_refund_bank_submitted_at',
                'deposit_refund_proof_path',
                'deposit_refund_notes',
                'deposit_refunded_at',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('rentals', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
