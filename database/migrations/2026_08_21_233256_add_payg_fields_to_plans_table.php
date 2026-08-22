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
        Schema::table('plans', function (Blueprint $table) {
            $table->string('pricing_model', 20)->default('fixed')->after('price');
            $table->foreignId('subscription_tier_id')->nullable()->after('pricing_model')->constrained('subscription_tiers')->cascadeOnDelete();
            $table->boolean('allow_payg_upgrade')->default(true)->after('subscription_tier_id');
            $table->boolean('include_trial')->default(true)->after('allow_payg_upgrade');
            $table->integer('trial_duration_days')->default(30)->after('include_trial');

            $table->index('pricing_model');
            $table->index('subscription_tier_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropIndex(['pricing_model']);
            $table->dropIndex(['subscription_tier_id']);
            $table->dropForeign(['subscription_tier_id']);
            $table->dropColumn('pricing_model');
            $table->dropColumn('subscription_tier_id');
            $table->dropColumn('allow_payg_upgrade');
            $table->dropColumn('include_trial');
            $table->dropColumn('trial_duration_days');
        });
    }
};
