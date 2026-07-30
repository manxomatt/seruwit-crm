<?php

use App\Models\Plan;
use Illuminate\Database\Migrations\Migration;

/**
 * Entitle the shuttle (Travel) vertical on the Pro plan.
 *
 * PlanSeeder uses firstOrCreate and must not overwrite live plan edits, so this
 * migration adds the key additively to any existing Pro row.
 */
return new class extends Migration
{
    /** @var list<string> */
    private const MODULES = ['shuttle'];

    public function up(): void
    {
        $pro = Plan::query()->where('key', 'pro')->first();

        if ($pro === null) {
            return;
        }

        $modules = $pro->modules ?? [];
        $changed = false;

        foreach (self::MODULES as $module) {
            if (! in_array($module, $modules, true)) {
                $modules[] = $module;
                $changed = true;
            }
        }

        if (! $changed) {
            return;
        }

        sort($modules);
        $pro->update([
            'modules' => array_values($modules),
            'description' => $pro->description ?: 'Seluruh modul yang tersedia, termasuk rental, canvassing, dan travel shuttle.',
        ]);
    }

    public function down(): void
    {
        $pro = Plan::query()->where('key', 'pro')->first();

        if ($pro === null) {
            return;
        }

        $modules = array_values(array_filter(
            $pro->modules ?? [],
            fn (string $module): bool => ! in_array($module, self::MODULES, true),
        ));

        $pro->update(['modules' => $modules]);
    }
};
