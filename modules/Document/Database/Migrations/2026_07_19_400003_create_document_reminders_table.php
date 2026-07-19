<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_reminders', function (Blueprint $table) {
            $table->id();
            // CASCADE: when a document is hard-deleted (purge), its reminders go too.
            $table->foreignId('document_id')->constrained('documents')->cascadeOnDelete();
            $table->unsignedSmallInteger('days_before');
            $table->date('remind_at')->index();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            // One reminder row per (document, threshold); prevents duplicate sends.
            $table->unique(['document_id', 'days_before']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_reminders');
    }
};
