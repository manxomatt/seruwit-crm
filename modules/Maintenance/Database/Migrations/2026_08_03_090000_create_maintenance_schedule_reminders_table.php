<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenance_schedule_reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('maintenance_schedule_id')
                ->constrained('maintenance_schedules')
                ->cascadeOnDelete();
            $table->string('kind', 20);
            $table->string('target', 64);
            $table->timestamp('sent_at');
            $table->timestamps();

            $table->unique(['maintenance_schedule_id', 'kind', 'target'], 'maint_sched_reminders_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_schedule_reminders');
    }
};
