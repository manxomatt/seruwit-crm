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
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->string('subscription_type', 20)
                ->default('payg')
                ->after('status')
                ->comment('trial, payg, fixed-plan');

            $table->integer('current_vehicle_count')
                ->default(0)
                ->after('subscribed_vehicles')
                ->comment('Snapshot vehicle count saat activation');

            $table->date('renewal_date')
                ->nullable()
                ->after('ends_at')
                ->comment('Next billing/renewal date');

            $table->boolean('auto_renew')
                ->default(true)
                ->after('renewal_date');

            $table->timestamp('next_billing_date')
                ->nullable()
                ->after('auto_renew')
                ->comment('For billing cycle tracking');

            $table->index('subscription_type');
            $table->index('renewal_date');
            $table->index(['tenant_id', 'auto_renew']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'auto_renew']);
            $table->dropIndex(['renewal_date']);
            $table->dropIndex(['subscription_type']);
            $table->dropColumn([
                'subscription_type',
                'current_vehicle_count',
                'renewal_date',
                'auto_renew',
                'next_billing_date',
            ]);
        });
    }
};
