<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds the global identifier used to link the central user identity with
     * its synced copies inside tenant schemas (stancl/tenancy resource syncing).
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->uuid('global_id')->nullable()->unique()->after('id');
        });

        User::query()->whereNull('global_id')->eachById(function (User $user): void {
            $user->forceFill(['global_id' => (string) Str::uuid()])->saveQuietly();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('global_id');
        });
    }
};
