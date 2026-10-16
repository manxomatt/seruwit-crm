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
            if (! Schema::hasColumn('rentals', 'service_type')) {
                $table->string('service_type', 32)->default('self_drive')->after('channel')->index();
            }
            if (! Schema::hasColumn('rentals', 'driver_fee_amount')) {
                $table->decimal('driver_fee_amount', 14, 2)->default(0)->after('one_way_fee_amount');
            }
            if (! Schema::hasColumn('rentals', 'delivery_type')) {
                $table->string('delivery_type', 32)->default('depot')->after('pickup_location_id');
            }
            if (! Schema::hasColumn('rentals', 'delivery_address')) {
                $table->text('delivery_address')->nullable()->after('delivery_type');
            }
            if (! Schema::hasColumn('rentals', 'delivery_landmark')) {
                $table->string('delivery_landmark')->nullable()->after('delivery_address');
            }
            if (! Schema::hasColumn('rentals', 'delivery_fee')) {
                $table->decimal('delivery_fee', 14, 2)->default(0)->after('delivery_landmark');
            }
            if (! Schema::hasColumn('rentals', 'return_delivery_type')) {
                $table->string('return_delivery_type', 32)->default('depot')->after('return_location_id');
            }
            if (! Schema::hasColumn('rentals', 'return_delivery_address')) {
                $table->text('return_delivery_address')->nullable()->after('return_delivery_type');
            }
            if (! Schema::hasColumn('rentals', 'return_delivery_fee')) {
                $table->decimal('return_delivery_fee', 14, 2)->default(0)->after('return_delivery_address');
            }
            if (! Schema::hasColumn('rentals', 'passenger_guarantor_doc_type')) {
                $table->string('passenger_guarantor_doc_type', 64)->nullable()->after('passenger_sim_path');
            }
            if (! Schema::hasColumn('rentals', 'passenger_guarantor_doc_path')) {
                $table->string('passenger_guarantor_doc_path')->nullable()->after('passenger_guarantor_doc_type');
            }
            if (! Schema::hasColumn('rentals', 'emergency_contact_name')) {
                $table->string('emergency_contact_name', 120)->nullable()->after('passenger_guarantor_doc_path');
            }
            if (! Schema::hasColumn('rentals', 'emergency_contact_phone')) {
                $table->string('emergency_contact_phone', 32)->nullable()->after('emergency_contact_name');
            }
            if (! Schema::hasColumn('rentals', 'emergency_contact_relation')) {
                $table->string('emergency_contact_relation', 64)->nullable()->after('emergency_contact_phone');
            }
            if (! Schema::hasColumn('rentals', 'social_media_account')) {
                $table->string('social_media_account', 120)->nullable()->after('emergency_contact_relation');
            }
            if (! Schema::hasColumn('rentals', 'contract_signed_at')) {
                $table->dateTime('contract_signed_at')->nullable()->after('checkout_signed_at');
            }
            if (! Schema::hasColumn('rentals', 'contract_signature_path')) {
                $table->string('contract_signature_path')->nullable()->after('contract_signed_at');
            }
            if (! Schema::hasColumn('rentals', 'contract_signed_ip')) {
                $table->string('contract_signed_ip', 45)->nullable()->after('contract_signature_path');
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
                'service_type',
                'driver_fee_amount',
                'delivery_type',
                'delivery_address',
                'delivery_landmark',
                'delivery_fee',
                'return_delivery_type',
                'return_delivery_address',
                'return_delivery_fee',
                'passenger_guarantor_doc_type',
                'passenger_guarantor_doc_path',
                'emergency_contact_name',
                'emergency_contact_phone',
                'emergency_contact_relation',
                'social_media_account',
                'contract_signed_at',
                'contract_signature_path',
                'contract_signed_ip',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('rentals', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
