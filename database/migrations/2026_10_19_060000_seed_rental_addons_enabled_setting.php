<?php

use App\Models\Tenant;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('settings')) {
            DB::table('settings')->updateOrInsert(
                ['key' => 'rental.addons_enabled'],
                [
                    'group' => 'rental_internal',
                    'value' => '1',
                    'type' => 'boolean',
                    'label' => 'Self-service Add-ons & Extra Accessories Hub',
                    'description' => 'Managed via Rental → Settings → General.',
                    'is_public' => false,
                    'sort_order' => 26,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        // Also ensure all existing tenants get it right away
        if (class_exists(Tenant::class) && Schema::hasTable('tenants')) {
            Tenant::all()->each(function (Tenant $tenant): void {
                $tenant->run(function (): void {
                    if (! Schema::hasTable('settings')) {
                        return;
                    }

                    DB::table('settings')->updateOrInsert(
                        ['key' => 'rental.addons_enabled'],
                        [
                            'group' => 'rental_internal',
                            'value' => '1',
                            'type' => 'boolean',
                            'label' => 'Self-service Add-ons & Extra Accessories Hub',
                            'description' => 'Managed via Rental → Settings → General.',
                            'is_public' => false,
                            'sort_order' => 26,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]
                    );
                });
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('settings')) {
            DB::table('settings')->where('key', 'rental.addons_enabled')->delete();
        }
    }
};
