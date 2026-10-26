<?php

use App\Models\Tenant;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $payload = [
            'group' => 'appearance',
            'value' => '1',
            'type' => 'boolean',
            'label' => 'Show Quick Actions on Dashboard',
            'description' => 'Display or hide the quick action shortcut section on the tenant dashboard.',
            'is_public' => true,
            'sort_order' => 7,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        if (Schema::hasTable('settings')) {
            DB::table('settings')->updateOrInsert(
                ['key' => 'appearance.show_dashboard_quick_actions'],
                $payload
            );
        }

        if (class_exists(Tenant::class) && Schema::hasTable('tenants')) {
            Tenant::all()->each(function (Tenant $tenant) use ($payload): void {
                $tenant->run(function () use ($payload): void {
                    if (! Schema::hasTable('settings')) {
                        return;
                    }

                    DB::table('settings')->updateOrInsert(
                        ['key' => 'appearance.show_dashboard_quick_actions'],
                        $payload
                    );
                });
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('settings')) {
            DB::table('settings')->where('key', 'appearance.show_dashboard_quick_actions')->delete();
        }

        if (class_exists(Tenant::class) && Schema::hasTable('tenants')) {
            Tenant::all()->each(function (Tenant $tenant): void {
                $tenant->run(function (): void {
                    if (Schema::hasTable('settings')) {
                        DB::table('settings')->where('key', 'appearance.show_dashboard_quick_actions')->delete();
                    }
                });
            });
        }
    }
};
