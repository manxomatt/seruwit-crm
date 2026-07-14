<?php

use App\Models\Role;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Removes the external API authentication feature: drops the users table
     * columns it introduced and deletes the "external_*" roles.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['external_id']);
            $table->dropColumn(['external_id', 'status']);
        });

        $externalRoleIds = Role::query()
            ->where('slug', 'like', 'external\_%')
            ->pluck('id');

        DB::table('role_user')->whereIn('role_id', $externalRoleIds)->delete();

        Role::query()->whereIn('id', $externalRoleIds)->delete();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('external_id')->nullable()->unique()->after('email');
            $table->string('status')->default('active')->after('remember_token');
        });
    }
};
