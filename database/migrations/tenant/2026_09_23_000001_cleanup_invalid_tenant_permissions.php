<?php

use App\Support\PermissionRepair;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        PermissionRepair::repair();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No reversal needed for invalid permissions removal
    }
};
