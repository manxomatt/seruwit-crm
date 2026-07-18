<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Platform-wide module kill switch.
 *
 * Central only. A row here overrides every tenant's entitlement/install state
 * for that module key — absence means enabled, so most modules never need a
 * row at all. This is a third, independent axis from Plan (which modules a
 * tenant may buy) and InstalledModule (which modules a tenant currently has).
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('module_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->boolean('is_enabled')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('module_settings');
    }
};
