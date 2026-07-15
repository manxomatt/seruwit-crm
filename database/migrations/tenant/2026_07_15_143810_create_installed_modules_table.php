<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tracks which optional modules a tenant has installed.
 *
 * Lives in the tenant schema rather than centrally so the per-request check is a
 * local query, and deliberately not derived from the permissions table: RoleSeeder
 * syncs every permission back onto the admin role on any re-seed, which would
 * silently resurrect an uninstalled module.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('installed_modules', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->timestamp('installed_at');
            // Set on uninstall; the module's tables and data survive until the
            // grace period lapses and modules:purge-expired drops them.
            $table->timestamp('uninstalled_at')->nullable();
            $table->timestamps();

            $table->index('uninstalled_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('installed_modules');
    }
};
