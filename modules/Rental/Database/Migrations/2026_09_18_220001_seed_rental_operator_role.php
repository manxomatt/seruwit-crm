<?php

use App\Models\Role;
use App\Support\SystemRolePermissions;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('roles')) {
            return;
        }

        $def = SystemRolePermissions::getSystemRoleDefinition('rental_operator');
        if ($def !== null) {
            Role::query()->firstOrCreate(['slug' => 'rental_operator'], $def);
        }

        SystemRolePermissions::syncAllSystemRoles();
    }

    public function down(): void
    {
        if (! Schema::hasTable('roles')) {
            return;
        }

        Role::query()->where('slug', 'rental_operator')->delete();
    }
};
