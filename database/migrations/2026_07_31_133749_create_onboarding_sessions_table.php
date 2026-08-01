<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('onboarding_sessions', function (Blueprint $table) {
            $table->id();
            $table->uuid('global_user_id')->index();
            $table->string('company_name');
            $table->string('subdomain');
            $table->json('verticals');
            $table->string('status', 32)->default('pending');
            $table->string('tenant_id')->nullable()->index();
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->unique('global_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('onboarding_sessions');
    }
};
