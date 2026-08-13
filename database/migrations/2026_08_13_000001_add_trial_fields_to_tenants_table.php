<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->timestamp('trial_ends_at')->nullable()->after('status');
            $table->boolean('is_trial_expired')->default(false)->after('trial_ends_at');
            $table->index('trial_ends_at');
            $table->index(['is_trial_expired', 'trial_ends_at']);
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropIndex(['is_trial_expired', 'trial_ends_at']);
            $table->dropIndex(['trial_ends_at']);
            $table->dropColumn(['trial_ends_at', 'is_trial_expired']);
        });
    }
};
