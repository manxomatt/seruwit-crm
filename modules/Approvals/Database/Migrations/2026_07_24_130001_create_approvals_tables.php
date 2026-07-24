<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approval_policies', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('name');
            $table->string('trigger_type')->index();
            $table->boolean('is_active')->default(true);
            $table->json('conditions')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('approval_policy_levels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('approval_policy_id')->constrained('approval_policies')->cascadeOnDelete();
            $table->unsignedSmallInteger('level');
            $table->string('name');
            $table->string('approver_type');
            $table->string('approver_value');
            $table->timestamps();

            $table->unique(['approval_policy_id', 'level']);
        });

        Schema::create('approval_requests', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('approval_policy_id')->constrained('approval_policies');
            $table->string('trigger_type')->index();
            $table->morphs('subject');
            $table->string('status')->default('pending')->index();
            $table->unsignedSmallInteger('current_level')->default(1);
            $table->json('payload')->nullable();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'current_level']);
        });

        Schema::create('approval_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('approval_request_id')->constrained('approval_requests')->cascadeOnDelete();
            $table->unsignedSmallInteger('level');
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action');
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_actions');
        Schema::dropIfExists('approval_requests');
        Schema::dropIfExists('approval_policy_levels');
        Schema::dropIfExists('approval_policies');
    }
};
