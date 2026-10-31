<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // Core Tax tables (tax_codes, tax_policies) are provisioned by core accounting migrations.
    }

    public function down(): void
    {
        // Non-destructive for shared accounting tax tables.
    }
};
