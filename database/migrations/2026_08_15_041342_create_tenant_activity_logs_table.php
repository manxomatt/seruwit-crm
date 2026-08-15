<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_activity_logs', function (Blueprint $table): void {
            $table->id();
            $table->string('tenant_id')->index();
            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->string('action', 50);
            $table->string('description');
            $table->unsignedBigInteger('actor_id')->nullable();
            $table->foreign('actor_id')->references('id')->on('users')->nullOnDelete();
            $table->string('actor_name')->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_activity_logs');
    }
};
