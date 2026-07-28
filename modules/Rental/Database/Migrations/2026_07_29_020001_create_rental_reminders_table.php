<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rental_reminders', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('rental_id')->constrained('rentals')->cascadeOnDelete();
            // ending | overdue
            $table->string('kind', 32);
            $table->unsignedSmallInteger('days_before');
            $table->timestamp('sent_at');
            $table->timestamps();

            $table->unique(['rental_id', 'kind', 'days_before']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_reminders');
    }
};
