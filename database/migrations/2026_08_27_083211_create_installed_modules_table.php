<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tracks which optional modules the central admin has installed on the central
 * dashboard itself.
 *
 * Mirrors the tenant-schema table of the same name (database/migrations/tenant),
 * so App\Models\InstalledModule resolves against whichever schema is active: the
 * tenant's under tenancy, the central schema otherwise. Always-on central modules
 * (config('modules.central_modules')) are provisioned by CentralMigrator and are
 * deliberately absent here — only the optional modules a super admin installs
 * per-workspace get a row.
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
