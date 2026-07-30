<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('partners', function (Blueprint $table) {
            $table->unsignedSmallInteger('payment_term_days')->nullable()->after('credit_limit');
            $table->string('id_number', 50)->nullable()->after('tax_id');
            $table->string('license_number', 50)->nullable()->after('id_number');
            $table->date('license_expires_at')->nullable()->after('license_number');
            $table->boolean('is_blacklisted')->default(false)->after('status');
            $table->string('blacklist_reason')->nullable()->after('is_blacklisted');
            $table->timestamp('blacklisted_at')->nullable()->after('blacklist_reason');
        });
    }

    public function down(): void
    {
        Schema::table('partners', function (Blueprint $table) {
            $table->dropColumn([
                'payment_term_days',
                'id_number',
                'license_number',
                'license_expires_at',
                'is_blacklisted',
                'blacklist_reason',
                'blacklisted_at',
            ]);
        });
    }
};
