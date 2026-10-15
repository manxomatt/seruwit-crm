<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partner_blacklists', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('partner_id')->nullable()->constrained('partners')->nullOnDelete();
            $table->string('id_number', 50)->index();
            $table->string('phone', 50)->index();
            $table->string('name', 255);
            $table->string('license_number', 50)->nullable();
            $table->string('category', 50); // car_theft, pawn_attempt, bad_debt, fake_identity, reckless_damage, other
            $table->string('severity', 20)->default('critical'); // critical, warning, caution
            $table->date('incident_date')->nullable();
            $table->text('incident_details');
            $table->string('police_report_number', 100)->nullable();
            $table->json('evidence_urls')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->foreignId('reported_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['id_number', 'is_active']);
            $table->index(['phone', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_blacklists');
    }
};
