<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Platform-global settings, stored in the CENTRAL schema and managed only by the
 * central admin. Distinct from the tenant-scoped `settings` table (model
 * App\Models\Setting), which each tenant admin manages in their own schema.
 *
 * B1 of docs/central-tenant-separation-design.md. Non-destructive: existing
 * global rows are COPIED here; the central `settings` rows and their readers
 * (CentralAiSettings, SystemMode) are switched over separately in B2.
 */
return new class extends Migration
{
    /**
     * Central `settings` keys that are truly platform-global (read cross-schema
     * via Setting::on(central) today).
     *
     * @var list<string>
     */
    private array $globalKeys = [
        'general.ai_features_enabled',
        'general.system_mode',
    ];

    public function up(): void
    {
        Schema::create('platform_settings', function (Blueprint $table): void {
            $table->id();
            $table->string('key')->unique();
            $table->string('group')->default('general');
            $table->text('value')->nullable();
            $table->string('type')->default('text');
            $table->string('label');
            $table->text('description')->nullable();
            $table->boolean('is_public')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->index(['group', 'sort_order']);
        });

        if (! Schema::hasTable('settings')) {
            return;
        }

        foreach (DB::table('settings')->whereIn('key', $this->globalKeys)->get() as $row) {
            DB::table('platform_settings')->updateOrInsert(
                ['key' => $row->key],
                [
                    'group' => $row->group,
                    'value' => $row->value,
                    'type' => $row->type,
                    'label' => $row->label,
                    'description' => $row->description,
                    'is_public' => $row->is_public,
                    'sort_order' => $row->sort_order,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_settings');
    }
};
