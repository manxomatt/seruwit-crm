<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('partners', function (Blueprint $table) {
            $table->string('kyc_status', 30)->default('unverified')->after('status');
            $table->timestamp('kyc_submitted_at')->nullable()->after('kyc_status');
            $table->timestamp('kyc_verified_at')->nullable()->after('kyc_submitted_at');
            $table->unsignedBigInteger('kyc_verified_by')->nullable()->after('kyc_verified_at');
            $table->text('kyc_rejected_reason')->nullable()->after('kyc_verified_by');
            $table->string('id_card_photo_path')->nullable()->after('picture_url');
            $table->string('driver_license_photo_path')->nullable()->after('id_card_photo_path');
            $table->string('selfie_photo_path')->nullable()->after('driver_license_photo_path');
            $table->string('emergency_contact_name')->nullable()->after('license_expires_at');
            $table->string('emergency_contact_phone', 50)->nullable()->after('emergency_contact_name');
            $table->string('emergency_contact_relationship', 100)->nullable()->after('emergency_contact_phone');

            $table->index('kyc_status');
        });
    }

    public function down(): void
    {
        Schema::table('partners', function (Blueprint $table) {
            $table->dropIndex(['kyc_status']);
            $table->dropColumn([
                'kyc_status',
                'kyc_submitted_at',
                'kyc_verified_at',
                'kyc_verified_by',
                'kyc_rejected_reason',
                'id_card_photo_path',
                'driver_license_photo_path',
                'selfie_photo_path',
                'emergency_contact_name',
                'emergency_contact_phone',
                'emergency_contact_relationship',
            ]);
        });
    }
};
