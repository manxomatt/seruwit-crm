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
            $table->timestamp('next_renewal_date')->nullable()->after('renewal_date');
            $table->timestamp('renewal_notification_sent_at')->nullable()->after('next_renewal_date');
            $table->integer('renewal_attempts')->default(0)->after('renewal_notification_sent_at');
            $table->timestamp('last_renewal_attempted_at')->nullable()->after('renewal_attempts');
            $table->boolean('skip_next_renewal')->default(false)->after('last_renewal_attempted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn([
                'next_renewal_date',
                'renewal_notification_sent_at',
                'renewal_attempts',
                'last_renewal_attempted_at',
                'skip_next_renewal',
            ]);
        });
    }
};
