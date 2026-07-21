<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            // Optional login for the driver portal. Nullable because a driver
            // record is the durable fleet entity and stays dispatchable without
            // an account; nullOnDelete so removing the user just unlinks the
            // driver rather than deleting the fleet record. A downward link to
            // the core users table — Fleet still references no consumer module.
            $table->foreignId('user_id')->nullable()->after('id')->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
        });
    }
};
