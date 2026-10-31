<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // Core Fixed Assets table (fixed_assets) is provisioned by core accounting migrations.
    }

    public function down(): void
    {
        // Non-destructive for shared accounting fixed_assets table.
    }
};
