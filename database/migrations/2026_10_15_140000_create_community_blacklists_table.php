<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('community_blacklists')) {
            Schema::create('community_blacklists', function (Blueprint $table): void {
                $table->id();
                $table->string('tenant_id', 100)->nullable()->index();
                $table->string('reporting_company_name', 255)->nullable();
                $table->string('id_number', 50)->index();
                $table->string('phone', 50)->index();
                $table->string('name', 255);
                $table->string('license_number', 50)->nullable();
                $table->string('category', 50)->index(); // car_theft, pawn_attempt, bad_debt, fake_identity, reckless_damage, other
                $table->string('severity', 20)->default('critical'); // critical, warning, caution
                $table->date('incident_date')->nullable();
                $table->text('incident_details');
                $table->string('police_report_number', 100)->nullable();
                $table->json('evidence_urls')->nullable();
                $table->boolean('share_anonymously')->default(true);
                $table->boolean('is_active')->default(true)->index();
                $table->unsignedBigInteger('source_blacklist_id')->nullable()->index();
                $table->timestamps();

                $table->index(['id_number', 'is_active']);
                $table->index(['phone', 'is_active']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('community_blacklists');
    }
};
